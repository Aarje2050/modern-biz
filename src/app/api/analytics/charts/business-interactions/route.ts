// src/app/api/analytics/charts/business-interactions/route.ts
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
      data: []
    }, { status: 400 })
  }
  
  try {
    // Sample interaction data with standard colors
    const sampleInteractions = [
      { name: 'Viewed Details', value: 68, color: '#0088FE' },
      { name: 'Contact Attempts', value: 23, color: '#00C49F' },
      { name: 'Saved Business', value: 15, color: '#FFBB28' },
      { name: 'Shared Business', value: 7, color: '#FF8042' },
      { name: 'Viewed Photos', value: 42, color: '#8884D8' }
    ]
    
    return NextResponse.json({ data: sampleInteractions })
  } catch (error) {
    console.error('Business interactions API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch business interactions data',
      data: []
    }, { status: 500 })
  }
}