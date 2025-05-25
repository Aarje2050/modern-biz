// src/lib/site-context.ts
import { headers } from 'next/headers'
import { createTenantClient } from './supabase/tenant-client'

export interface SiteConfig {
  id: string
  domain: string
  name: string
  slug: string
  config: {
    niche: string
    location: string
    theme: {
      primaryColor: string
      secondaryColor: string
    }
    seo: {
      defaultTitle: string
      defaultDescription: string
      keywords: string[]
    }
    features: {
      reviews: boolean
      messaging: boolean
      analytics: boolean
    }
  }
  status: string
  created_at: string
  updated_at: string
}

// Server-side: Get site context from middleware headers
export function getCurrentSite(): SiteConfig | null {
  try {
    const headersList = headers()
    const siteConfigHeader = headersList.get('x-site-config')
    const siteId = headersList.get('x-site-id')
    
    if (!siteConfigHeader || !siteId) return null
    
    return JSON.parse(siteConfigHeader)
  } catch (error) {
    console.error('Error getting site context:', error)
    return null
  }
}

// Server-side: Get site-aware Supabase client
export function getCurrentSiteClient() {
  const site = getCurrentSite()
  return createTenantClient(site?.id)
}

// Utility: Get site ID only
export function getCurrentSiteId(): string | null {
  try {
    const headersList = headers()
    return headersList.get('x-site-id')
  } catch (error) {
    return null
  }
}


