// src/hooks/useSupabase.ts (NEW HOOK FOR SAFE CLIENT ACCESS)
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export function useSupabase() {
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Only create client on browser side
    const supabase = createClient()
    setClient(supabase)
  }, [])

  // Return null until mounted and client is available
  return mounted ? client : null
}

// Alternative hook for components that need to wait for client
export function useSupabaseClient() {
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const supabase = createClient()
    setClient(supabase)
    setLoading(false)
  }, [mounted])

  return {
    client: mounted ? client : null,
    loading: !mounted || loading,
    isReady: mounted && !!client
  }
}