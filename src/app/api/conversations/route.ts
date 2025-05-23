// src/app/api/conversations/route.ts (PROFESSIONAL OPTIMIZED - KEEP YOUR STRUCTURE)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10') // KEY OPTIMIZATION: Reduced from 20
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

    // KEY OPTIMIZATION: Get all messages at once instead of per-conversation
    const { data: allMessages } = await supabase
      .from('messages')
      .select(`
        conversation_id,
        id,
        content,
        message_type,
        created_at,
        sender_id,
        sender:profiles!messages_sender_id_fkey(id, full_name, display_name, avatar_url)
      `)
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })

    // Enhance conversations (keeping your exact structure)
    const enhancedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        const userParticipation = participations.find(p => p.conversation_id === conv.id)
        
        // Get all participants for this conversation - KEEP YOUR LOGIC
        const { data: allParticipants } = await supabase
          .from('conversation_participants')
          .select('profile_id, business_id, role')
          .eq('conversation_id', conv.id)

        // Get participant details - KEEP YOUR LOGIC
        const participantDetails = await Promise.all(
          (allParticipants || []).map(async (participant) => {
            let profile = null
            let business = null

            if (participant.profile_id) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('id, full_name, display_name, avatar_url')
                .eq('id', participant.profile_id)
                .single()
              profile = profileData
            }

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

        // KEY OPTIMIZATION: Use pre-fetched messages instead of separate query
        const latestMessage = allMessages?.find(m => m.conversation_id === conv.id)

        // KEY OPTIMIZATION: Calculate unread count from pre-fetched messages
        const lastReadAt = userParticipation?.last_read_at
        const unreadCount = allMessages?.filter(m => 
          m.conversation_id === conv.id &&
          m.sender_id !== session.user.id &&
          new Date(m.created_at) > new Date(lastReadAt || '1970-01-01')
        ).length || 0

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
          unread_count: unreadCount,
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { participant_ids, business_id, type = 'direct' } = body

    if (!participant_ids?.length) {
      return NextResponse.json({ error: 'Participant IDs required' }, { status: 400 })
    }

    // Check existing conversations
    if (participant_ids.length === 1) {
      let existingConversationId = null

      if (type === 'business_inquiry' && business_id) {
        const { data: existingBusiness } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('business_id', business_id)
          .in('profile_id', [session.user.id, participant_ids[0]])

        if (existingBusiness && existingBusiness.length >= 2) {
          const conversationCounts: { [key: string]: number } = {}
          existingBusiness.forEach(p => {
            conversationCounts[p.conversation_id] = (conversationCounts[p.conversation_id] || 0) + 1
          })
          
          existingConversationId = Object.keys(conversationCounts).find(
            id => conversationCounts[id] === 2
          )
        }
      } else {
        const { data: existingDirect } = await supabase
          .from('conversation_participants')
          .select('conversation_id, business_id')
          .in('profile_id', [session.user.id, participant_ids[0]])
          .is('business_id', null)

        if (existingDirect && existingDirect.length >= 2) {
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
      .insert({ type, status: 'active' })
      .select('id')
      .single()

    if (convError) throw convError

    // Add participants
    const allParticipants = [session.user.id, ...participant_ids].filter(
      (id, index, self) => self.indexOf(id) === index
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

    if (participantError) throw participantError

    return NextResponse.json({ conversation_id: conversation.id })

  } catch (error) {
    console.error('Create conversation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}