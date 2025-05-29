// src/app/api/site/current/route.ts (ENTERPRISE GRADE)
import { NextRequest, NextResponse } from 'next/server'
import { getSiteByDomain } from '@/lib/supabase/tenant-client'

export async function GET(request: NextRequest) {
  try {
    // Get domain from request headers (same logic as middleware)
    const hostname = request.headers.get('host') || ''
    const searchDomain = hostname.replace(/^www\./, '')
    
    console.log('🔍 API site/current checking domain:', searchDomain)
    
    if (!searchDomain) {
      return NextResponse.json(
        { error: 'No domain found' }, 
        { status: 400 }
      )
    }

    // Do the same site lookup as middleware
    const siteConfig = await getSiteByDomain(searchDomain)
    
    if (!siteConfig) {
      return NextResponse.json(
        { error: 'No site configuration found' }, 
        { status: 404 }
      )
    }

  

    return NextResponse.json(siteConfig)
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}