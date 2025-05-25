// src/lib/email/providers/resend.ts
import { Resend } from 'resend'

export interface EmailProvider {
  send(params: SendEmailParams): Promise<SendEmailResult>
}

export interface SendEmailParams {
  to: string | string[]
  from: string
  subject: string
  html: string
  text?: string
  tags?: Record<string, string>
  metadata?: Record<string, any>
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
  details?: any
}

class ResendProvider implements EmailProvider {
  private resend: Resend
  private defaultFrom: string

  constructor(apiKey: string, defaultFrom: string) {
    this.resend = new Resend(apiKey)
    this.defaultFrom = defaultFrom
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      // Validate email addresses
      const toEmails = Array.isArray(params.to) ? params.to : [params.to]
      for (const email of toEmails) {
        if (!this.isValidEmail(email)) {
          return {
            success: false,
            error: `Invalid email address: ${email}`
          }
        }
      }

      const response = await this.resend.emails.send({
        from: params.from || this.defaultFrom,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        tags: params.tags ? Object.entries(params.tags).map(([name, value]) => ({ name, value })) : undefined
      })

      if (response.error) {
        return {
          success: false,
          error: response.error.message,
          details: response.error
        }
      }

      return {
        success: true,
        messageId: response.data?.id
      }

    } catch (error: any) {
      console.error('Resend send error:', error)
      return {
        success: false,
        error: error?.message || 'Unknown error occurred',
        details: error
      }
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

// Email service configuration
export interface EmailConfig {
  provider: 'resend'
  apiKey: string
  defaultFrom: string
  defaultFromName?: string
}

// Factory function to create email provider
export function createEmailProvider(config: EmailConfig): EmailProvider {
  const fromAddress = config.defaultFromName 
    ? `${config.defaultFromName} <${config.defaultFrom}>`
    : config.defaultFrom
  return new ResendProvider(config.apiKey, fromAddress)
}

// Environment-based configuration
export function getEmailConfig(): EmailConfig {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is required')
  }

  const defaultFrom = process.env.EMAIL_FROM || 'noreply@resend.dev'
  const defaultFromName = process.env.EMAIL_FROM_NAME || 'Business Directory'

  return {
    provider: 'resend' as const,
    apiKey,
    defaultFrom,
    defaultFromName
  }
}