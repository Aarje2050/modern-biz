// src/providers/app-provider.tsx - SAFE VERSION (NO AUTO REDIRECTS)
'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

// ===============================
// TYPES & INTERFACES
// ===============================

interface SiteConfig {
  id: string
  domain: string
  name: string
  slug: string
  site_type: 'directory' | 'landing' | 'service' | 'static'
  template: string
  config: any
  status: string
  created_at: string
  updated_at: string
}

interface UserPermissions {
  isAuthenticated: boolean
  isGlobalAdmin: boolean
  isSiteAdmin: boolean
  isBusinessOwner: boolean
  siteId: string | null
  siteRole: string | null
  ownedBusinesses: string[]
  managedBusinesses: string[]
  canAccessDashboard: boolean
  canAccessAnalytics: boolean
  canAccessCRM: boolean
  canManageBusinesses: boolean
  canManageUsers: boolean
  planType: string
  planLimits: Record<string, any>
}

interface AppState {
  // Loading states
  loading: boolean
  authLoading: boolean
  siteLoading: boolean
  permissionsLoading: boolean
  
  // Data
  user: User | null
  session: Session | null
  siteConfig: SiteConfig | null
  permissions: UserPermissions | null
  
  // Errors
  error: string | null
  
  // Actions
  signOut: () => Promise<void>
  refreshPermissions: () => Promise<void>
  refreshSite: () => Promise<void>
}

// ===============================
// CONTEXT
// ===============================

const AppContext = createContext<AppState | null>(null)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

// ===============================
// DEVELOPMENT HELPERS
// ===============================

const isDev = process.env.NODE_ENV === 'development'

function log(phase: string, message: string, data?: any) {
  if (isDev) {
    console.log(`🏗️ [APP-${phase}] ${message}`, data || '')
  }
}

// ===============================
// MAIN PROVIDER
// ===============================

interface AppProviderProps {
  children: ReactNode
}

export default function AppProvider({ children }: AppProviderProps) {
  // ===============================
  // STATE
  // ===============================
  
  const [state, setState] = useState<AppState>({
    loading: true,
    authLoading: true,
    siteLoading: true,
    permissionsLoading: true,
    user: null,
    session: null,
    siteConfig: null,
    permissions: null,
    error: null,
    signOut: async () => {},
    refreshPermissions: async () => {},
    refreshSite: async () => {}
  })

  // ===============================
  // REFS & FLAGS
  // ===============================
  
  const mountedRef = useRef(true)
  const supabaseRef = useRef<any>(null)
  
  // ===============================
  // SITE CONTEXT LOGIC
  // ===============================
  
  async function loadSiteConfig(): Promise<SiteConfig | null> {
    const hostname = window.location.hostname + 
                    (window.location.port ? ':' + window.location.port : '')
    
    log('SITE', 'Loading site config for', hostname)
    
    try {
      const response = await fetch('/api/site/current', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      })

      if (response.ok) {
        const siteConfig = await response.json()
        
        if (siteConfig?.id && siteConfig?.name && siteConfig?.domain) {
          log('SITE', 'Site config loaded from database', {
            id: siteConfig.id,
            name: siteConfig.name,
            site_type: siteConfig.site_type
          })
          return siteConfig
        }
      }
      
      log('SITE', 'Database lookup failed - no site found')
      return null
      
    } catch (error) {
      log('SITE', 'Site config fetch error', error)
      return null
    }
  }

  // ===============================
  // PERMISSIONS LOGIC
  // ===============================
  
  async function loadPermissions(user: User, siteConfig: SiteConfig | null): Promise<UserPermissions | null> {
    if (!user) {
      log('PERMISSIONS', 'No user - returning null permissions')
      return null
    }

    log('PERMISSIONS', 'Loading permissions', {
      userId: user.id.substring(0, 8) + '...',
      siteId: siteConfig?.id || 'none'
    })

    try {
      const response = await fetch('/api/auth/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          siteId: siteConfig?.id,
          skipCache: false
        })
      })

      if (!response.ok) {
        log('PERMISSIONS', 'Permissions API failed', response.status)
        return createSafePermissions(user, siteConfig)
      }

      const permissions = await response.json()
      log('PERMISSIONS', 'Permissions loaded successfully', {
        canAccessDashboard: permissions.canAccessDashboard,
        isBusinessOwner: permissions.isBusinessOwner,
        siteRole: permissions.siteRole
      })
      
      return permissions
      
    } catch (error) {
      log('PERMISSIONS', 'Permissions fetch error', error)
      return createSafePermissions(user, siteConfig)
    }
  }

  function createSafePermissions(user: User, siteConfig: SiteConfig | null): UserPermissions {
    return {
      isAuthenticated: true,
      isGlobalAdmin: false,
      isSiteAdmin: false,
      isBusinessOwner: false,
      siteId: siteConfig?.id || null,
      siteRole: null,
      ownedBusinesses: [],
      managedBusinesses: [],
      canAccessDashboard: true, // Allow basic access
      canAccessAnalytics: false,
      canAccessCRM: false,
      canManageBusinesses: false,
      canManageUsers: false,
      planType: 'free',
      planLimits: {}
    }
  }

  // ===============================
  // UNIFIED INITIALIZATION
  // ===============================
  
  async function initializeApp() {
    log('INIT', 'Starting app initialization')

    try {
      // STEP 1: Initialize Supabase
      const supabase = createClient()
      if (!supabase) {
        throw new Error('Failed to create Supabase client')
      }
      supabaseRef.current = supabase

      // STEP 2: Get session (simple, clean)
      log('AUTH', 'Getting session')
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        log('AUTH', 'Session error', sessionError)
      }
      
      const session = sessionData.session
      const user = session?.user || null

      log('AUTH', 'Session result', {
        hasSession: !!session,
        hasUser: !!user,
        email: user?.email
      })

      if (!mountedRef.current) return

      // Update auth state first
      setState(prev => ({
        ...prev,
        session,
        user,
        authLoading: false
      }))

      // STEP 3: Load site config
      log('SITE', 'Loading site configuration')
      const siteConfig = await loadSiteConfig()

      if (!mountedRef.current) return

      setState(prev => ({
        ...prev,
        siteConfig,
        siteLoading: false
      }))

      // STEP 4: Load permissions (only if authenticated)
      let permissions = null
      if (user) {
        log('PERMISSIONS', 'User authenticated - loading permissions')
        permissions = await loadPermissions(user, siteConfig)
      } else {
        log('PERMISSIONS', 'No user - skipping permissions')
      }

      if (!mountedRef.current) return

      // Final state update
      setState(prev => ({
        ...prev,
        permissions,
        permissionsLoading: false,
        loading: false,
        error: null
      }))

      log('INIT', 'App initialization completed successfully')

    } catch (error) {
      log('INIT', 'App initialization failed', error)
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          authLoading: false,
          siteLoading: false,
          permissionsLoading: false,
          error: 'Failed to initialize app'
        }))
      }
    }
  }

  // ===============================
  // AUTH STATE LISTENER
  // ===============================
  
  useEffect(() => {
    mountedRef.current = true
    
    const supabase = createClient()
    if (!supabase) return

    // Initial load
    initializeApp()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return

        log('AUTH', 'Auth state changed', event)

        // Update auth state immediately
        setState(prev => ({
          ...prev,
          session,
          user: session?.user || null
        }))

        // Handle permissions based on auth event
        if (event === 'SIGNED_IN' && session?.user) {
          log('PERMISSIONS', 'User signed in - loading permissions')
          setState(prev => ({ ...prev, permissionsLoading: true }))
          
          const permissions = await loadPermissions(session.user, state.siteConfig)
          
          if (mountedRef.current) {
            setState(prev => ({
              ...prev,
              permissions,
              permissionsLoading: false
            }))
          }
          
        } else if (event === 'SIGNED_OUT') {
          log('PERMISSIONS', 'User signed out - clearing permissions')
          setState(prev => ({
            ...prev,
            permissions: null,
            permissionsLoading: false
          }))
        }
      }
    )

    return () => {
      log('CLEANUP', 'Cleaning up app provider')
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, []) // Only run once

  // ===============================
  // ACTIONS
  // ===============================
  
  const signOut = async () => {
    const supabase = supabaseRef.current
    if (!supabase) return

    try {
      log('AUTH', 'Signing out')
      setState(prev => ({ ...prev, loading: true }))
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      log('AUTH', 'Signed out successfully')
      
      setState(prev => ({
        ...prev,
        user: null,
        session: null,
        permissions: null,
        loading: false
      }))
      
    } catch (error) {
      log('AUTH', 'Sign out error', error)
      throw error
    }
  }

  const refreshPermissions = async () => {
    if (!state.user) return

    log('PERMISSIONS', 'Force refreshing permissions')
    setState(prev => ({ ...prev, permissionsLoading: true }))
    
    const permissions = await loadPermissions(state.user, state.siteConfig)
    
    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        permissions,
        permissionsLoading: false
      }))
    }
  }

  const refreshSite = async () => {
    log('SITE', 'Force refreshing site config')
    setState(prev => ({ ...prev, siteLoading: true }))
    
    const siteConfig = await loadSiteConfig()
    
    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        siteConfig,
        siteLoading: false
      }))
    }
  }

  // ===============================
  // FINAL STATE WITH ACTIONS
  // ===============================
  
  const finalState: AppState = {
    ...state,
    signOut,
    refreshPermissions,
    refreshSite
  }

  return (
    <AppContext.Provider value={finalState}>
      {children}
    </AppContext.Provider>
  )
}

// ===============================
// CONVENIENCE HOOKS
// ===============================

export function useAuth() {
  const { user, session, authLoading, signOut } = useApp()
  return {
    user,
    session,
    loading: authLoading,
    signOut,
    isAuthenticated: !!user
  }
}

export function useSiteContext() {
  const { siteConfig, siteLoading, error, refreshSite } = useApp()
  return {
    siteConfig,
    loading: siteLoading,
    error,
    refreshSite
  }
}

export function useUnifiedAuth() {
  const app = useApp()
  
  return {
    // Auth state
    user: app.user,
    session: app.session,
    loading: app.loading,
    error: app.error,
    signOut: app.signOut,
    
    // Permissions
    permissions: app.permissions,
    
    // Convenience flags
    isAuthenticated: !!app.user,
    canAccessDashboard: app.permissions?.canAccessDashboard || false,
    canAccessAnalytics: app.permissions?.canAccessAnalytics || false,
    canAccessCRM: app.permissions?.canAccessCRM || false,
    isBusinessOwner: app.permissions?.isBusinessOwner || false,
    isAdmin: app.permissions?.isGlobalAdmin || app.permissions?.isSiteAdmin || false,
    
    // Actions
    refreshPermissions: app.refreshPermissions
  }
}

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