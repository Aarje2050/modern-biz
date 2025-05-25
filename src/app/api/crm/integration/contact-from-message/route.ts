// src/app/api/crm/integration/contact-from-message/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function POST(request: NextRequest) {
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      const { message_id, business_id } = await request.json()
  
      if (!message_id || !business_id) {
        return NextResponse.json({ 
          error: 'Message ID and business ID required' 
        }, { status: 400 })
      }
  
      // Verify business ownership
      const { data: businessAccess } = await supabase
        .from('businesses')
        .select('id')
        .eq('id', business_id)
        .eq('profile_id', user.id)
        .single()
  
      if (!businessAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
  
      // Get message/conversation details
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select(`
          *,
          sender:profiles!profile_id(
            id,
            full_name,
            email
          )
        `)
        .eq('id', message_id)
        .eq('business_id', business_id)
        .single()
  
      if (conversationError || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
  
      if (!conversation.sender) {
        return NextResponse.json({ error: 'Message sender not found' }, { status: 404 })
      }
  
      // Check if contact already exists
      const { data: existingContact } = await supabase
        .from('crm_contacts')
        .select('id')
        .eq('business_id', business_id)
        .eq('profile_id', conversation.sender.id)
        .single()
  
      if (existingContact) {
        return NextResponse.json({ 
          message: 'Contact already exists',
          contact_id: existingContact.id 
        })
      }
  
      // Extract name from full_name
      const nameParts = (conversation.sender.full_name || '').split(' ')
      const firstName = nameParts[0] || 'Unknown'
      const lastName = nameParts.slice(1).join(' ') || ''
  
      // Create contact from message
      const { data: contact, error: contactError } = await supabase
        .from('crm_contacts')
        .insert({
          business_id,
          profile_id: conversation.sender.id,
          first_name: firstName,
          last_name: lastName,
          email: conversation.sender.email || '',
          source: 'message',
          source_details: {
            conversation_id: conversation.id,
            subject: conversation.subject,
            message_date: conversation.created_at
          },
          lifecycle_stage: 'prospect', // They've inquired about services
          notes: `Contacted via message: "${conversation.subject}"`,
          created_by: user.id
        })
        .select()
        .single()
  
      if (contactError) {
        console.error('Error creating contact:', contactError)
        return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
      }
  
      // Create interaction record
      await supabase
        .from('crm_interactions')
        .insert({
          contact_id: contact.id,
          business_id,
          type: 'email',
          subject: conversation.subject || 'Customer inquiry',
          description: 'Customer sent message via directory',
          interaction_date: conversation.created_at,
          external_id: conversation.id,
          created_by: user.id
        })
  
      return NextResponse.json({ 
        contact,
        message: 'Contact created from message successfully' 
      })
  
    } catch (error) {
      console.error('API Error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
  