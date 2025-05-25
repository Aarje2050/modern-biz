import { NextResponse } from 'next/server'
import { emailService } from '@/lib/email/service'

export async function POST() {
  try {
    emailService.startEmailProcessor(30000) // Process every 30 seconds
    
    return NextResponse.json({
      success: true,
      message: 'Email processor started successfully',
      interval: '30 seconds'
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to start email processor',
      details: error.message
    }, { status: 500 })
  }
}