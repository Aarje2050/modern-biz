// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { messages, businessId, contactId, sessionToken } = await request.json()
    
    if (!messages || !businessId) {
      return NextResponse.json(
        { error: 'Messages and business ID are required' },
        { status: 400 }
      )
    }
    
    // Get user if authenticated
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Optional: Verify business exists and is active
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, status, profile_id')
      .eq('id', businessId)
      .eq('status', 'active')
      .single()
    
    if (!business) {
      return NextResponse.json(
        { error: 'Business not found or inactive' },
        { status: 404 }
      )
    }

    // If session token provided, validate and update activity
    if (sessionToken && contactId) {
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('session_token', sessionToken)
        .eq('contact_id', contactId)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (session) {
        // Update session activity
        await supabase
          .from('chat_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('session_token', sessionToken)
      }
    }
    
    // Track chat usage for analytics (optional)
    console.log(`Chat request for business: ${businessId}, contact: ${contactId || 'anonymous'}, session: ${sessionToken || 'none'}`)
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Or a more affordable model like gpt-3.5-turbo
      messages,
      temperature: 0.7,
      max_tokens: 500
    })
    
    const assistantMessage = response.choices[0].message.content
    
    // If we have a contact ID, create/update interaction record for analytics
    if (contactId) {
      try {
        // Get the latest user message for context
        const latestUserMessage = messages
          .filter((m:any) => m.role === 'user')
          .pop()?.content || 'Chat interaction'
        
        // Update or create interaction record
        const { data: existingInteraction } = await supabase
          .from('crm_interactions')
          .select('id, external_metadata')
          .eq('contact_id', contactId)
          .eq('business_id', businessId)
          .eq('type', 'ai_chat')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (existingInteraction) {
          // Update existing interaction with message count
          const currentMetadata = existingInteraction.external_metadata || {}
          const messageCount = (currentMetadata.message_count || 0) + 1
          
          await supabase
            .from('crm_interactions')
            .update({
              description: `AI Chat conversation - ${messageCount} messages exchanged`,
              external_metadata: {
                ...currentMetadata,
                message_count: messageCount,
                last_message_at: new Date().toISOString(),
                last_user_message: latestUserMessage.substring(0, 200), // Store preview
                conversation_active: true,
                session_token: sessionToken // Track session
              }
            })
            .eq('id', existingInteraction.id)
        } else {
          // Create new interaction record if somehow missing
          await supabase
            .from('crm_interactions')
            .insert({
              contact_id: contactId,
              business_id: businessId,
              type: 'ai_chat',
              subject: 'AI Chat Conversation',
              description: 'AI Chat conversation in progress',
              interaction_date: new Date().toISOString(),
              external_metadata: {
                source: 'ai_chat_assistant',
                message_count: 1,
                last_message_at: new Date().toISOString(),
                last_user_message: latestUserMessage.substring(0, 200),
                conversation_active: true,
                session_token: sessionToken
              },
              created_by: user?.id || business.profile_id
            })
        }
      
        try {
          await supabase
            .from('analytics_page_views')
            .insert({
              entity_type: 'business_chat',
              entity_id: businessId,
              session_id: sessionToken || contactId,
              user_agent: request.headers.get('user-agent'),
              referrer: request.headers.get('referer'),
              created_at: new Date().toISOString()
            })
        } catch (error: any) {
          // Don't fail the request if analytics insert fails
          console.warn('Analytics insert failed:', error)
        }
        

        
        
      } catch (interactionError) {
        // Don't fail the chat if interaction logging fails
        console.error('Error updating interaction:', interactionError)
      }
    }
    
    return NextResponse.json({
      message: assistantMessage
    })
    
  } catch (error) {
    console.error('OpenAI API error:', error)
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 500 }
        )
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'AI service is busy. Please try again in a moment.' },
          { status: 429 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'There was an error processing your request. Please try again.' },
      { status: 500 }
    )
  }
}