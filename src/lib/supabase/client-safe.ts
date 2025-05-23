// src/lib/supabase/client-safe.ts (NEW FILE - SERVER SAFE VERSION)
'use client'

import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

// Server-safe function to check if we're in browser
const isBrowser = () => {
  return typeof window !== 'undefined' && 
         typeof document !== 'undefined' && 
         typeof navigator !== 'undefined'
}

export const createClient = (): SupabaseClient | null => {
  // Always return null on server side
  if (!isBrowser()) {
    return null
  }

  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }

  try {
    // Dynamic import to ensure this only runs on client side
    const { createBrowserClient } = require('@supabase/ssr')

    // Create new client with proper browser configuration
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            if (typeof document !== 'undefined') {
              const value = `; ${document.cookie}`;
              const parts = value.split(`; ${name}=`);
              if (parts.length === 2) {
                return parts.pop()?.split(';').shift();
              }
            }
            return undefined;
          },
          set(name: string, value: string, options: any) {
            if (typeof document !== 'undefined') {
              let cookieString = `${name}=${value}`;
              if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`;
              if (options?.path) cookieString += `; path=${options.path}`;
              if (options?.domain) cookieString += `; domain=${options.domain}`;
              if (options?.secure) cookieString += `; secure`;
              if (options?.httpOnly) cookieString += `; httponly`;
              if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`;
              document.cookie = cookieString;
            }
          },
          remove(name: string, options: any) {
            if (typeof document !== 'undefined') {
              let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
              if (options?.path) cookieString += `; path=${options.path}`;
              if (options?.domain) cookieString += `; domain=${options.domain}`;
              document.cookie = cookieString;
            }
          },
        },
        cookieOptions: {
          name: 'sb',
          lifetime: 60 * 60 * 8, // 8 hours
          domain: undefined,
          path: '/',
          sameSite: 'lax',
        },
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
          timeout: 20000,
          heartbeatIntervalMs: 30000,
          reconnectAfterMs: function (tries: number) {
            return Math.min(tries * 1000, 30000)
          },
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-js-web',
          },
        },
      }
    )

    return supabaseClient
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    return null
  }
}

// Reset function for testing or logout
export const resetClient = () => {
  if (supabaseClient && isBrowser()) {
    // Properly cleanup realtime connections
    try {
      supabaseClient.removeAllChannels()
    } catch (error) {
      console.error('Error cleaning up Supabase client:', error)
    }
  }
  supabaseClient = null
}

// Helper function to ensure client is browser-only
export const getBrowserClient = () => {
  if (!isBrowser()) {
    return null
  }
  return createClient()
}

// Export the main createClient function as default for compatibility
export default createClient