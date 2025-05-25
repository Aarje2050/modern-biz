// src/app/api/email/processor/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'start') {
      emailService.startEmailProcessor(30000) // Process every 30 seconds
      return NextResponse.json({
        success: true,
        message: 'Email processor started (30 second intervals)'
      })
    } else if (action === 'process') {
      await emailService.processEmailQueue()
      const stats = await emailService.getEmailStats()
      return NextResponse.json({
        success: true,
        message: 'Queue processed manually',
        stats
      })
    } else if (action === 'stop') {
      emailService.stopEmailProcessor()
      return NextResponse.json({
        success: true,
        message: 'Email processor stopped'
      })
    } else {
      return NextResponse.json({
        error: 'Invalid action. Use: start, process, or stop'
      }, { status: 400 })
    }
    
  } catch (error: any) {
    console.error('Email processor error:', error)
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const stats = await emailService.getEmailStats()
    
    return NextResponse.json({
      message: 'Email processor status',
      queue_stats: stats,
      usage: {
        start: 'POST {"action": "start"} - Start automatic processing',
        process: 'POST {"action": "process"} - Process queue once',
        stop: 'POST {"action": "stop"} - Stop automatic processing'
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}