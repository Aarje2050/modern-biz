// src/app/api/conversations/route.ts (FIXED VERSION)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get conversations where user is a participant
    const { data: participations, error: participationError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, role, joined_at, last_read_at, is_muted, business_id')
      .eq('profile_id', session.user.id)
      .order('joined_at', { ascending: false })

    if (participationError) {
      console.error('Participation error:', participationError)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({ 
        conversations: [],
        hasMore: false 
      })
    }

    const conversationIds = participations.map(p => p.conversation_id)

    // Get conversations with basic info
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, type, status, last_message_at, created_at, metadata')
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (conversationsError) {
      console.error('Conversations error:', conversationsError)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    // Enhance conversations with participants and latest message
    const enhancedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        const userParticipation = participations.find(p => p.conversation_id === conv.id)
        
        // Get all participants for this conversation
        const { data: allParticipants } = await supabase
          .from('conversation_participants')
          .select('profile_id, business_id, role')
          .eq('conversation_id', conv.id)

        // Get participant details
        const participantDetails = await Promise.all(
          (allParticipants || []).map(async (participant) => {
            let profile = null
            let business = null

            // Get profile info
            if (participant.profile_id) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('id, full_name, display_name, avatar_url')
                .eq('id', participant.profile_id)
                .single()
              profile = profileData
            }

            // Get business info if this is a business conversation
            if (participant.business_id) {
              const { data: businessData } = await supabase
                .from('businesses')
                .select('id, name, slug, logo_url, profile_id')
                .eq('id', participant.business_id)
                .single()
              business = businessData
            }

            return { profile, business }
          })
        )

        // Get latest message
        const { data: latestMessage } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            message_type,
            created_at,
            sender_id,
            sender:profiles!messages_sender_id_fkey(id, full_name, display_name, avatar_url)
          `)
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Calculate unread count
        const lastReadAt = userParticipation?.last_read_at
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', session.user.id) // Don't count own messages
          .gt('created_at', lastReadAt || '1970-01-01')

        return {
          id: conv.id,
          type: conv.type,
          status: conv.status,
          last_message_at: conv.last_message_at,
          created_at: conv.created_at,
          participants: participantDetails,
          latest_message: latestMessage ? {
            id: latestMessage.id,
            content: latestMessage.content,
            message_type: latestMessage.message_type,
            created_at: latestMessage.created_at,
            sender: latestMessage.sender
          } : null,
          unread_count: unreadCount || 0,
          is_muted: userParticipation?.is_muted || false
        }
      })
    )

    return NextResponse.json({ 
      conversations: enhancedConversations,
      hasMore: conversations.length === limit 
    })

  } catch (error) {
    console.error('Conversations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/conversations - Create a new conversation (FIXED - NO SUBJECT)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      participant_ids, 
      business_id, 
      type = 'direct'
      // Removed subject field as requested
    } = body

    console.log('Creating conversation:', { participant_ids, business_id, type })

    if (!participant_ids?.length) {
      return NextResponse.json({ 
        error: 'Participant IDs required' 
      }, { status: 400 })
    }

    // Check if conversation already exists (for both direct and business types)
    if (participant_ids.length === 1) {
      let existingConversationId = null

      if (type === 'business_inquiry' && business_id) {
        // For business conversations, check by business_id and participants
        const { data: existingBusiness } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('business_id', business_id)
          .in('profile_id', [session.user.id, participant_ids[0]])

        if (existingBusiness && existingBusiness.length >= 2) {
          // Find conversation that has both participants
          const conversationCounts: { [key: string]: number } = {}
          existingBusiness.forEach(p => {
            conversationCounts[p.conversation_id] = (conversationCounts[p.conversation_id] || 0) + 1
          })
          
          existingConversationId = Object.keys(conversationCounts).find(
            id => conversationCounts[id] === 2
          )
        }
      } else {
        // For direct messages, check by participants only
        const { data: existingDirect } = await supabase
          .from('conversation_participants')
          .select('conversation_id, business_id')
          .in('profile_id', [session.user.id, participant_ids[0]])
          .is('business_id', null) // Only direct conversations (no business)

        if (existingDirect && existingDirect.length >= 2) {
          // Find conversation that has both participants and no business
          const conversationCounts: { [key: string]: number } = {}
          existingDirect.forEach(p => {
            conversationCounts[p.conversation_id] = (conversationCounts[p.conversation_id] || 0) + 1
          })
          
          existingConversationId = Object.keys(conversationCounts).find(
            id => conversationCounts[id] === 2
          )
        }
      }

      if (existingConversationId) {
        return NextResponse.json({ 
          conversation_id: existingConversationId,
          existing: true 
        })
      }
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        type,
        status: 'active'
        // Removed subject field
      })
      .select('id')
      .single()

    if (convError) {
      console.error('Error creating conversation:', convError)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    // Add participants (including sender)
    const allParticipants = [session.user.id, ...participant_ids].filter(
      (id, index, self) => self.indexOf(id) === index // Remove duplicates
    )

    const participantData = allParticipants.map(profileId => ({
      conversation_id: conversation.id,
      profile_id: profileId,
      business_id: business_id || null,
      role: profileId === session.user.id ? 'owner' : 'participant'
    }))

    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert(participantData)

    if (participantError) {
      console.error('Error adding participants:', participantError)
      // Clean up conversation
      await supabase.from('conversations').delete().eq('id', conversation.id)
      return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 })
    }

    return NextResponse.json({ 
      conversation_id: conversation.id
    })

  } catch (error) {
    console.error('Create conversation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}