// src/app/api/analytics/user-businesses/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        businesses: []
      }, { status: 401 })
    }
    
    try {
      // Get user's businesses
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name, slug')
        .eq('profile_id', session.user.id)
      
      return NextResponse.json({ businesses: businesses || [] })
    } catch (error) {
      console.error('Error fetching user businesses:', error)
      return NextResponse.json({ businesses: [] })
    }
  } catch (error) {
    console.error('User businesses API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch user businesses',
      businesses: []
    }, { status: 500 })
  }
}