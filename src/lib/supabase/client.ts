// src/lib/supabase/client.ts (MINIMAL FIX - KEEP YOUR EXISTING STRUCTURE)
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

  // Create new client with minimal browser configuration
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
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      // Minimal realtime config
      realtime: {
        params: { eventsPerSecond: 10 }
      }
    }
  )

  return supabaseClient
}

// Reset function for testing or logout
export const resetClient = () => {
  if (supabaseClient && typeof window !== 'undefined') {
    try {
      supabaseClient.removeAllChannels()
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  supabaseClient = null
}