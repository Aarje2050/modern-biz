// src/app/api/analytics/status/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Cache results for 10 minutes
export const revalidate = 600

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Try a simple connection test
    try {
      // Just check if we can connect to Supabase
      await supabase.from('page_views').select('id', { count: 'exact', head: true }).limit(1)
      
      return NextResponse.json({ available: true })
    } catch (error) {
      console.warn('Analytics tables not available:', error)
      return NextResponse.json({ available: false })
    }
  } catch (error) {
    console.error('Analytics status check error:', error)
    return NextResponse.json({ available: false })
  }
}