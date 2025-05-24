// src/lib/email/integrations/notifications.ts
import { createServiceClient } from '@/lib/supabase/service'
import { emailService } from '../service'

/**
 * Enhanced notification creation that includes email sending
 */
export async function createNotificationWithEmail(params: {
  recipientId: string
  senderId?: string
  type: string
  title: string
  content: string
  actionUrl?: string
  entityType?: string
  entityId?: string
  priority?: string
  metadata?: Record<string, any>
  emailTemplateType?: string
  emailTemplateData?: Record<string, any>
  skipEmail?: boolean
}) {
  const supabase = createServiceClient()

  try {
    // Create notification first
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: params.recipientId,
        sender_id: params.senderId,
        type: params.type,
        title: params.title,
        content: params.content,
        action_url: params.actionUrl,
        entity_type: params.entityType,
        entity_id: params.entityId,
        priority: params.priority || 'normal',
        metadata: params.metadata || {}
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`)
    }

    // Send email if not skipped
    if (!params.skipEmail) {
      try {
        await emailService.sendNotificationEmail(
          notification.id,
          params.emailTemplateType
        )
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError)
        // Don't fail the entire operation if email fails
      }
    }

    return notification

  } catch (error) {
    console.error('Create notification with email error:', error)
    throw error
  }
}

