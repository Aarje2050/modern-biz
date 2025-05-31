// src/app/api/site/current/route.ts - UPDATED FOR UNIFIED APPROACH
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const isDev = process.env.NODE_ENV === 'development'
const LOCALHOST_DOMAINS = ['localhost:3000', 'localhost:3001', '127.0.0.1:3000']

function log(message: string, data?: any) {
  if (isDev) {
    console.log(`🌐 [SITE-API] ${message}`, data || '')
  }
}

function createDevSiteConfig(domain: string) {
  return {
    id: 'localhost-dev',
    domain,
    name: 'Development Site',
    slug: 'dev-site',
    site_type: 'directory',
    template: 'modern',
    config: {
      niche: 'general',
      location: 'local',
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b'
      },
      seo: {
        defaultTitle: 'Development Site',
        defaultDescription: 'Local development directory',
        keywords: ['business', 'directory', 'local']
      },
      features: {
        reviews: true,
        analytics: true,
        messaging: true
      }
    },
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get domain from middleware headers or request
    const headersList = headers()
    const siteDomain = headersList.get('x-site-domain') || 
                      request.headers.get('host') ||
                      'localhost:3000'
    
    log('Getting site config for domain', siteDomain)

    // Always try database first for ALL domains
    const supabase = createClient()
    
    // Remove www prefix for lookup
    const searchDomain = siteDomain.replace(/^www\./, '')
    
    log('Looking up site in database', searchDomain)
    
    const { data: site, error } = await supabase
      .from('sites')
      .select('*')
      .eq('domain', searchDomain)
      .eq('status', 'active')
      .single()

    if (!error && site) {
      log('Site found in database', {
        id: site.id,
        name: site.name,
        site_type: site.site_type
      })

      return NextResponse.json(site, {
        headers: {
          'Cache-Control': 'public, max-age=60', // Short cache for testing
        }
      })
    }

    // No site found in database
    log('No site found for domain', searchDomain)
    return NextResponse.json(
      { error: 'Site not found' }, 
      { status: 404 }
    )

  } catch (error) {
    log('API error', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}