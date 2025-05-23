// src/app/api/conversations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = params.id

    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('profile_id', session.user.id)
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Soft delete: Remove user from conversation participants
    const { error: deleteError } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('profile_id', session.user.id)

    if (deleteError) {
      console.error('Error deleting conversation:', deleteError)
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
    }

    // Check if conversation has no more participants, then delete conversation
    const { count: remainingParticipants } = await supabase
      .from('conversation_participants')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    if (remainingParticipants === 0) {
      // Delete messages and conversation
      await supabase.from('messages').delete().eq('conversation_id', conversationId)
      await supabase.from('conversations').delete().eq('id', conversationId)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete conversation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}