// src/lib/email/integrations/auth.ts
import { emailService } from '../service'

export class AuthEmailIntegrations {
  
  /**
   * Send welcome email to new user
   */
  static async sendWelcomeEmail(userId: string) {
    try {
      await emailService.sendWelcomeEmail(userId)
      console.log(`Welcome email queued for user: ${userId}`)
    } catch (error) {
      console.error('Send welcome email error:', error)
      // Don't throw to avoid breaking auth flow
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, resetToken: string) {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`
      
      await emailService.sendDirectEmail({
        recipientEmail: email,
        templateType: 'password_reset',
        templateData: {
          reset_url: resetUrl,
          reset_token: resetToken
        },
        priority: 'high'
      })

      console.log(`Password reset email queued for: ${email}`)
    } catch (error) {
      console.error('Send password reset email error:', error)
      throw error
    }
  }
}




