// src/app/api/analytics/top-businesses/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { formatISO, subDays } from 'date-fns'

// Cache results for 5 minutes
export const revalidate = 300

export async function GET(request: Request) {
  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get('days') || '7', 10)
  
  try {
    // Sample top businesses data
    const sampleBusinesses = [
      { 
        id: "1", 
        name: "Cafe Deluxe", 
        slug: "cafe-deluxe", 
        views: 243, 
        interactions: 56, 
        reviews: 12, 
        avgRating: 4.5 
      },
      { 
        id: "2", 
        name: "Quick Fix Plumbing", 
        slug: "quick-fix-plumbing", 
        views: 187, 
        interactions: 42, 
        reviews: 8, 
        avgRating: 4.2 
      },
      { 
        id: "3", 
        name: "Green Leaf Dentistry", 
        slug: "green-leaf-dentistry", 
        views: 156, 
        interactions: 38, 
        reviews: 15, 
        avgRating: 4.8 
      },
      { 
        id: "4", 
        name: "PowerFit Gym", 
        slug: "powerfit-gym", 
        views: 134, 
        interactions: 29, 
        reviews: 7, 
        avgRating: 4.0 
      },
      { 
        id: "5", 
        name: "Tech Wizards", 
        slug: "tech-wizards", 
        views: 112, 
        interactions: 25, 
        reviews: 5, 
        avgRating: 3.9 
      }
    ]
    
    return NextResponse.json({ data: sampleBusinesses })
  } catch (error) {
    console.error('Top businesses API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch top businesses data',
      data: []
    }, { status: 500 })
  }
}