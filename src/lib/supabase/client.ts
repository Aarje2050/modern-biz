// src/lib/supabase/client.ts - UPDATED FOR BETTER OAUTH SUPPORT
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

export const createClient = () => {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }

  // Return null on server side (no error thrown)
  if (typeof window === 'undefined') {
    return null
  }

  // Create new client with enhanced cookie handling for OAuth
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document !== 'undefined') {
            // Enhanced cookie reading with better parsing
            const cookies = document.cookie.split(';')
            for (let cookie of cookies) {
              const [cookieName, cookieValue] = cookie.trim().split('=')
              if (cookieName === name) {
                return decodeURIComponent(cookieValue)
              }
            }
          }
          return undefined
        },
        set(name: string, value: string, options: any) {
          if (typeof document !== 'undefined') {
            let cookieString = `${name}=${encodeURIComponent(value)}`
            
            // Default options for better OAuth support
            const defaultOptions = {
              path: '/',
              maxAge: 60 * 60 * 24 * 7, // 7 days
              sameSite: 'lax',
              secure: window.location.protocol === 'https:'
            }
            
            const finalOptions = { ...defaultOptions, ...options }
            
            if (finalOptions.maxAge) cookieString += `; max-age=${finalOptions.maxAge}`
            if (finalOptions.path) cookieString += `; path=${finalOptions.path}`
            if (finalOptions.domain) cookieString += `; domain=${finalOptions.domain}`
            if (finalOptions.secure) cookieString += `; secure`
            if (finalOptions.httpOnly) cookieString += `; httponly`
            if (finalOptions.sameSite) cookieString += `; samesite=${finalOptions.sameSite}`
            
            document.cookie = cookieString
            
            // Enhanced logging for OAuth debugging
            if (name.includes('auth')) {
              console.log(`🍪 [CLIENT] Set auth cookie: ${name}`, {
                hasValue: !!value,
                length: value.length,
                secure: finalOptions.secure,
                sameSite: finalOptions.sameSite
              })
            }
          }
        },
        remove(name: string, options: any) {
          if (typeof document !== 'undefined') {
            const defaultOptions = {
              path: '/',
              secure: window.location.protocol === 'https:'
            }
            
            const finalOptions = { ...defaultOptions, ...options }
            
            let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
            if (finalOptions.path) cookieString += `; path=${finalOptions.path}`
            if (finalOptions.domain) cookieString += `; domain=${finalOptions.domain}`
            if (finalOptions.secure) cookieString += `; secure`
            if (finalOptions.sameSite) cookieString += `; samesite=${finalOptions.sameSite}`
            
            document.cookie = cookieString
            
            console.log(`🍪 [CLIENT] Removed cookie: ${name}`)
          }
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: process.env.NODE_ENV === 'development'
      },
      realtime: {
        params: { eventsPerSecond: 10 }
      }
    }
  )

  // Enhanced auth state change logging for OAuth debugging
  if (process.env.NODE_ENV === 'development' && supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log(`🔐 [CLIENT] Auth event: ${event}`, {
        hasSession: !!session,
        hasUser: !!session?.user,
        email: session?.user?.email,
        provider: session?.user?.app_metadata?.provider,
        cookieCount: document.cookie.split(';').filter(c => c.includes('sb-')).length
      })
      
      // Log cookie details for debugging
      if (session && event === 'SIGNED_IN') {
        const authCookies = document.cookie.split(';').filter(c => c.includes('sb-'))
        console.log(`🍪 [CLIENT] Auth cookies after ${event}:`, authCookies.length)
      }
    })
  }

  return supabaseClient
}

// Reset function for testing or logout
export const resetClient = () => {
  if (supabaseClient && typeof window !== 'undefined') {
    try {
      supabaseClient.removeAllChannels()
    } catch (error) {
      console.warn('Supabase client cleanup warning:', error)
    }
  }
  supabaseClient = null
}