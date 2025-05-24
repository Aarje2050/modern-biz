// src/lib/email/service.ts
import { createServiceClient } from '@/lib/supabase/service'
import { queueEmail, emailQueue } from './queue/processor'
import { TemplateVariables } from './templates/engine'

export interface NotificationEmailParams {
  recipientId: string
  templateType: string
  templateData?: TemplateVariables
  priority?: 'urgent' | 'high' | 'normal' | 'low'
  scheduledFor?: Date
  metadata?: Record<string, any>
}

export interface DirectEmailParams {
  recipientEmail: string
  recipientName?: string
  templateType: string
  templateData?: TemplateVariables
  priority?: 'urgent' | 'high' | 'normal' | 'low'
  scheduledFor?: Date
  metadata?: Record<string, any>
}

class EmailService {
  private supabase = createServiceClient()

  /**
   * Send email based on existing notification
   */
  async sendNotificationEmail(
    notificationId: string,
    templateType?: string
  ): Promise<string | null> {
    try {
      // Get notification details using public views
      const { data: notification, error } = await this.supabase
        .from('notifications')
        .select(`
          *,
          recipient:profiles!notifications_recipient_id_fkey(
            id,
            full_name,
            display_name
          ),
          sender:profiles!notifications_sender_id_fkey(
            id,
            full_name,
            display_name
          )
        `)
        .eq('id', notificationId)
        .single()

      if (error || !notification) {
        throw new Error(`Notification not found: ${notificationId}`)
      }

      if (notification.is_email_sent) {
        console.log(`Email already sent for notification: ${notificationId}`)
        return null
      }

      // Get recipient email from auth.users via service role
      const { data: authUser, error: authError } = await this.supabase.auth.admin.getUserById(notification.recipient_id)

      if (authError || !authUser.user?.email) {
        console.log(`No email address for notification recipient: ${notificationId}`)
        return null
      }

      // Determine template type
      const emailTemplateType = templateType || this.getTemplateTypeFromNotification(notification.type)

      // Prepare template data
      const templateData = this.buildTemplateData(notification)

      // Queue email
      const emailId = await queueEmail({
        notificationId,
        recipientEmail: authUser.user.email,
        recipientName: notification.recipient.display_name || notification.recipient.full_name,
        templateType: emailTemplateType,
        templateData,
        priority: this.getPriorityFromNotification(notification.priority),
        metadata: {
          notification_type: notification.type,
          entity_type: notification.entity_type,
          entity_id: notification.entity_id
        }
      })

      console.log(`Email queued for notification ${notificationId}: ${emailId}`)
      return emailId

    } catch (error) {
      console.error('Send notification email error:', error)
      throw error
    }
  }

  /**
   * Send email to specific user
   */
  async sendUserEmail(params: NotificationEmailParams): Promise<string> {
    try {
      // Get user details from public.profiles view
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('id, full_name, display_name')
        .eq('id', params.recipientId)
        .single()

      if (error || !profile) {
        throw new Error(`User not found: ${params.recipientId}`)
      }

      // Get email from auth.users
      const { data: authUser, error: authError } = await this.supabase.auth.admin.getUserById(params.recipientId)

      if (authError || !authUser.user?.email) {
        throw new Error(`No email address for user: ${params.recipientId}`)
      }

      const userName = profile.display_name || profile.full_name || 'User'

      // Queue email
      return await queueEmail({
        recipientEmail: authUser.user.email,
        recipientName: userName,
        templateType: params.templateType,
        templateData: {
          user: {
            id: profile.id,
            name: userName,
            email: authUser.user.email
          },
          ...params.templateData
        },
        priority: params.priority,
        scheduledFor: params.scheduledFor,
        metadata: params.metadata
      })

    } catch (error) {
      console.error('Send user email error:', error)
      throw error
    }
  }

  /**
   * Send direct email (without user lookup)
   */
  async sendDirectEmail(params: DirectEmailParams): Promise<string> {
    return await queueEmail(params)
  }

  /**
   * Send bulk emails to multiple users
   */
  async sendBulkEmails(
    userIds: string[],
    templateType: string,
    templateData: TemplateVariables = {},
    options: {
      priority?: 'urgent' | 'high' | 'normal' | 'low'
      scheduledFor?: Date
      batchSize?: number
    } = {}
  ): Promise<string[]> {
    const { priority = 'normal', scheduledFor, batchSize = 50 } = options
    const emailIds: string[] = []

    // Process in batches to avoid overwhelming the queue
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (userId) => {
        try {
          const emailId = await this.sendUserEmail({
            recipientId: userId,
            templateType,
            templateData,
            priority,
            scheduledFor
          })
          return emailId
        } catch (error) {
          console.error(`Failed to queue email for user ${userId}:`, error)
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      emailIds.push(...batchResults.filter(Boolean) as string[])

      // Small delay between batches
      if (i + batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`Queued ${emailIds.length} emails out of ${userIds.length} users`)
    return emailIds
  }

  /**
   * Business-specific email methods
   */

  // Welcome email for new users
  async sendWelcomeEmail(userId: string): Promise<string> {
    return this.sendUserEmail({
      recipientId: userId,
      templateType: 'welcome',
      priority: 'high'
    })
  }

  // Business approval notification
  async sendBusinessApprovalEmail(businessOwnerId: string, businessData: any): Promise<string> {
    return this.sendUserEmail({
      recipientId: businessOwnerId,
      templateType: 'business_approved',
      templateData: {
        business: businessData
      },
      priority: 'high'
    })
  }

  // Business rejection notification
  async sendBusinessRejectionEmail(
    businessOwnerId: string, 
    businessData: any, 
    reason: string
  ): Promise<string> {
    return this.sendUserEmail({
      recipientId: businessOwnerId,
      templateType: 'business_rejected',
      templateData: {
        business: businessData,
        rejection_reason: reason
      },
      priority: 'high'
    })
  }

  // New review notification
  async sendNewReviewEmail(
    businessOwnerId: string, 
    reviewData: any, 
    businessData: any
  ): Promise<string> {
    return this.sendUserEmail({
      recipientId: businessOwnerId,
      templateType: 'review_posted',
      templateData: {
        review: reviewData,
        business: businessData
      },
      priority: 'normal'
    })
  }

  // Message notification
  async sendMessageEmail(
    recipientId: string, 
    messageData: any, 
    senderData: any
  ): Promise<string> {
    return this.sendUserEmail({
      recipientId: recipientId,
      templateType: 'message_received',
      templateData: {
        message: messageData,
        sender: senderData,
        recipient: {
          name: 'User' // Will be filled by sendUserEmail
        },
        action_url: `${process.env.NEXT_PUBLIC_APP_URL}/messages`
      },
      priority: 'high'
    })
  }

  /**
   * Helper methods
   */
  private getTemplateTypeFromNotification(notificationType: string): string {
    const typeMapping: Record<string, string> = {
      'business_approved': 'business_approved',
      'business_rejected': 'business_rejected', 
      'review_posted': 'review_posted',
      'review_response': 'review_response',
      'message_received': 'message_received',
      'welcome': 'welcome'
    }

    return typeMapping[notificationType] || 'general_notification'
  }

  private getPriorityFromNotification(priority: string): 'urgent' | 'high' | 'normal' | 'low' {
    switch (priority) {
      case 'urgent': return 'urgent'
      case 'high': return 'high'
      case 'low': return 'low'
      default: return 'normal'
    }
  }

  private buildTemplateData(notification: any): TemplateVariables {
    const baseData = {
      notification: {
        title: notification.title,
        content: notification.content,
        action_url: notification.action_url,
        created_at: notification.created_at
      },
      recipient: {
        name: notification.recipient?.display_name || notification.recipient?.full_name || 'User'
      }
    }

    if (notification.sender) {
      (baseData as any).sender = {
        name: notification.sender.display_name || notification.sender.full_name || 'System'
      }
    }

    // Add entity-specific data from metadata
    if (notification.metadata) {
      return { ...baseData, ...notification.metadata }
    }

    return baseData
  }

  /**
   * Administrative methods
   */

  // Start the email processor
  startEmailProcessor(intervalMs?: number): void {
    emailQueue.startProcessor(intervalMs)
  }

  // Stop the email processor
  stopEmailProcessor(): void {
    emailQueue.stopProcessor()
  }

  // Get queue statistics
  async getEmailStats(): Promise<Record<string, number>> {
    return emailQueue.getQueueStats()
  }

  // Process queue manually
  async processEmailQueue(): Promise<void> {
    return emailQueue.processQueue()
  }
}

// Export singleton instance
export const emailService = new EmailService()

// Auto-start processor in production
if (process.env.NODE_ENV === 'production') {
  emailService.startEmailProcessor()
}