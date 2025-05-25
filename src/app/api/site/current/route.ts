// src/app/api/site/current/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSite } from '@/lib/site-context'

export async function GET(request: NextRequest) {
  try {
    const siteConfig = getCurrentSite()
    
    if (!siteConfig) {
      return NextResponse.json(
        { error: 'No site configuration found' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(siteConfig)
  } catch (error) {
    console.error('Error getting current site:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

