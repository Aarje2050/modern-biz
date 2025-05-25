// src/lib/email/integrations/messaging.ts
import { emailService } from '../service'
import { createServiceClient } from '@/lib/supabase/service'

export class MessagingEmailIntegrations {
  
  /**
   * Handle new message received
   */
  static async handleNewMessage(
    messageContent: string,
    senderId: string,
    recipientId: string,
    conversationId?: string
  ) {
    try {
      const supabase = createServiceClient()
      
      // Get sender details
      const { data: sender } = await supabase
        .from('profiles')
        .select('full_name, display_name')
        .eq('id', senderId)
        .single()

      const senderName = sender?.display_name || sender?.full_name || 'Someone'

      // Create action URL
      const actionUrl = conversationId 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/messages/${conversationId}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/messages`

      await emailService.sendMessageEmail(recipientId, {
        content: messageContent.length > 100 
          ? messageContent.substring(0, 100) + '...' 
          : messageContent
      }, {
        name: senderName
      })

      console.log(`Message email queued for recipient: ${recipientId}`)
    } catch (error) {
      console.error('Handle new message email error:', error)
      // Don't throw to avoid breaking messaging
    }
  }
}
