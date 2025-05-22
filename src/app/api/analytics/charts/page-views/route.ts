// src/app/api/analytics/charts/page-views/route.ts  
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns'

export const revalidate = 3600

export async function GET(request: Request) {
  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get('days') || '7', 10)
  const entityType = url.searchParams.get('entityType')
  const entityId = url.searchParams.get('entityId')
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    
    // Build query for your existing page_views table
    let query = supabase
      .from('page_views')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
    
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }
    
    if (entityId) {
      query = query.eq('entity_id', entityId)
    }
    
    const { data: pageViews } = await query
    
    // Create complete date range
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
    
    // Group page views by date
    const pageViewsByDate: Record<string, number> = {}
    
    if (pageViews) {
      pageViews.forEach((view: any) => {
        const date = format(parseISO(view.created_at), 'yyyy-MM-dd')
        pageViewsByDate[date] = (pageViewsByDate[date] || 0) + 1
      })
    }
    
    // Create chart data
    const chartData = dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return {
        date: format(date, 'MMM dd'),
        views: pageViewsByDate[dateStr] || 0
      }
    })
    
    return NextResponse.json({ data: chartData })
  } catch (error) {
    console.error('Page views chart error:', error)
    
    // Return empty dataset on error
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
    
    const emptyData = dateRange.map(date => ({
      date: format(date, 'MMM dd'),
      views: 0
    }))
    
    return NextResponse.json({ data: emptyData })
  }
}