// src/app/api/analytics/charts/page-views/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { formatISO, subDays, format, eachDayOfInterval } from 'date-fns'

// Cache results for 5 minutes
export const revalidate = 300

export async function GET(request: Request) {
  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get('days') || '7', 10)
  
  try {
    // Create a date range array
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    
    const dateRange = eachDayOfInterval({ 
      start: startDate, 
      end: endDate 
    })
    
    // Generate sample data for now
    const chartData = dateRange.map(date => {
      return {
        date: format(date, 'MMM dd'),
        views: Math.floor(Math.random() * 50) // Random data for example
      }
    })
    
    return NextResponse.json({ data: chartData })
  } catch (error) {
    console.error('Page views chart API error:', error)
    
    // Return empty dataset on error
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    
    const dateRange = eachDayOfInterval({ 
      start: startDate, 
      end: endDate 
    })
    
    const emptyData = dateRange.map(date => ({
      date: format(date, 'MMM dd'),
      views: 0
    }))
    
    return NextResponse.json({ 
      error: 'Failed to fetch page views data',
      data: emptyData
    }, { status: 500 })
  }
}