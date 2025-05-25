// src/app/api/email/queue/process/route.ts
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', session.user.id)
      .single()

    if (profile?.account_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await emailService.processEmailQueue()
    
    return NextResponse.json({ 
      success: true,
      message: 'Email queue processed'
    })

  } catch (error: any) {
    console.error('Process queue API error:', error)
    return NextResponse.json({ 
      error: 'Failed to process email queue',
      details: error.message 
    }, { status: 500 })
  }
}