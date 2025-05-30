// src/hooks/useSupabase.ts - ENHANCED VERSION (maintains full backwards compatibility)
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient, User } from '@supabase/supabase-js'

// Define enhanced return type for TypeScript
type EnhancedSupabaseClient = SupabaseClient & {
  user: User | null
  client: SupabaseClient
}

export function useSupabase(): EnhancedSupabaseClient | null {
  const [user, setUser] = useState<User | null>(null) // Now properly implemented
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    if (!supabase) {
      
      return
    }
    setClient(supabase)

    // Get initial user state
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    getUser()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Return null until mounted and client is available (maintains existing behavior)
  if (!mounted || !client) {
    return null
  }

  // Create enhanced return object that maintains backwards compatibility
  // Can be used as: useSupabase() (returns client) OR const { user } = useSupabase()
  const result = Object.assign(client, {
    user, // Add user property for destructuring
    client // Add client property for explicit access
  }) as EnhancedSupabaseClient

  return result
}