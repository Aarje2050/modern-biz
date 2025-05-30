// src/app/api/chat/sessions/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

// Create new chat session
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { contact_id, business_id } = await request.json()
    
    if (!contact_id || !business_id) {
      return NextResponse.json({ 
        error: 'Contact ID and business ID are required' 
      }, { status: 400 })
    }
    
    // Generate secure session token
    const sessionToken = uuidv4()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24-hour sessions
    
    // Create session record (we'll add this table to your schema)
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        session_token: sessionToken,
        contact_id,
        business_id,
        expires_at: expiresAt.toISOString(),
        ip_address: request.ip || request.headers.get('x-forwarded-for'),
        user_agent: request.headers.get('user-agent'),
        is_active: true,
        last_activity: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating chat session:', error)
      return NextResponse.json({ 
        error: 'Failed to create session' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      session_token: sessionToken,
      expires_at: expiresAt.toISOString()
    })
    
  } catch (error) {
    console.error('Session API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Validate existing chat session
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const sessionToken = searchParams.get('token')
    const businessId = searchParams.get('business_id')
    
    if (!sessionToken || !businessId) {
      return NextResponse.json({ 
        error: 'Session token and business ID are required' 
      }, { status: 400 })
    }
    
    // Get session with contact details
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .select(`
        *,
        contact:crm_contacts(*),
        business:businesses(id, name)
      `)
      .eq('session_token', sessionToken)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (error || !session) {
      return NextResponse.json({ 
        error: 'Invalid or expired session' 
      }, { status: 404 })
    }
    
    // Update last activity
    await supabase
      .from('chat_sessions')
      .update({ 
        last_activity: new Date().toISOString() 
      })
      .eq('session_token', sessionToken)
    
    return NextResponse.json({ 
      session: {
        contact_id: session.contact_id,
        business_id: session.business_id,
        contact: session.contact,
        expires_at: session.expires_at
      }
    })
    
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// End chat session (logout)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const sessionToken = searchParams.get('token')
    
    if (!sessionToken) {
      return NextResponse.json({ 
        error: 'Session token required' 
      }, { status: 400 })
    }
    
    // Deactivate session
    const { error } = await supabase
      .from('chat_sessions')
      .update({ 
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('session_token', sessionToken)
    
    if (error) {
      console.error('Error ending session:', error)
      return NextResponse.json({ 
        error: 'Failed to end session' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: 'Session ended successfully' 
    })
    
  } catch (error) {
    console.error('Session end error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}