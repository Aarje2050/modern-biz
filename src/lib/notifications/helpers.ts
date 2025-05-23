// src/lib/notifications/helpers.ts
import { createClient } from '@/lib/supabase/server'

export type NotificationType = 
  | 'message_received'
  | 'business_approved' 
  | 'business_rejected'
  | 'review_posted'
  | 'review_response'
  | 'business_inquiry'
  | 'account_verification'
  | 'profile_updated'

export interface NotificationData {
  recipient_id: string
  sender_id?: string
  type: NotificationType
  title: string
  content?: string
  action_url?: string
  entity_type?: string
  entity_id?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  expires_at?: string
  metadata?: Record<string, any>
}

export async function createNotification(data: NotificationData) {
  try {
    const supabase = await createClient()
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: data.recipient_id,
        sender_id: data.sender_id || null,
        type: data.type,
        title: data.title,
        content: data.content || null,
        action_url: data.action_url || null,
        entity_type: data.entity_type || null,
        entity_id: data.entity_id || null,
        priority: data.priority || 'normal',
        expires_at: data.expires_at || null,
        metadata: data.metadata || {},
        is_read: false,
        is_email_sent: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return notification
  } catch (error) {
    console.error('Notification helper error:', error)
    return null
  }
}

export async function createNotificationFromTemplate(
  templateType: NotificationType,
  recipientId: string,
  variables: Record<string, any>,
  options: {
    senderId?: string
    actionUrl?: string
    entityType?: string
    entityId?: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    expiresAt?: string
  } = {}
) {
  try {
    const supabase = await createClient()
    
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('type', templateType)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      console.error('Template not found:', templateType)
      return null
    }

    // Replace variables in templates
    let title = template.subject_template
    let content = template.content_template

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`
      title = title.replace(new RegExp(placeholder, 'g'), String(value))
      content = content.replace(new RegExp(placeholder, 'g'), String(value))
    }

    return await createNotification({
      recipient_id: recipientId,
      sender_id: options.senderId,
      type: templateType,
      title,
      content,
      action_url: options.actionUrl,
      entity_type: options.entityType,
      entity_id: options.entityId,
      priority: options.priority,
      expires_at: options.expiresAt,
      metadata: { template_used: template.id, variables }
    })
  } catch (error) {
    console.error('Template notification helper error:', error)
    return null
  }
}

export async function markNotificationsAsRead(
  recipientId: string,
  notificationIds?: string[]
) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('notifications')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('recipient_id', recipientId)
      .eq('is_read', false)

    if (notificationIds && notificationIds.length > 0) {
      query = query.in('id', notificationIds)
    }

    const { error } = await query

    if (error) {
      console.error('Error marking notifications as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Mark notifications read helper error:', error)
    return false
  }
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    const supabase = await createClient()
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)
      .or('expires_at.is.null,expires_at.gt.now()')

    if (error) {
      console.error('Error getting unread count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Unread count helper error:', error)
    return 0
  }
}

export async function getUserNotificationPreferences(userId: string) {
  try {
    const supabase = await createClient()
    
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('profile_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching preferences:', error)
      return null
    }

    // Return default preferences if none exist
    if (!preferences) {
      return {
        email_notifications: {
          message_received: true,
          review_posted: true,
          business_approved: true,
          business_rejected: true,
          review_response: true,
          marketing: false
        },
        push_notifications: {
          message_received: true,
          review_posted: true,
          business_approved: true,
          business_rejected: true,
          review_response: true
        },
        in_app_notifications: {
          message_received: true,
          review_posted: true,
          business_approved: true,
          business_rejected: true,
          review_response: true
        }
      }
    }

    return preferences
  } catch (error) {
    console.error('Get preferences helper error:', error)
    return null
  }
}