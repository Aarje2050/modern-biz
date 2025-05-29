'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSiteContext } from '@/hooks/useSiteContext'
import type { User } from '@supabase/supabase-js'

interface SiteUser {
  id: string
  site_id: string
  user_id: string
  role: 'user' | 'business_owner' | 'admin'
  permissions: Record<string, boolean>
  created_at: string
}

interface AuthContextType {
  user: User | null
  siteUser: SiteUser | null
  loading: boolean
  isAuthorizedForSite: boolean
  signOut: () => Promise<void>
  signInToSite: (email: string, password: string) => Promise<{ error?: string }>
  signUpToSite: (email: string, password: string, role?: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SiteAwareAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [siteUser, setSiteUser] = useState<SiteUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { siteConfig } = useSiteContext()
  
  const supabase = createClient()
  // Add null check
  if (!supabase) {
    setLoading(false)
    return
  }
  
  // Check if user is authorized for current site
  const isAuthorizedForSite = !!(user && siteUser && siteConfig && siteUser.site_id === siteConfig.id)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user && siteConfig?.id) {
        await checkSiteAccess(session.user.id, siteConfig.id)
      }
      
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.email)
        setUser(session?.user ?? null)
        
        if (session?.user && siteConfig?.id) {
          await checkSiteAccess(session.user.id, siteConfig.id)
        } else {
          setSiteUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [siteConfig?.id])

  // Check if user has access to current site
  const checkSiteAccess = async (userId: string, siteId: string) => {
    try {
      console.log('🔍 Checking site access:', { userId, siteId })
      
      const { data: siteUserData, error } = await supabase
        .from('site_users')
        .select('*')
        .eq('user_id', userId)
        .eq('site_id', siteId)
        .single()

      if (error) {
        console.log('❌ No site access found:', error.message)
        setSiteUser(null)
        
        // Check if user is global admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', userId)
          .single()
        
        if (profile?.account_type === 'admin') {
          console.log('✅ Global admin access granted')
          // Create temporary site user for admin
          setSiteUser({
            id: 'admin',
            site_id: siteId,
            user_id: userId,
            role: 'admin',
            permissions: { all: true },
            created_at: new Date().toISOString()
          })
        }
      } else {
        console.log('✅ Site access granted:', siteUserData)
        setSiteUser(siteUserData)
      }
    } catch (error) {
      console.error('❌ Site access check error:', error)
      setSiteUser(null)
    }
  }

  // Site-specific sign in
  const signInToSite = async (email: string, password: string) => {
    try {
      if (!siteConfig?.id) {
        return { error: 'Site not found' }
      }

      // First authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        // Check site access
        await checkSiteAccess(data.user.id, siteConfig.id)
        
        // If no site access and not admin, sign out
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', data.user.id)
          .single()
        
        if (profile?.account_type !== 'admin') {
          const { data: siteUserCheck } = await supabase
            .from('site_users')
            .select('id')
            .eq('user_id', data.user.id)
            .eq('site_id', siteConfig.id)
            .single()
          
          if (!siteUserCheck) {
            await supabase.auth.signOut()
            return { error: 'You do not have access to this site' }
          }
        }
      }

      return {}
    } catch (error) {
      return { error: 'Sign in failed' }
    }
  }

  // Site-specific sign up
  const signUpToSite = async (email: string, password: string, role: string = 'user') => {
    try {
      if (!siteConfig?.id) {
        return { error: 'Site not found' }
      }

      // First create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        // Create site user record
        const { error: siteUserError } = await supabase
          .from('site_users')
          .insert({
            site_id: siteConfig.id,
            user_id: data.user.id,
            role: role,
            permissions: {
              read: true,
              write: role === 'business_owner',
              admin: false
            }
          })

        if (siteUserError) {
          console.error('Failed to create site user:', siteUserError)
          // Don't fail the signup, just log the error
        }

        await checkSiteAccess(data.user.id, siteConfig.id)
      }

      return {}
    } catch (error) {
      return { error: 'Sign up failed' }
    }
  }

  // Site-aware sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSiteUser(null)
  }

  const value = {
    user,
    siteUser,
    loading,
    isAuthorizedForSite,
    signOut,
    signInToSite,
    signUpToSite
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSiteAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useSiteAuth must be used within a SiteAwareAuthProvider')
  }
  return context
}