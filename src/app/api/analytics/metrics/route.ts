// src/app/api/analytics/metrics/route.ts (REMOVE schema calls)
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { subDays, formatISO } from 'date-fns'

export const revalidate = 3600

export async function GET(request: Request) {
  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get('days') || '7', 10)
  const businessId = url.searchParams.get('businessId')
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    
    if (businessId) {
      // Business-specific metrics using PUBLIC VIEWS
      const [viewsResult, interactionsResult, reviewsResult] = await Promise.all([
        supabase.from('page_views')  // Uses public.page_views
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', 'business')
          .eq('entity_id', businessId)
          .gte('created_at', formatISO(startDate))
          .lte('created_at', formatISO(endDate)),
          
        supabase.from('business_interactions')  // Uses public.business_interactions
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .gte('created_at', formatISO(startDate))
          .lte('created_at', formatISO(endDate)),
          
        supabase.from('reviews')  // Uses public.reviews
          .select('rating')
          .eq('business_id', businessId)
          .gte('created_at', formatISO(startDate))
          .lte('created_at', formatISO(endDate))
      ])
      
      const reviewCount = reviewsResult.data?.length || 0
      const avgRating = reviewCount > 0 
        ? Math.round((reviewsResult.data!.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
        : 0
      
      return NextResponse.json({
        metrics: {
          views: viewsResult.count || 0,
          interactions: interactionsResult.count || 0,
          reviews: reviewCount,
          avgRating
        }
      })
    } else {
      // Platform-wide metrics using PUBLIC VIEWS
      const [viewsResult, businessesResult, searchesResult, reviewsResult] = await Promise.all([
        supabase.from('page_views')  // Uses public.page_views
          .select('*', { count: 'exact', head: true })
          .gte('created_at', formatISO(startDate))
          .lte('created_at', formatISO(endDate)),
          
        supabase.from('businesses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
          
        supabase.from('search_queries')  // Uses public.search_queries
          .select('*', { count: 'exact', head: true })
          .gte('created_at', formatISO(startDate))
          .lte('created_at', formatISO(endDate)),
          
        supabase.from('reviews')  // Uses public.reviews
          .select('*', { count: 'exact', head: true })
          .gte('created_at', formatISO(startDate))
          .lte('created_at', formatISO(endDate))
      ])
      
      return NextResponse.json({
        metrics: {
          views: viewsResult.count || 0,
          businesses: businessesResult.count || 0,
          searches: searchesResult.count || 0,
          reviews: reviewsResult.count || 0
        }
      })
    }
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch analytics metrics',
      metrics: { views: 0, businesses: 0, searches: 0, reviews: 0 }
    }, { status: 500 })
  }
}