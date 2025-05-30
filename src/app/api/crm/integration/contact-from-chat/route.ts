// src/app/api/crm/integration/contact-from-chat/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get user if authenticated (optional for this endpoint)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { business_id, contact_data, user_id } = await request.json()
    
    if (!business_id || !contact_data) {
      return NextResponse.json({ 
        error: 'Business ID and contact data are required' 
      }, { status: 400 })
    }
    
    const { full_name, email, phone } = contact_data
    
    if (!full_name || !email) {
      return NextResponse.json({ 
        error: 'Full name and email are required' 
      }, { status: 400 })
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Please enter a valid email address' 
      }, { status: 400 })
    }
    
    // Verify business exists and is active
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, status, profile_id')
      .eq('id', business_id)
      .eq('status', 'active')
      .single()
    
    if (businessError || !business) {
      return NextResponse.json({ 
        error: 'Business not found or inactive' 
      }, { status: 404 })
    }
    
    // Check for existing contact with same email for this business
    const { data: existingContact, error: existingError } = await supabase
      .from('crm_contacts')
      .select('id, first_name, last_name, email')
      .eq('business_id', business_id)
      .eq('email', email.toLowerCase().trim())
      .single()
    
    if (existingContact) {
      // Contact exists - create interaction record and return existing contact
      await supabase
        .from('crm_interactions')
        .insert({
          contact_id: existingContact.id,
          business_id,
          type: 'ai_chat',
          subject: 'AI Chat Interaction',
          description: `Customer initiated AI chat conversation. Contact: ${full_name}`,
          interaction_date: new Date().toISOString(),
          external_metadata: {
            source: 'ai_chat_assistant',
            chat_initiated_at: new Date().toISOString(),
            user_agent: request.headers.get('user-agent'),
            is_returning_contact: true
          },
          created_by: user?.id || business.profile_id
        })

      // Create chat session for existing contact too
      const sessionToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24-hour sessions

      await supabase
        .from('chat_sessions')
        .insert({
          session_token: sessionToken,
          contact_id: existingContact.id,
          business_id,
          expires_at: expiresAt.toISOString(),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent'),
          is_active: true,
          last_activity: new Date().toISOString()
        })
      
      return NextResponse.json({ 
        message: 'Welcome back! Continuing with your existing contact information.',
        contact_id: existingContact.id,
        session: {
          token: sessionToken,
          expires_at: expiresAt.toISOString()
        },
        is_existing: true
      }, { status: 409 }) // 409 Conflict indicates existing contact
    }
    
    // Parse full name into first and last name for CRM storage
    const nameParts = full_name.trim().split(' ')
    const first_name = nameParts[0] || ''
    const last_name = nameParts.slice(1).join(' ') || ''
    
    // If user_id provided, check if profile exists
    let profile_id = null
    if (user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user_id)
        .single()
      
      if (profile) {
        profile_id = user_id
      }
    }
    
    // Create new contact
    const { data: newContact, error: contactError } = await supabase
      .from('crm_contacts')
      .insert({
        business_id,
        profile_id,
        first_name: first_name.trim(),
        last_name: (last_name || '').trim(),
        email: email.toLowerCase().trim(),
        phone: (phone || '').trim(),
        source: 'ai_chat',
        source_details: {
          source_type: 'ai_chat_assistant',
          business_name: business.name,
          initiated_at: new Date().toISOString(),
          user_agent: request.headers.get('user-agent'),
          referrer: request.headers.get('referer')
        },
        status: 'active',
        lifecycle_stage: 'prospect', // They're actively engaging
        notes: `Contact initiated through AI chat assistant on ${business.name}`,
        custom_fields: {
          chat_source: 'ai_assistant',
          first_interaction: 'chat'
        },
        tags: ['ai-chat', 'web-contact'],
        created_by: user?.id || business.profile_id
      })
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        source,
        lifecycle_stage,
        created_at
      `)
      .single()
    
    if (contactError) {
      console.error('Error creating contact:', contactError)
      
      // Handle specific database errors
      if (contactError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ 
          error: 'A contact with this email already exists for this business' 
        }, { status: 409 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to create contact. Please try again.' 
      }, { status: 500 })
    }
    
    // Create initial interaction record
    const { error: interactionError } = await supabase
      .from('crm_interactions')
      .insert({
        contact_id: newContact.id,
        business_id,
        type: 'ai_chat',
        subject: 'AI Chat Interaction - New Contact',
        description: `New contact created and initiated AI chat conversation. Contact: ${full_name}`,
        interaction_date: new Date().toISOString(),
        follow_up_required: true,
        follow_up_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        follow_up_notes: 'Follow up on AI chat inquiry',
        external_metadata: {
          source: 'ai_chat_assistant',
          chat_initiated_at: new Date().toISOString(),
          user_agent: request.headers.get('user-agent'),
          is_new_contact: true,
          business_name: business.name
        },
        created_by: user?.id || business.profile_id
      })
    
    if (interactionError) {
      console.error('Error creating interaction:', interactionError)
      // Don't fail the request, but log the error
    }
    
    // Optional: Create a task for business owner to follow up
    const followUpDate = new Date()
    followUpDate.setHours(followUpDate.getHours() + 2) // 2 hours from now
    
    await supabase
      .from('crm_tasks')
      .insert({
        business_id,
        contact_id: newContact.id,
        title: `Follow up on AI chat inquiry - ${full_name}`,
        description: `New contact ${full_name} (${email}) engaged with AI chat assistant. Consider reaching out to continue the conversation.`,
        type: 'follow_up',
        priority: 'medium',
        due_date: followUpDate.toISOString(),
        status: 'pending',
        assigned_to: business.profile_id,
        is_automated: true,
        created_by: user?.id || business.profile_id
      })

    // Create chat session for professional session management
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24-hour sessions

    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        session_token: sessionToken,
        contact_id: newContact.id,
        business_id,
        expires_at: expiresAt.toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent'),
        is_active: true,
        last_activity: new Date().toISOString()
      })

    if (sessionError) {
      console.error('Error creating chat session:', sessionError)
      // Don't fail the request, but log the error
    }
    
    // Return success response with session token
    return NextResponse.json({
      message: 'Contact created successfully',
      contact: {
        id: newContact.id,
        first_name: newContact.first_name,
        last_name: newContact.last_name,
        email: newContact.email,
        phone: newContact.phone,
        source: newContact.source,
        lifecycle_stage: newContact.lifecycle_stage,
        created_at: newContact.created_at
      },
      session: {
        token: sessionToken,
        expires_at: expiresAt.toISOString()
      },
      is_existing: false
    }, { status: 201 })
    
  } catch (error) {
    console.error('API Error in contact-from-chat:', error)
    
    // Return user-friendly error message
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.' 
    }, { status: 500 })
  }
}