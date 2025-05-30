// src/app/api/reviews/[id]/helpful/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  const reviewId = params.id
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Toggle helpful vote using the new function
    const { data, error } = await supabase.rpc('toggle_helpful_vote',{
      review_id_param: reviewId
    })
    
    if (error) {
      console.error('Error toggling helpful vote:', error)
      return NextResponse.json(
        { error: 'Failed to update helpful vote' },
        { status: 500 }
      )
    }
    
    const result = data[0]
    
    if (!result?.success) {
      return NextResponse.json(
        { error: 'Failed to process helpful vote' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      helpful_count: result.new_count,
      user_voted: result.user_voted
    })
    
  } catch (error) {
    console.error('Error in helpful route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if user has voted
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reviewId = params.id
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({
        user_voted: false,
        helpful_count: 0
      })
    }
    
    // Check if user has voted
    const { data: vote } = await supabase
      .from('review_helpful_votes')
      .select('id')
      .eq('review_id', reviewId)
      .eq('profile_id', session.user.id)
      .maybeSingle()
    
    // Get current helpful count
    const { data: review } = await supabase
      .from('reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .single()
    
    return NextResponse.json({
      user_voted: !!vote,
      helpful_count: review?.helpful_count || 0
    })
    
  } catch (error) {
    console.error('Error checking helpful vote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}