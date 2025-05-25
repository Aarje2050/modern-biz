// src/hooks/useTenantSupabase.ts
'use client'

import { useMemo } from 'react'
import { createTenantClient } from '@/lib/supabase/tenant-client'
import { useSiteContext } from './useSiteContext'

export function useTenantSupabase() {
  const { siteConfig } = useSiteContext()
  
  const client = useMemo(() => {
    return createTenantClient(siteConfig?.id)
  }, [siteConfig?.id])

  return client
}