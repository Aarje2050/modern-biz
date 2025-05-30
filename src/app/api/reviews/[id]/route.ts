// src/app/api/reviews/[id]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// UPDATE Review
export async function PUT(
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
    
    // Get request body
    const body = await request.json()
    const { rating, title, content } = body
    
    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Valid rating (1-5) is required' },
        { status: 400 }
      )
    }
    
    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Review content is required' },
        { status: 400 }
      )
    }
    
    // Check if user can edit this review (owner + within 30 days)
    const { data: canEditData } = await supabase.rpc('can_edit_review', {
      review_id_param: reviewId
    })
    
    if (!canEditData) {
      return NextResponse.json(
        { error: 'You can only edit your own reviews within 30 days' },
        { status: 403 }
      )
    }
    
    // Update the review
    const { data: updatedReview, error } = await supabase
      .from('reviews')
      .update({
        rating: parseInt(rating),
        title: title?.trim() || null,
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .eq('profile_id', session.user.id) // Extra security check
      .select()
      .single()
    
    if (error) {
      console.error('Error updating review:', error)
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      )
    }
    
    // Auto-update CRM if integration exists
    try {
      await fetch(`${request.nextUrl.origin}/api/crm/integration/contact-from-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: reviewId,
          action: 'updated'
        })
      }).catch(() => {}) // Silent fail
    } catch {}
    
    return NextResponse.json({
      success: true,
      review: updatedReview
    })
    
  } catch (error) {
    console.error('Error in review update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE Review
export async function DELETE(
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
    
    // Check if user can delete this review
    const { data: canEditData } = await supabase.rpc('can_edit_review', {
      review_id_param: reviewId
    })
    
    if (!canEditData) {
      return NextResponse.json(
        { error: 'You can only delete your own reviews within 30 days' },
        { status: 403 }
      )
    }
    
    // Delete the review (cascade will handle helpful votes)
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('profile_id', session.user.id) // Extra security check
    
    if (error) {
      console.error('Error deleting review:', error)
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    })
    
  } catch (error) {
    console.error('Error in review deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}