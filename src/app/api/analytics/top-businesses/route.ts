// src/app/api/analytics/top-businesses/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { subDays, formatISO } from 'date-fns'

export const revalidate = 3600

export async function GET(request: Request) {
  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get('days') || '7', 10)
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const startDate = subDays(new Date(), days)
    
    // Get page views grouped by business
    const { data: pageViews } = await supabase
      .from('page_views')
      .select('entity_id')
      .eq('entity_type', 'business')
      .gte('created_at', formatISO(startDate))
    
    if (!pageViews || pageViews.length === 0) {
      return NextResponse.json({ data: [] })
    }
    
    // Count views per business
    const viewCounts: Record<string, number> = {}
    pageViews.forEach((view: any) => {
      if (view.entity_id) {
        viewCounts[view.entity_id] = (viewCounts[view.entity_id] || 0) + 1
      }
    })
    
    // Get top 10 business IDs
    const topBusinessIds = Object.entries(viewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id)
    
    if (topBusinessIds.length === 0) {
      return NextResponse.json({ data: [] })
    }
    
    // Get business details for top businesses
    const businessPromises = topBusinessIds.map(async (businessId) => {
      const [businessResult, interactionsResult, reviewsResult] = await Promise.all([
        supabase.from('businesses')
          .select('id, name, slug')
          .eq('id', businessId)
          .single(),
          
        supabase.from('business_interactions')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .gte('created_at', formatISO(startDate)),
          
        supabase.from('reviews')
          .select('rating')
          .eq('business_id', businessId)
      ])
      
      if (!businessResult.data) return null
      
      const reviewCount = reviewsResult.data?.length || 0
      const avgRating = reviewCount > 0 
        ? Math.round((reviewsResult.data!.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
        : 0
      
      return {
        id: businessResult.data.id,
        name: businessResult.data.name,
        slug: businessResult.data.slug,
        views: viewCounts[businessId] || 0,
        interactions: interactionsResult.count || 0,
        reviews: reviewCount,
        avgRating
      }
    })
    
    const businesses = (await Promise.all(businessPromises)).filter(Boolean)
    
    return NextResponse.json({ data: businesses })
  } catch (error) {
    console.error('Top businesses API error:', error)
    return NextResponse.json({ data: [] })
  }
}