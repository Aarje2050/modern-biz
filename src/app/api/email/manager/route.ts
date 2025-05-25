// src/app/api/email/manager/route.ts
// ONLY CHANGED: Static imports to dynamic imports

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // ONLY CHANGE: Dynamic imports instead of static imports
    const { emailProcessorManager } = await import('@/lib/email/auto-processor')
    const { emailService } = await import('@/lib/email/service')
    
    const { action } = await request.json()

    switch (action) {
      case 'start':
        await emailProcessorManager.startProcessor()
        return NextResponse.json({
          success: true,
          message: 'Email processor started with health monitoring'
        })

      case 'stop':
        emailProcessorManager.stopProcessor()
        return NextResponse.json({
          success: true,
          message: 'Email processor stopped'
        })

      case 'status':
        const status = emailProcessorManager.getStatus()
        const stats = await emailService.getEmailStats()
        return NextResponse.json({
          processor_status: status,
          queue_stats: stats
        })

      case 'process':
        await emailProcessorManager.processQueueNow()
        const newStats = await emailService.getEmailStats()
        return NextResponse.json({
          success: true,
          message: 'Queue processed manually',
          stats: newStats
        })

      case 'retry-failed':
        await emailProcessorManager.retryFailedEmails()
        return NextResponse.json({
          success: true,
          message: 'Failed emails retry initiated'
        })

      default:
        return NextResponse.json({
          error: 'Invalid action. Use: start, stop, status, process, retry-failed'
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Email manager API error:', error)
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // ONLY CHANGE: Dynamic imports instead of static imports
    const { emailProcessorManager } = await import('@/lib/email/auto-processor')
    const { emailService } = await import('@/lib/email/service')
    
    const status = emailProcessorManager.getStatus()
    const stats = await emailService.getEmailStats()
    
    return NextResponse.json({
      message: 'Email processor manager',
      processor_status: status,
      queue_stats: stats,
      actions: {
        start: 'POST {"action": "start"}',
        stop: 'POST {"action": "stop"}',
        status: 'POST {"action": "status"}',
        process: 'POST {"action": "process"}',
        retry_failed: 'POST {"action": "retry-failed"}'
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}