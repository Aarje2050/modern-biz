// src/providers/auth-provider.tsx (FIXED VERSION - SSR COMPATIBLE)
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const supabase = createClient()
    
    // If no client (SSR), set loading to false and return
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
        } else {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (mounted) {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setLoading(false)

        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            
            break
          case 'SIGNED_OUT':
            
            break
          case 'TOKEN_REFRESHED':
            
            break
          case 'USER_UPDATED':
            
            break
        }
      }
    })

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [mounted])

  const signOut = async () => {
    const supabase = createClient()
    if (!supabase) return

    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
      
      // Clear local state
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

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

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}