// src/lib/analytics/server.ts
import { createClient } from '@supabase/supabase-js'

// Create a dedicated analytics client
const analyticsClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
    db: { schema: 'analytics' }
  }
)

// Record page view without blocking response
export async function recordPageView(data: any) {
  try {
    await analyticsClient.from('page_views').insert(data)
    return true
  } catch (error) {
    console.error('Failed to record page view:', error)
    return false
  }
}