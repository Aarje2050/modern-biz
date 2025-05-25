// src/lib/email/auto-processor.ts
import { emailService } from './service'

class EmailProcessorManager {
  private static instance: EmailProcessorManager
  private processorStarted = false
  private healthCheckInterval: NodeJS.Timeout | null = null

  static getInstance(): EmailProcessorManager {
    if (!EmailProcessorManager.instance) {
      EmailProcessorManager.instance = new EmailProcessorManager()
    }
    return EmailProcessorManager.instance
  }

  async startProcessor(): Promise<void> {
    if (this.processorStarted) {
      console.log('Email processor already running')
      return
    }

    try {
      // Start the main processor
      emailService.startEmailProcessor(30000) // 30 seconds
      this.processorStarted = true
      console.log('✅ Email processor started successfully')

      // Start health monitoring
      this.startHealthMonitoring()

      // Process any existing queue immediately
      await emailService.processEmailQueue()
      console.log('✅ Initial queue processing completed')

    } catch (error) {
      console.error('❌ Failed to start email processor:', error)
      this.processorStarted = false
      throw error
    }
  }

  private startHealthMonitoring(): void {
    // Check processor health every 2 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck()
      } catch (error) {
        console.error('Email processor health check failed:', error)
      }
    }, 120000) // 2 minutes

    console.log('✅ Email processor health monitoring started')
  }

  private async healthCheck(): Promise<void> {
    try {
      const stats = await emailService.getEmailStats()
      
      // If we have pending emails but processor seems stuck, restart
      if (stats.pending > 0 && stats.processing === 0) {
        console.log(`⚠️  Found ${stats.pending} pending emails, processing queue...`)
        await emailService.processEmailQueue()
      }

      // Log stats every 10 minutes (5 health checks)
      if (Date.now() % 600000 < 120000) { // Rough 10-minute intervals
        console.log('📊 Email queue stats:', stats)
      }

    } catch (error) {
      console.error('Email processor health check error:', error)
      
      // Try to restart processor if health check fails
      this.processorStarted = false
      setTimeout(() => this.startProcessor(), 5000) // Restart after 5 seconds
    }
  }

  stopProcessor(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    
    emailService.stopEmailProcessor()
    this.processorStarted = false
    console.log('✅ Email processor stopped')
  }

  getStatus(): { running: boolean; hasHealthMonitoring: boolean } {
    return {
      running: this.processorStarted,
      hasHealthMonitoring: !!this.healthCheckInterval
    }
  }

  // Method to process queue manually if needed
  async processQueueNow(): Promise<void> {
    try {
      await emailService.processEmailQueue()
      console.log('✅ Manual queue processing completed')
    } catch (error) {
      console.error('❌ Manual queue processing failed:', error)
      throw error
    }
  }

  // Method to clear failed emails and retry
  async retryFailedEmails(): Promise<void> {
    try {
      // This would need to be implemented in the email service
      // For now, just process the queue
      await emailService.processEmailQueue()
      console.log('✅ Failed email retry completed')
    } catch (error) {
      console.error('❌ Failed email retry error:', error)
      throw error
    }
  }
}

// Export singleton instance
export const emailProcessorManager = EmailProcessorManager.getInstance()

// Auto-start in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.AUTO_START_EMAIL_PROCESSOR === 'true') {
  emailProcessorManager.startProcessor().catch(console.error)
}