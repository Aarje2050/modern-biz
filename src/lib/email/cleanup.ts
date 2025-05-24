// src/lib/email/cleanup.ts
import { createServiceClient } from '@/lib/supabase/service'

// Utility to clear failed emails and retry
export async function clearFailedEmailsAndRetry(): Promise<void> {
  const supabase = createServiceClient()
  
  try {
    // Reset failed emails to pending for retry
    const { error } = await supabase
      .from('email_queue')
      .update({
        status: 'pending',
        attempts: 0,
        error_message: null,
        scheduled_for: new Date().toISOString()
      })
      .eq('status', 'failed')

    if (error) {
      console.error('Failed to reset failed emails:', error)
    } else {
      console.log('✅ Failed emails reset for retry')
    }
  } catch (error) {
    console.error('Error in clearFailedEmailsAndRetry:', error)
  }
}