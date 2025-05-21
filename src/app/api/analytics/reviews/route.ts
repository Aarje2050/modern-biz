// src/app/api/analytics/reviews/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { formatISO, subDays } from 'date-fns'

// Cache results for 5 minutes
export const revalidate = 300

export async function GET(request: Request) {
  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get('days') || '7', 10)
  const businessId = url.searchParams.get('businessId')
  
  if (!businessId) {
    return NextResponse.json({ 
      error: 'Business ID is required',
      reviews: [],
      ratingSummary: [],
      avgRating: 0,
      totalReviews: 0
    }, { status: 400 })
  }
  
  try {
    // Sample reviews data
    const sampleReviews = [
      {
        id: "1",
        rating: 5,
        title: "Excellent service!",
        content: "The staff was friendly and the service was fast. Highly recommend!",
        created_at: "2025-05-18T14:22:10Z",
        profile: { full_name: "John Smith" }
      },
      {
        id: "2",
        rating: 4,
        title: "Great experience",
        content: "Good value for money and professional service.",
        created_at: "2025-05-15T09:45:30Z",
        profile: { full_name: "Emma Johnson" }
      },
      {
        id: "3",
        rating: 5,
        title: "Will return",
        content: "Amazing experience from start to finish. The attention to detail was impressive.",
        created_at: "2025-05-12T16:18:22Z",
        profile: { full_name: "Michael Brown" }
      }
    ]
    
    // Sample rating summary
    const ratingSummary = [
      { rating: 5, count: 28 },
      { rating: 4, count: 15 },
      { rating: 3, count: 7 },
      { rating: 2, count: 3 },
      { rating: 1, count: 2 }
    ]
    
    // Calculate summary statistics
    const totalReviews = ratingSummary.reduce((sum, item) => sum + item.count, 0)
    const totalRatingSum = ratingSummary.reduce((sum, item) => sum + (item.rating * item.count), 0)
    const avgRating = totalReviews > 0 ? parseFloat((totalRatingSum / totalReviews).toFixed(1)) : 0
    
    return NextResponse.json({
      reviews: sampleReviews,
      ratingSummary,
      avgRating,
      totalReviews
    })
  } catch (error) {
    console.error('Reviews analytics API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch reviews data',
      reviews: [],
      ratingSummary: [],
      avgRating: 0,
      totalReviews: 0
    }, { status: 500 })
  }
}