// src/app/api/messages/route.ts (FIXED VERSION)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/messages - Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    // Verify user is participant in conversation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('profile_id', session.user.id)
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get messages without automatic joins
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        content,
        message_type,
        attachments,
        reply_to_id,
        is_edited,
        edited_at,
        created_at,
        updated_at
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Get sender info separately
    const messagesWithSender = await Promise.all(
      (messages || []).map(async (message) => {
        const { data: sender } = await supabase
          .from('profiles')
          .select('id, full_name, display_name, avatar_url')
          .eq('id', message.sender_id)
          .single()

        return {
          ...message,
          sender: sender || {
            id: message.sender_id,
            full_name: null,
            display_name: null,
            avatar_url: null
          }
        }
      })
    )

    // Update user's last_read_at
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('profile_id', session.user.id)

    return NextResponse.json({ 
      messages: messagesWithSender.reverse(), // Return in chronological order
      hasMore: messages.length === limit 
    })

  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversation_id, content, message_type = 'text', attachments = [], reply_to_id } = body

    if (!conversation_id || !content?.trim()) {
      return NextResponse.json({ error: 'Conversation ID and content required' }, { status: 400 })
    }

    // Verify user is participant in conversation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversation_id)
      .eq('profile_id', session.user.id)
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id: session.user.id,
        content: content.trim(),
        message_type,
        attachments,
        reply_to_id
      })
      .select(`
        id,
        sender_id,
        content,
        message_type,
        attachments,
        reply_to_id,
        created_at
      `)
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Get sender info
    const { data: sender } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, avatar_url')
      .eq('id', session.user.id)
      .single()

    const messageWithSender = {
      ...message,
      sender: sender || {
        id: session.user.id,
        full_name: null,
        display_name: null,
        avatar_url: null
      }
    }

    return NextResponse.json({ message: messageWithSender })

  } catch (error) {
    console.error('Send message API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}