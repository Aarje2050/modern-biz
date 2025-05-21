// src/app/api/reviews/[id]/helpful/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const reviewId = params.id
  
  // Create a Supabase client
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Increment helpful count for the review
    const { error } = await supabase.rpc('increment_helpful_count', {
      review_id: reviewId
    })
    
    if (error) {
      console.error('Error incrementing helpful count:', error)
      return NextResponse.json(
        { error: 'Failed to mark review as helpful' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in helpful route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}