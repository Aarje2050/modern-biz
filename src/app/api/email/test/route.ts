// src/app/api/email/test/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { MessagingEmailIntegrations } from '@/lib/email/integrations/messaging'
import { emailService } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const { email, type = 'welcome' } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 })
    }

    let emailId: string

    if (type === 'welcome') {
      emailId = await emailService.sendDirectEmail({
        recipientEmail: email,
        recipientName: 'Test User',
        templateType: 'welcome',
        templateData: {
          user: {
            name: 'Test User',
            email: email
          }
        },
        priority: 'high'
      })
    } else if (type === 'message') {
      emailId = await emailService.sendDirectEmail({
        recipientEmail: email,
        recipientName: 'Test User',
        templateType: 'message_received',
        templateData: {
          sender: { name: 'Test Sender' },
          recipient: { name: 'Test User' },
          message: { content: 'This is a test message to verify email notifications!' },
          action_url: `${process.env.NEXT_PUBLIC_APP_URL}/messages`
        },
        priority: 'high'
      })
    } else {
      return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }

    // Process queue immediately
    await emailService.processEmailQueue()

    // Wait and get status
    await new Promise(resolve => setTimeout(resolve, 1000))
    const stats = await emailService.getEmailStats()

    return NextResponse.json({
      success: true,
      message: `Test ${type} email sent to ${email}`,
      email_id: emailId,
      queue_stats: stats
    })

  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json({
      error: error.message,
      details: error.stack
    }, { status: 500 })
  }
}