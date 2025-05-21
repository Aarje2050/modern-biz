// src/lib/analytics/client.ts

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const Analytics = {
  // Track user interaction events (clicks, form submissions, etc.)
  trackEvent: async (eventType: string, data: any = {}) => {
    try {
      const supabase = createClientComponentClient()
      
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      const payload = {
        event_type: eventType,
        profile_id: user?.id || null,
        data,
        created_at: new Date().toISOString()
      }
      
      // Use a non-blocking call
      void supabase.from('user_events').insert(payload)
    } catch (error) {
      // Silent fail - never impact the UI
      console.error('Analytics event tracking error:', error)
    }
  },
  
  // Track business profile interactions
  trackBusinessInteraction: async (businessId: string, interactionType: string, metadata: any = {}) => {
    try {
      const supabase = createClientComponentClient()
      
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      const payload = {
        business_id: businessId,
        profile_id: user?.id || null,
        interaction_type: interactionType,
        metadata,
        created_at: new Date().toISOString()
      }
      
      // Use a non-blocking call
      void supabase.from('business_interactions').insert(payload)
    } catch (error) {
      // Silent fail
      console.error('Business interaction tracking error:', error)
    }
  },
  
  // Track search queries
  trackSearch: async (query: string, filters: any = {}, resultCount: number) => {
    try {
      const supabase = createClientComponentClient()
      
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      const payload = {
        query,
        filters,
        result_count: resultCount,
        profile_id: user?.id || null,
        created_at: new Date().toISOString()
      }
      
      // Use a non-blocking call
      void supabase.from('search_queries').insert(payload)
    } catch (error) {
      // Silent fail
      console.error('Search tracking error:', error)
    }
  }
}