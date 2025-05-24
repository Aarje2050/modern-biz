// src/app/api/email/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, recipient_id, recipient_email, template_type, template_data, priority } = body

    let emailId: string

    if (type === 'user' && recipient_id) {
      emailId = await emailService.sendUserEmail({
        recipientId: recipient_id,
        templateType: template_type,
        templateData: template_data,
        priority: priority || 'normal'
      })
    } else if (type === 'direct' && recipient_email) {
      emailId = await emailService.sendDirectEmail({
        recipientEmail: recipient_email,
        templateType: template_type,
        templateData: template_data,
        priority: priority || 'normal'
      })
    } else {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      email_id: emailId,
      message: 'Email queued successfully'
    })

  } catch (error: any) {
    console.error('Send email API error:', error)
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error.message 
    }, { status: 500 })
  }
}





