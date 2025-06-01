// src/app/api/analytics/track/route.ts - SIMPLE WORKING VERSION
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    const { 
      type, 
      entityType,
      entityId,
      businessId, 
      interactionType, 
      query, 
      resultCount
    } = body
    
    const { data: { session } } = await supabase.auth.getSession()
    const timestamp = new Date().toISOString()
    
    console.log('📊 Analytics tracking:', { type, query, businessId, entityType })
    
    // Handle page views
    if (type === 'page_view' && entityType && entityId) {
      const table = entityType === 'business' ? 'businesses' : 'categories'
      const { data: entity } = await supabase
        .from(table)
        .select('id')
        .eq('slug', entityId)
        .single()
      
      if (entity) {
        const { error } = await supabase
          .from('page_views')
          .insert({
            entity_type: entityType,
            entity_id: entity.id,
            url: request.headers.get('referer') || '',
            profile_id: session?.user?.id || null,
            created_at: timestamp
          })
        
        if (error) {
          console.error('Page view error:', error)
        } else {
          console.log('✅ Page view tracked')
        }
      }
    }
    
    // Handle business interactions
    if (type === 'business_interaction' && businessId && interactionType) {
      // Convert slug to UUID if needed
      let businessUuid = businessId
      if (!businessId.includes('-')) {
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('slug', businessId)
          .single()
        
        if (business) {
          businessUuid = business.id
        }
      }
      
      const { error } = await supabase
        .from('business_interactions')
        .insert({
          business_id: businessUuid,
          interaction_type: interactionType,
          profile_id: session?.user?.id || null,
          created_at: timestamp
        })
      
      if (error) {
        console.error('Business interaction error:', error)
      } else {
        console.log('✅ Business interaction tracked')
      }
    }
    
    // Handle search queries - FIXED VERSION
    if (type === 'search' && query) {
      console.log('🔍 Processing search:', { query, resultCount })
      
      const { error } = await supabase
        .from('search_queries')
        .insert({
          query: query.trim(),
          result_count: resultCount || 0,
          profile_id: session?.user?.id || null,
          created_at: timestamp
        })
      
      if (error) {
        console.error('❌ Search query error:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details
        })
        
        // Still return success to not break user experience
        return NextResponse.json({ 
          success: true, 
          type: 'search',
          error: error.message 
        })
      } else {
        console.log('✅ Search query tracked successfully')
      }
    }
    
    return NextResponse.json({ success: true, type })
    
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ 
      success: true, // Always return success to not break user experience
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 })
  }
}