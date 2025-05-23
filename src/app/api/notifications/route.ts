// src/app/api/notifications/route.ts (FIXED VERSION)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/notifications - Get user's notifications
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
    const unreadOnly = searchParams.get('unread_only') === 'true'

    let query = supabase
      .from('notifications')
      .select(`
        id,
        sender_id,
        type,
        title,
        content,
        action_url,
        entity_type,
        entity_id,
        is_read,
        priority,
        expires_at,
        created_at
      `)
      .eq('recipient_id', session.user.id)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    // Filter out expired notifications
    query = query.or('expires_at.is.null,expires_at.gt.now()')

    const { data: notifications, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get sender info separately for notifications that have a sender
    const notificationsWithSender = await Promise.all(
      (notifications || []).map(async (notification) => {
        if (notification.sender_id) {
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, full_name, display_name, avatar_url')
            .eq('id', notification.sender_id)
            .single()

          return {
            ...notification,
            sender
          }
        }
        return {
          ...notification,
          sender: null
        }
      })
    )

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', session.user.id)
      .eq('is_read', false)
      .or('expires_at.is.null,expires_at.gt.now()')

    return NextResponse.json({ 
      notifications: notificationsWithSender,
      unread_count: unreadCount || 0,
      hasMore: notifications.length === limit 
    })

  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notification_ids, mark_all_read = false } = body

    if (mark_all_read) {
      // Mark all notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('recipient_id', session.user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
      }

      return NextResponse.json({ success: true, updated: 'all' })
    }

    if (!notification_ids?.length) {
      return NextResponse.json({ error: 'Notification IDs required' }, { status: 400 })
    }

    // Mark specific notifications as read
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .in('id', notification_ids)
      .eq('recipient_id', session.user.id)

    if (error) {
      console.error('Error marking notifications as read:', error)
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: notification_ids.length })

  } catch (error) {
    console.error('Update notifications API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}