// src/app/api/analytics/charts/search-terms/route.ts
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
    // Sample search terms data
    const sampleTerms = [
      { term: "restaurants", count: 45 },
      { term: "plumbers", count: 32 },
      { term: "coffee shops", count: 28 },
      { term: "dentists", count: 22 },
      { term: "gyms", count: 19 },
      { term: "bakery", count: 15 },
      { term: "electrician", count: 12 },
      { term: "hair salon", count: 10 },
      { term: "auto repair", count: 8 },
      { term: "pizza", count: 6 }
    ]
    
    return NextResponse.json({ data: sampleTerms })
  } catch (error) {
    console.error('Search terms API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch search terms data',
      data: []
    }, { status: 500 })
  }
}