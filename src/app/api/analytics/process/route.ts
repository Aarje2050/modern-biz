// src/app/api/analytics/process/route.ts
import { NextResponse } from 'next/server'
import { processBusinessAnalytics } from '@/lib/analytics/processor'

export async function POST(request: Request) {
  try {
    // Verify this is called from a cron job or authorized source
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { businessId, days } = await request.json()
    
    await processBusinessAnalytics(businessId, days || 1)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Analytics processed successfully' 
    })
  } catch (error) {
    console.error('Analytics processing error:', error)
    return NextResponse.json({ 
      error: 'Failed to process analytics' 
    }, { status: 500 })
  }
}

// Manual trigger for testing (remove in production)
export async function GET() {
  try {
    await processBusinessAnalytics(undefined, 1)
    return NextResponse.json({ 
      success: true, 
      message: 'Analytics processed manually' 
    })
  } catch (error) {
    console.error('Manual analytics processing error:', error)
    return NextResponse.json({ 
      error: 'Failed to process analytics manually' 
    }, { status: 500 })
  }
}