// src/app/api/analytics/track/route.ts (MINIMAL APPROACH)
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  let body: any = {}
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    body = await request.json()
    
    const { 
      type, 
      entityType,
      entityId,
      businessId, 
      interactionType, 
      query, 
      result_count
    } = body
    
    const { data: { session } } = await supabase.auth.getSession()
    const timestamp = new Date().toISOString()
    
    console.log('Tracking request:', { type, entityType, entityId })
    
    if (type === 'page_view' && entityType && entityId) {
      // Get UUID from slug
      const table = entityType === 'business' ? 'businesses' : 'categories'
      const { data: entity } = await supabase
        .from(table)
        .select('id')
        .eq('slug', entityId)
        .single()
      
      if (entity) {
        // Try full insert first, fallback to minimal
        try {
          const { error: fullInsertError } = await supabase
            .from('page_views')
            .insert({
              entity_type: entityType,
              entity_id: entity.id,
              url: request.headers.get('referer') || '',
              referrer: request.headers.get('referer') || '',
              user_agent: request.headers.get('user-agent') || '',
              profile_id: session?.user?.id || null,
              ip_address: getClientIP(request),
              ip_hash: generateIPHash(request),
              session_id: generateSessionId(),
              created_at: timestamp
            })
          
          if (fullInsertError) {
            console.log('Full insert failed, trying minimal:', fullInsertError)
            
            // Fallback to minimal insert
            const { error: minimalError } = await supabase
              .from('page_views')
              .insert({
                entity_type: entityType,
                entity_id: entity.id,
                url: request.headers.get('referer') || '',
                profile_id: session?.user?.id || null,
                created_at: timestamp
              })
            
            if (minimalError) {
              throw minimalError
            }
            
            console.log('Minimal page view insert successful')
          } else {
            console.log('Full page view insert successful')
          }
        } catch (insertError) {
          console.error('Both insert attempts failed:', insertError)
          throw insertError
        }
      }
    }
    
    if (type === 'business_interaction' && businessId && interactionType) {
      const { error: interactionError } = await supabase
        .from('business_interactions')
        .insert({
          business_id: businessId,
          interaction_type: interactionType,
          profile_id: session?.user?.id || null,
          created_at: timestamp
        })
      
      if (interactionError) {
        console.error('Business interaction error:', interactionError)
        throw interactionError
      }
      
      console.log('Business interaction successful')
    }
    
    if (type === 'search' && query) {
      const { error: searchError } = await supabase
        .from('search_queries')
        .insert({
          query: query.trim(),
          result_count: result_count || 0,
          profile_id: session?.user?.id || null,
          created_at: timestamp
        })
      
      if (searchError) {
        console.error('Search tracking error:', searchError)
        throw searchError
      }
      
      console.log('Search tracking successful')
    }
    
    return NextResponse.json({ success: true, type })
    
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      type: body?.type || 'unknown'
    }, { status: 500 })
  }
}

function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown'
}

function generateIPHash(request: Request): string {
  const ip = getClientIP(request)
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'hash_' + Math.abs(hash).toString(36)
}

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36)
}