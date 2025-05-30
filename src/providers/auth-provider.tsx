// src/providers/auth-provider.tsx - ENTERPRISE OPTIMIZED VERSION
'use client'

import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  // ENTERPRISE: Prevent unnecessary state updates
  const initializingRef = useRef(false)
  const lastSessionUpdate = useRef<number>(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const supabase = createClient()
    
    if (!supabase) {
      setLoading(false)
      return
    }

    // ENTERPRISE: Prevent duplicate initialization
    if (initializingRef.current) {
      console.log('🔄 Auth Provider: Already initializing, skipping...')
      return
    }

    initializingRef.current = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 Auth Provider: Getting initial session...')
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Auth Provider: Error getting initial session:', error)
        } else {
          console.log('✅ Auth Provider: Initial session loaded')
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
          lastSessionUpdate.current = Date.now()
        }
      } catch (error) {
        console.error('❌ Auth Provider: Error in getInitialSession:', error)
      } finally {
        setLoading(false)
        initializingRef.current = false
      }
    }

    getInitialSession()

    // ENTERPRISE: Optimized auth state listener with debouncing
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return

      // ENTERPRISE: Debounce rapid auth state changes
      const now = Date.now()
      if (now - lastSessionUpdate.current < 100) {
        console.log('🔄 Auth Provider: Debouncing rapid auth change...')
        return
      }

      console.log('🔄 Auth Provider: Auth state change:', event)
      
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)
      lastSessionUpdate.current = now

      // Handle specific auth events without causing re-renders
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ Auth Provider: User signed in')
          break
        case 'SIGNED_OUT':
          console.log('✅ Auth Provider: User signed out')
          break
        case 'TOKEN_REFRESHED':
          console.log('🔄 Auth Provider: Token refreshed silently')
          break
        case 'USER_UPDATED':
          console.log('🔄 Auth Provider: User updated')
          break
      }
    })

    // ENTERPRISE: Handle page visibility to prevent unnecessary token refreshes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Don't force session refresh on tab focus - let Supabase handle it naturally
        console.log('👁️ Auth Provider: Tab focused - Supabase will handle token refresh if needed')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      console.log('🧹 Auth Provider: Cleaning up...')
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [mounted])

  // ENTERPRISE: Optimized sign out
  const signOut = async () => {
    const supabase = createClient()
    if (!supabase) return

    try {
      setLoading(true)
      console.log('🔄 Auth Provider: Signing out...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Auth Provider: Error signing out:', error)
        throw error
      }
      
      console.log('✅ Auth Provider: Signed out successfully')
      
      // Clear local state
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('❌ Auth Provider: Sign out error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // ENTERPRISE: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    session,
    loading,
    signOut,
  }), [user, session, loading])

  // Don't render context until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <AuthContext.Provider value={{
        user: null,
        session: null,
        loading: true,
        signOut: async () => {},
      }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}