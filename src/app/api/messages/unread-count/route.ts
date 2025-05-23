// src/app/api/messages/unread-count/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's conversations
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('profile_id', session.user.id)

    if (!participations || participations.length === 0) {
      return NextResponse.json({ unread_count: 0 })
    }

    let totalUnread = 0

    // Count unread messages for each conversation
    for (const participation of participations) {
      const lastReadAt = participation.last_read_at || '1970-01-01'
      
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', participation.conversation_id)
        .neq('sender_id', session.user.id) // Don't count own messages
        .gt('created_at', lastReadAt)
      
      totalUnread += count || 0
    }

    return NextResponse.json({ unread_count: totalUnread })

  } catch (error) {
    console.error('Unread messages count API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}