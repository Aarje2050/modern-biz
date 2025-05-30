// src/hooks/useSupabase.ts - SIMPLE REPLACEMENT
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export function useSupabase() {
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    setClient(supabase)
  }, [])

  // Return null until mounted and client is available
  return mounted ? client : null
}