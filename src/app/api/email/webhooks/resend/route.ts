// src/app/api/email/webhooks/resend/route.ts
export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { createServiceClient } = await import('@/lib/supabase/service')



    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    
    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = request.headers.get('resend-signature')
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }
      // Add signature verification logic here if needed
    }

    const body = await request.json()
    const { type, data } = body

    const supabase = createServiceClient()

    // Handle different webhook events
    switch (type) {
      case 'email.sent':
        await handleEmailSent(supabase, data)
        break
      case 'email.delivered':
        await handleEmailDelivered(supabase, data)
        break
      case 'email.delivery_delayed':
        await handleEmailDelayed(supabase, data)
        break
      case 'email.bounced':
        await handleEmailBounced(supabase, data)
        break
      case 'email.complained':
        await handleEmailComplained(supabase, data)
        break
      case 'email.opened':
        await handleEmailOpened(supabase, data)
        break
      case 'email.clicked':
        await handleEmailClicked(supabase, data)
        break
      default:
        console.log(`Unhandled webhook event: ${type}`)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Resend webhook error:', error)
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error.message 
    }, { status: 500 })
  }
}

// Webhook event handlers
async function handleEmailSent(supabase: any, data: any) {
  await logEmailEvent(supabase, data, 'sent')
}

async function handleEmailDelivered(supabase: any, data: any) {
  await logEmailEvent(supabase, data, 'delivered')
  await updateEmailStats(supabase, data, 'delivered')
}

async function handleEmailDelayed(supabase: any, data: any) {
  await logEmailEvent(supabase, data, 'delayed')
}

async function handleEmailBounced(supabase: any, data: any) {
  await logEmailEvent(supabase, data, 'bounced', {
    bounce_type: data.bounce?.type,
    bounce_reason: data.bounce?.message
  })
  await updateEmailStats(supabase, data, 'bounced')
}

async function handleEmailComplained(supabase: any, data: any) {
  await logEmailEvent(supabase, data, 'complained')
  await updateEmailStats(supabase, data, 'complained')
}

async function handleEmailOpened(supabase: any, data: any) {
  await logEmailEvent(supabase, data, 'opened', {
    user_agent: data.user_agent,
    ip_address: data.ip
  })
  await updateEmailStats(supabase, data, 'opened')
}

async function handleEmailClicked(supabase: any, data: any) {
  await logEmailEvent(supabase, data, 'clicked', {
    click_url: data.click?.url,
    user_agent: data.user_agent,
    ip_address: data.ip
  })
  await updateEmailStats(supabase, data, 'clicked')
}

async function logEmailEvent(
  supabase: any, 
  data: any, 
  eventType: string, 
  additionalData: any = {}
) {
  try {
    // Find the email queue entry by provider message ID
    const { data: queueEntry } = await supabase
      .from('email_queue')
      .select('id, notification_id')
      .eq('provider_message_id', data.email_id)
      .single()

    await supabase
      .from('email_logs')
      .insert({
        email_queue_id: queueEntry?.id,
        notification_id: queueEntry?.notification_id,
        event_type: eventType,
        provider: 'resend',
        provider_event_id: data.email_id,
        recipient_email: data.to,
        user_agent: additionalData.user_agent,
        ip_address: additionalData.ip_address,
        click_url: additionalData.click_url,
        bounce_reason: additionalData.bounce_reason,
        complaint_reason: additionalData.complaint_reason,
        metadata: additionalData
      })

  } catch (error) {
    console.error('Failed to log email event:', error)
  }
}

async function updateEmailStats(supabase: any, data: any, statType: string) {
  try {
    // Get template type from email queue
    const { data: queueEntry } = await supabase
      .from('email_queue')
      .select('template_type')
      .eq('provider_message_id', data.email_id)
      .single()

    if (!queueEntry) return

    const today = new Date().toISOString().split('T')[0]
    const updateField = `total_${statType}`

    // Upsert daily stats
    await supabase
      .from('email_stats')
      .upsert({
        date: today,
        template_type: queueEntry.template_type,
        [updateField]: 1
      }, {
        onConflict: 'date,template_type',
        ignoreDuplicates: false
      })

  } catch (error) {
    console.error('Failed to update email stats:', error)
  }
}