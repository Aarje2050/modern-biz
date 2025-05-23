// src/app/api/notifications/route.ts (ADD THIS IF MISSING OR UPDATE EXISTING)
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
    const countOnly = searchParams.get('count_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // If only count is requested
    if (countOnly) {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', session.user.id)
        .eq('is_read', false)

      return NextResponse.json({ unread_count: count || 0 })
    }

    // Get notifications with sender info
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        title,
        content,
        action_url,
        is_read,
        priority,
        created_at,
        sender_id,
        sender:profiles!notifications_sender_id_fkey(
          id,
          full_name,
          display_name,
          avatar_url
        )
      `)
      .eq('recipient_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', session.user.id)
      .eq('is_read', false)

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      hasMore: notifications.length === limit
    })

  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notification_ids, mark_all_read } = await request.json()

    if (mark_all_read) {
      // Mark all notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', session.user.id)
        .eq('is_read', false)

      if (error) throw error
    } else if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', session.user.id)
        .in('id', notification_ids)

      if (error) throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Mark notifications as read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}