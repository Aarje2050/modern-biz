// src/hooks/useUnifiedAuth.ts - ENTERPRISE OPTIMIZED VERSION
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useSiteContext } from './useSiteContext'
import type { UserPermissions } from '@/lib/auth/unified-auth-service'

// ENTERPRISE: In-memory cache with TTL
interface CachedPermissions {
  data: UserPermissions
  timestamp: number
  ttl: number
}

class PermissionsCache {
  private cache = new Map<string, CachedPermissions>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

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

  clear() {
    this.cache.clear()
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }
}

// Global cache instance
const permissionsCache = new PermissionsCache()

/**
 * ENTERPRISE: Main auth hook with optimized permissions caching
 */
export function useUnifiedAuth() {
  const { user, session, loading: authLoading, signOut: authSignOut } = useAuth()
  const { siteConfig } = useSiteContext()
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for preventing unnecessary requests
  const fetchingRef = useRef(false)
  const lastFetchKey = useRef<string>('')

  // Generate cache key
  const getCacheKey = useCallback((userId?: string, siteId?: string) => {
    return `permissions:${userId || 'anonymous'}:${siteId || 'global'}`
  }, [])

  // ENTERPRISE: Optimized fetch with caching and deduplication
  const fetchPermissions = useCallback(async (skipCache = false) => {
    if (!user) {
      setPermissions(null)
      setLoading(false)
      return
    }

    const cacheKey = getCacheKey(user.id, siteConfig?.id)
    
    // Prevent duplicate requests
    if (fetchingRef.current && lastFetchKey.current === cacheKey) {
      console.log('🔄 Auth: Request already in progress, skipping...')
      return
    }

    // Check cache first (unless explicitly skipping)
    if (!skipCache) {
      const cachedPermissions = permissionsCache.get(cacheKey)
      if (cachedPermissions) {
        console.log('⚡ Auth: Using cached permissions')
        setPermissions(cachedPermissions)
        setLoading(false)
        return
      }
    }

    try {
      fetchingRef.current = true
      lastFetchKey.current = cacheKey
      setLoading(true)
      setError(null)

      console.log('🔑 Auth: Fetching fresh permissions...')

      const response = await fetch('/api/auth/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          siteId: siteConfig?.id,
          skipCache 
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const perms = await response.json()
      
      // Cache the permissions
      permissionsCache.set(cacheKey, perms)
      
      console.log('✅ Auth: Permissions loaded and cached:', {
        canAccessDashboard: perms.canAccessDashboard,
        isBusinessOwner: perms.isBusinessOwner,
        siteRole: perms.siteRole
      })

      setPermissions(perms)
    } catch (err) {
      console.error('❌ Auth: Failed to fetch permissions:', err)
      setError('Failed to load permissions')
      
      // Set safe defaults
      const safeDefaults: UserPermissions = {
        isAuthenticated: !!user,
        isGlobalAdmin: false,
        isSiteAdmin: false,
        isBusinessOwner: false,
        siteId: siteConfig?.id || null,
        siteRole: null,
        ownedBusinesses: [],
        managedBusinesses: [],
        canAccessDashboard: false,
        canAccessAnalytics: false,
        canAccessCRM: false,
        canManageBusinesses: false,
        canManageUsers: false,
        planType: 'free',
        planLimits: {}
      }
      
      setPermissions(safeDefaults)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [user, siteConfig?.id, getCacheKey])

  // ENTERPRISE: Load permissions with Page Visibility optimization
  useEffect(() => {
    if (!authLoading && user) {
      // Only fetch if we don't have cached permissions
      const cacheKey = getCacheKey(user.id, siteConfig?.id)
      if (!permissionsCache.has(cacheKey)) {
        fetchPermissions()
      } else {
        // Use cached permissions immediately
        const cached = permissionsCache.get(cacheKey)
        if (cached) {
          setPermissions(cached)
          setLoading(false)
        }
      }
    } else if (!authLoading && !user) {
      setPermissions(null)
      setLoading(false)
    }
  }, [authLoading, user, siteConfig?.id, fetchPermissions, getCacheKey])

  // ENTERPRISE: Handle page visibility changes (prevent tab switching refetches)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Only refresh if cache is old (>10 minutes)
        const cacheKey = getCacheKey(user.id, siteConfig?.id)
        const cached = permissionsCache.get(cacheKey)
        if (!cached) {
          console.log('🔄 Auth: Tab focus - cache miss, refreshing...')
          fetchPermissions()
        } else {
          console.log('⚡ Auth: Tab focus - using cached permissions')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, siteConfig?.id, fetchPermissions, getCacheKey])

  // ENTERPRISE: Clear cache on user change
  useEffect(() => {
    return () => {
      if (!user) {
        permissionsCache.clear()
      }
    }
  }, [user])

  // Refresh permissions (useful after business creation, etc.)
  const refreshPermissions = useCallback(() => {
    console.log('🔄 Auth: Force refreshing permissions...')
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
 * CONVENIENCE: Dashboard access hook
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
 * CONVENIENCE: Business management hook
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
 * CONVENIENCE: Plan limits hook
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