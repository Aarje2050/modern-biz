// src/app/api/analytics/charts/business-performance/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { subDays, format, eachDayOfInterval } from 'date-fns'

export const revalidate = 3600

export async function GET(request: Request) {
  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get('days') || '7', 10)
  const businessId = url.searchParams.get('businessId')
  
  if (!businessId) {
    return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
  }
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    
    // Get daily analytics data
    const { data: analytics } = await supabase
      .from('business_analytics_daily')
      .select('*')
      .eq('business_id', businessId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: true })
    
    // Create complete date range
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
    
    // Map analytics data to chart format
    const chartData = dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayData = analytics?.find(a => a.date === dateStr)
      
      return {
        date: format(date, 'MMM dd'),
        views: dayData?.page_views || 0,
        uniqueVisitors: dayData?.unique_visitors || 0,
        contacts: dayData?.contact_clicks || 0,
        saves: dayData?.profile_saves || 0
      }
    })
    
    return NextResponse.json({ data: chartData })
  } catch (error) {
    console.error('Business performance chart error:', error)
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 })
  }
}