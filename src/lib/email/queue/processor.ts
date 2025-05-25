// src/lib/email/queue/processor.ts
import { createServiceClient } from '@/lib/supabase/service'
import { createEmailProvider, getEmailConfig } from '../providers/resend'
import { compileEmailTemplate, TemplateVariables } from '../templates/engine'

interface QueuedEmail {
  id: string
  notification_id: string | null
  recipient_email: string
  recipient_name: string | null
  template_type: string
  template_data: TemplateVariables
  subject: string
  html_content: string
  text_content: string | null
  priority: 'urgent' | 'high' | 'normal' | 'low'
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
  attempts: number
  max_attempts: number
  scheduled_for: string
  error_message: string | null
  metadata: Record<string, any>
}

interface EmailQueueParams {
  notificationId?: string
  recipientEmail: string
  recipientName?: string
  templateType: string
  templateData?: TemplateVariables
  priority?: 'urgent' | 'high' | 'normal' | 'low'
  scheduledFor?: Date
  metadata?: Record<string, any>
}

class EmailQueueProcessor {
  private supabase = createServiceClient()
  private emailProvider = createEmailProvider(getEmailConfig())
  private isProcessing = false
  private processingInterval: NodeJS.Timeout | null = null

  /**
   * Add email to queue
   */
  async enqueue(params: EmailQueueParams): Promise<string> {
    try {
      // Compile template first to catch errors early
      const compiled = await compileEmailTemplate(params.templateType, params.templateData)

      const queueEntry = {
        notification_id: params.notificationId || null,
        recipient_email: params.recipientEmail.toLowerCase().trim(),
        recipient_name: params.recipientName || null,
        template_type: params.templateType,
        template_data: params.templateData || {},
        subject: compiled.subject,
        html_content: compiled.html,
        text_content: compiled.text,
        priority: params.priority || 'normal',
        status: 'pending' as const,
        scheduled_for: params.scheduledFor || new Date(),
        metadata: params.metadata || {}
      }

      const { data, error } = await this.supabase
        .from('email_queue') // Uses public.email_queue view
        .insert(queueEntry)
        .select('id')
        .single()

      if (error) {
        throw new Error(`Failed to enqueue email: ${error.message}`)
      }

      console.log(`Email queued: ${data.id} for ${params.recipientEmail}`)
      return data.id

    } catch (error) {
      console.error('Email enqueue error:', error)
      throw error
    }
  }

  /**
   * Process pending emails in queue
   */
  async processQueue(batchSize: number = 10): Promise<void> {
    if (this.isProcessing) {
      console.log('Queue processing already in progress')
      return
    }

    this.isProcessing = true

    try {
      // Get pending emails, prioritized and scheduled
      const { data: emails, error } = await this.supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: false }) // urgent first
        .order('created_at', { ascending: true }) // oldest first
        .limit(batchSize)

      if (error) {
        throw new Error(`Failed to fetch queue: ${error.message}`)
      }

      if (!emails || emails.length === 0) {
        console.log('No emails to process')
        return
      }

      console.log(`Processing ${emails.length} emails`)

      // Process emails with controlled concurrency
      await this.processBatch(emails)

    } catch (error) {
      console.error('Queue processing error:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process batch of emails with controlled concurrency
   */
  private async processBatch(emails: QueuedEmail[]): Promise<void> {
    const concurrency = 3 // Process 3 emails at a time
    
    for (let i = 0; i < emails.length; i += concurrency) {
      const batch = emails.slice(i, i + concurrency)
      await Promise.all(batch.map(email => this.processEmail(email)))
    }
  }

  /**
   * Process individual email
   */
  private async processEmail(email: QueuedEmail): Promise<void> {
    try {
      // Mark as processing
      await this.updateEmailStatus(email.id, 'processing')

      // Check if recipient wants emails
      const shouldSend = await this.shouldSendEmail(email)
      if (!shouldSend) {
        await this.updateEmailStatus(email.id, 'cancelled', 'User has disabled email notifications')
        return
      }

      // Send email
      const result = await this.emailProvider.send({
        from: getEmailConfig().defaultFrom,
        to: email.recipient_email,
        subject: email.subject,
        html: email.html_content,
        text: email.text_content || undefined,
        tags: {
          template_type: email.template_type,
          priority: email.priority
        },
        metadata: {
          queue_id: email.id,
          notification_id: email.notification_id,
          ...email.metadata
        }
      })

      if (result.success) {
        // Mark as sent
        await this.updateEmailStatus(email.id, 'sent', null, result.messageId)
        
        // Update notification if linked
        if (email.notification_id) {
          await this.updateNotificationEmailStatus(email.notification_id, true)
        }

        // Log successful send
        await this.logEmailEvent(email.id, 'sent', email.recipient_email)

        console.log(`Email sent successfully: ${email.id}`)

      } else {
        // Handle failure
        await this.handleEmailFailure(email, result.error || 'Unknown error')
      }

    } catch (error: any) {
      console.error(`Error processing email ${email.id}:`, error)
      await this.handleEmailFailure(email, error.message)
    }
  }

  /**
   * Handle email sending failure
   */
  private async handleEmailFailure(email: QueuedEmail, errorMessage: string): Promise<void> {
    const newAttempts = email.attempts + 1
    
    if (newAttempts >= email.max_attempts) {
      // Max attempts reached, mark as failed
      await this.updateEmailStatus(email.id, 'failed', errorMessage)
      
      // Log failure
      await this.logEmailEvent(email.id, 'failed', email.recipient_email, { error: errorMessage })
      
      console.error(`Email failed permanently: ${email.id} - ${errorMessage}`)
    } else {
      // Retry with exponential backoff
      const retryDelay = Math.pow(2, newAttempts) * 60 * 1000 // 2^n minutes in ms
      const nextAttempt = new Date(Date.now() + retryDelay)
      
      await this.supabase
        .from('email_queue')
        .update({
          status: 'pending',
          attempts: newAttempts,
          scheduled_for: nextAttempt.toISOString(),
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', email.id)

      console.log(`Email retry scheduled: ${email.id} - attempt ${newAttempts}/${email.max_attempts}`)
    }
  }

  /**
   * Check if email should be sent based on user preferences
   */
  private async shouldSendEmail(email: QueuedEmail): Promise<boolean> {
    try {
      // Get user by email using public.profiles view
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('email', email.recipient_email)
        .single()

      if (!profile) return true // Send if no profile found

      // Get user preferences
      const { data: prefs } = await this.supabase
        .from('user_preferences')
        .select('email_notifications, quiet_hours_start, quiet_hours_end, timezone')
        .eq('profile_id', profile.id)
        .single()

      if (!prefs) return true // Send if no preferences found

      // Check if this type of email is enabled
      const emailSettings = prefs.email_notifications
      if (emailSettings && emailSettings[email.template_type] === false) {
        return false
      }

      // Check quiet hours (basic implementation)
      if (prefs.quiet_hours_start && prefs.quiet_hours_end && email.priority !== 'urgent') {
        const now = new Date()
        const currentHour = now.getHours()
        const startHour = parseInt(prefs.quiet_hours_start.split(':')[0])
        const endHour = parseInt(prefs.quiet_hours_end.split(':')[0])
        
        let isQuietTime = false
        if (startHour <= endHour) {
          isQuietTime = currentHour >= startHour && currentHour < endHour
        } else {
          // Quiet hours span midnight
          isQuietTime = currentHour >= startHour || currentHour < endHour
        }
        
        if (isQuietTime) {
          // Reschedule for after quiet hours
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          tomorrow.setHours(endHour, 0, 0, 0)
          
          await this.supabase
            .from('email_queue')
            .update({
              scheduled_for: tomorrow.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id)
          
          return false
        }
      }

      return true

    } catch (error) {
      console.error('Error checking send preferences:', error)
      return true // Send by default if check fails
    }
  }

  /**
   * Update email status in queue
   */
  private async updateEmailStatus(
    emailId: string, 
    status: QueuedEmail['status'], 
    errorMessage?: string | null,
    messageId?: string
  ): Promise<void> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'sent') {
      updates.sent_at = new Date().toISOString()
      if (messageId) {
        updates.provider_message_id = messageId
      }
    }

    if (status === 'failed') {
      updates.failed_at = new Date().toISOString()
    }

    if (errorMessage !== undefined) {
      updates.error_message = errorMessage
    }

    await this.supabase
      .from('email_queue')
      .update(updates)
      .eq('id', emailId)
  }

  /**
   * Update notification email status
   */
  private async updateNotificationEmailStatus(notificationId: string, sent: boolean): Promise<void> {
    await this.supabase
      .from('notifications')
      .update({
        is_email_sent: sent,
        email_sent_at: sent ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
  }

  /**
   * Log email event
   */
  private async logEmailEvent(
    emailQueueId: string,
    eventType: string,
    recipientEmail: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await this.supabase
        .from('email_logs')
        .insert({
          email_queue_id: emailQueueId,
          event_type: eventType,
          recipient_email: recipientEmail,
          provider: 'resend',
          metadata
        })
    } catch (error) {
      console.error('Failed to log email event:', error)
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<Record<string, number>> {
    const { data, error } = await this.supabase
      .from('email_queue')
      .select('status')

    if (error) {
      throw new Error(`Failed to get queue stats: ${error.message}`)
    }

    const stats = data.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      pending: stats.pending || 0,
      processing: stats.processing || 0,
      sent: stats.sent || 0,
      failed: stats.failed || 0,
      cancelled: stats.cancelled || 0
    }
  }

  /**
   * Start automatic queue processing
   */
  startProcessor(intervalMs: number = 30000): void { // Every 30 seconds
    if (this.processingInterval) {
      console.log('Email processor already running')
      return
    }

    console.log(`Starting email processor with ${intervalMs}ms interval`)
    
    this.processingInterval = setInterval(() => {
      this.processQueue().catch(console.error)
    }, intervalMs)

    // Process immediately
    this.processQueue().catch(console.error)
  }

  /**
   * Stop automatic queue processing
   */
  stopProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
      console.log('Email processor stopped')
    }
  }
}

// Export singleton instance
export const emailQueue = new EmailQueueProcessor()

// Helper function for easy email queuing
export async function queueEmail(params: EmailQueueParams): Promise<string> {
  return emailQueue.enqueue(params)
}