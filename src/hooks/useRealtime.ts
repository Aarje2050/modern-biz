// src/hooks/useRealtime.ts (MINIMAL FIX - KEEP YOUR EXISTING INTERFACE)
'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RealtimeSubscription {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  schema: string
  table: string
  filter?: string
  callback: (payload: any) => void
}

interface UseRealtimeConfig {
  enabled?: boolean
  debug?: boolean
  reconnectOnError?: boolean
  maxRetries?: number
}

export function useRealtime(
  subscriptions: RealtimeSubscription[],
  config: UseRealtimeConfig = {}
) {
  const { enabled = true, debug = false } = config
  const channelRef = useRef<any>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !enabled || !mountedRef.current || subscriptions.length === 0) {
      return
    }

    const supabase = createClient()
    
    // If no client available (SSR), just return
    if (!supabase) {
      return
    }

    try {
      // Create channel
      const channel = supabase.channel(`realtime-${Date.now()}`)

      // Add subscriptions
      subscriptions.forEach((sub) => {
        // if (debug) {
        // }

        const config: any = {
          event: sub.event,
          schema: sub.schema,
          table: sub.table
        }

        if (sub.filter) {
          config.filter = sub.filter
        }

        channel.on('postgres_changes', config, (payload: any) => {
          if (!mountedRef.current) return
          
          
          
          try {
            sub.callback(payload)
          } catch (error) {
            console.error('[Realtime] Callback error:', error)
          }
        })
      })

      // Subscribe
      channel.subscribe((status: string) => {
        // if (debug) {
        //   console.log(`[Realtime] Status:`, status)
        // }
      })

      channelRef.current = channel

      // Cleanup
      return () => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }
      }
    } catch (error) {
      console.error('[Realtime] Setup error:', error)
    }
  }, [enabled, JSON.stringify(subscriptions), debug])

  return {
    isConnected: !!channelRef.current
  }
}