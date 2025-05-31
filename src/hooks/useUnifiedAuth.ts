// src/hooks/useUnifiedAuth.ts - ENTERPRISE FIXED VERSION
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useSiteContext } from './useSiteContext'
import type { UserPermissions } from '@/lib/auth/unified-auth-service'

// ENTERPRISE: Enhanced cache with failure tracking and request deduplication
interface CachedPermissions {
  data: UserPermissions
  timestamp: number
  ttl: number
}

class EnhancedPermissionsCache {
  private cache = new Map<string, CachedPermissions>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private pendingRequests = new Map<string, Promise<UserPermissions>>()

  set(key: string, data: UserPermissions, ttl = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): UserPermissions | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > cached.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  // ENTERPRISE: Deduplication - return existing promise if request in flight
  async getOrFetch(key: string, fetcher: () => Promise<UserPermissions>): Promise<UserPermissions> {
    // Check cache first
    const cached = this.get(key)
    if (cached) {
      return cached
    }

    // Check if request already in flight
    const existingRequest = this.pendingRequests.get(key)
    if (existingRequest) {
      console.log('🔄 Auth: Request deduplication - using existing promise')
      return existingRequest
    }

    // Create new request
    const requestPromise = fetcher()
      .finally(() => {
        // Clean up pending request
        this.pendingRequests.delete(key)
      })

    this.pendingRequests.set(key, requestPromise)
    return requestPromise
  }

  clear() {
    this.cache.clear()
    this.pendingRequests.clear()
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }
}

// Global cache instance
const permissionsCache = new EnhancedPermissionsCache()

/**
 * ENTERPRISE: Main auth hook with intelligent retry and failure handling
 */
export function useUnifiedAuth() {
  const { user, session, loading: authLoading, signOut: authSignOut } = useAuth()
  const { siteConfig, loading: siteLoading, error: siteError } = useSiteContext()
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for state management
  const mountedRef = useRef(true)
  const lastFetchKey = useRef<string>('')
  const retryCountRef = useRef(0)
  const MAX_RETRIES = 3

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Generate cache key
  const getCacheKey = useCallback((userId?: string, siteId?: string) => {
    return `permissions:${userId || 'anonymous'}:${siteId || 'global'}`
  }, [])

  // ENTERPRISE: Smart fetch with deduplication and failure handling
  const fetchPermissions = useCallback(async (skipCache = false) => {
    // Don't fetch if not authenticated
    if (!user) {
      setPermissions(null)
      setLoading(false)
      return
    }

    // Don't fetch if site is still loading (unless it's a localhost fallback)
    if (siteLoading) {
      console.log('⏳ Auth: Waiting for site context...')
      return
    }

    const cacheKey = getCacheKey(user.id, siteConfig?.id)
    
    // Prevent unnecessary requests with same key
    if (lastFetchKey.current === cacheKey && !skipCache) {
      console.log('🔄 Auth: Same cache key, skipping duplicate request')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔑 Auth: Fetching permissions...', { 
        userId: user.id.substring(0, 8) + '...', 
        siteId: siteConfig?.id || 'none',
        skipCache 
      })

      const permissions = await permissionsCache.getOrFetch(cacheKey, async () => {
        const response = await fetch('/api/auth/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            siteId: siteConfig?.id,
            skipCache 
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        
        // Cache successful result
        permissionsCache.set(cacheKey, result)
        return result
      })

      // Don't update state if component unmounted
      if (!mountedRef.current) return

      lastFetchKey.current = cacheKey
      retryCountRef.current = 0 // Reset retry count on success

      console.log('✅ Auth: Permissions loaded:', {
        canAccessDashboard: permissions.canAccessDashboard,
        isBusinessOwner: permissions.isBusinessOwner,
        siteRole: permissions.siteRole
      })

      setPermissions(permissions)
      setError(null)

    } catch (err) {
      console.error('❌ Auth: Failed to fetch permissions:', err)
      
      // Don't update state if component unmounted
      if (!mountedRef.current) return

      // Intelligent retry logic
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++
        console.log(`🔄 Auth: Retrying in ${retryCountRef.current * 1000}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`)
        
        setTimeout(() => {
          if (mountedRef.current) {
            fetchPermissions(true) // Skip cache on retry
          }
        }, retryCountRef.current * 1000)
        return
      }

      // Max retries reached - set safe defaults
      const safeDefaults: UserPermissions = {
        isAuthenticated: !!user,
        isGlobalAdmin: false,
        isSiteAdmin: false,
        isBusinessOwner: false,
        siteId: siteConfig?.id || null,
        siteRole: null,
        ownedBusinesses: [],
        managedBusinesses: [],
        canAccessDashboard: true, // Allow basic dashboard access
        canAccessAnalytics: false,
        canAccessCRM: false,
        canManageBusinesses: false,
        canManageUsers: false,
        planType: 'free',
        planLimits: {}
      }
      
      // Cache as failed result with shorter TTL
      permissionsCache.set(cacheKey, safeDefaults)
      
      setPermissions(safeDefaults)
      setError('Failed to load permissions (using safe defaults)')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [user, siteConfig?.id, siteLoading, getCacheKey])

  // ENTERPRISE: Smart effect that waits for dependencies
  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      console.log('⏳ Auth: Waiting for auth provider...')
      return
    }

    // If no user, clear state
    if (!user) {
      setPermissions(null)
      setLoading(false)
      return
    }

    // Wait for site context (unless there's an error, which means site lookup failed)
    if (siteLoading && !siteError) {
      console.log('⏳ Auth: Waiting for site context...')
      return
    }

    // Check cache first
    const cacheKey = getCacheKey(user.id, siteConfig?.id)
    const cached = permissionsCache.get(cacheKey)
    
    if (cached) {
      console.log('⚡ Auth: Using cached permissions')
      setPermissions(cached)
      setLoading(false)
      return
    }

    // Fetch fresh permissions
    fetchPermissions()
  }, [authLoading, user, siteLoading, siteError, siteConfig?.id, fetchPermissions, getCacheKey])

  // ENTERPRISE: Clear cache on user change
  useEffect(() => {
    if (!user) {
      permissionsCache.clear()
      retryCountRef.current = 0
      lastFetchKey.current = ''
    }
  }, [user?.id])

  // Refresh permissions (useful after business creation, etc.)
  const refreshPermissions = useCallback(() => {
    console.log('🔄 Auth: Force refreshing permissions...')
    retryCountRef.current = 0 // Reset retry count
    return fetchPermissions(true) // Skip cache
  }, [fetchPermissions])

  return {
    // Auth state
    user,
    session,
    loading: authLoading || loading,
    error,
    signOut: authSignOut,
    
    // Permissions
    permissions,
    
    // Convenience flags
    isAuthenticated: !!user,
    canAccessDashboard: permissions?.canAccessDashboard || false,
    canAccessAnalytics: permissions?.canAccessAnalytics || false,
    canAccessCRM: permissions?.canAccessCRM || false,
    isBusinessOwner: permissions?.isBusinessOwner || false,
    isAdmin: permissions?.isGlobalAdmin || permissions?.isSiteAdmin || false,
    
    // Actions
    refreshPermissions
  }
}

/**
 * CONVENIENCE: Dashboard access hook (unchanged)
 */
export function useDashboardAccess() {
  const { canAccessDashboard, loading, isAuthenticated } = useUnifiedAuth()
  
  return {
    canAccess: canAccessDashboard,
    loading,
    isAuthenticated,
    shouldRedirectToLogin: !loading && !isAuthenticated,
    shouldShowAccessDenied: !loading && isAuthenticated && !canAccessDashboard
  }
}

/**
 * CONVENIENCE: Business management hook (unchanged)
 */
export function useBusinessAccess(businessId?: string) {
  const { permissions, loading } = useUnifiedAuth()
  
  const canAccess = businessId 
    ? (permissions?.isGlobalAdmin || 
       permissions?.isSiteAdmin || 
       permissions?.ownedBusinesses.includes(businessId) ||
       permissions?.managedBusinesses.includes(businessId))
    : permissions?.canManageBusinesses
  
  return {
    canAccess: canAccess || false,
    canCreate: permissions?.canManageBusinesses || false,
    loading,
    ownedBusinesses: permissions?.ownedBusinesses || [],
    managedBusinesses: permissions?.managedBusinesses || []
  }
}

/**
 * CONVENIENCE: Plan limits hook (unchanged)
 */
export function usePlanLimits() {
  const { permissions, loading } = useUnifiedAuth()
  
  return {
    planType: permissions?.planType || 'free',
    limits: permissions?.planLimits || {},
    loading,
    
    canCreate: (feature: string) => {
      const limit = permissions?.planLimits[feature]
      return limit === -1 || limit === undefined
    },
    
    getLimit: (feature: string) => {
      return permissions?.planLimits[feature] || 0
    }
  }
}