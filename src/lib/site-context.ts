// src/lib/site-context.ts (CLIENT-SAFE VERSION)

// MASTER SiteConfig interface (matches database schema)
export interface SiteConfig {
  id: string
  domain: string
  name: string
  slug: string
  site_type: 'directory' | 'landing' | 'service' | 'static'
  template: string
  config: {
    niche?: string
    location?: string
    theme?: {
      primaryColor: string
      secondaryColor: string
    }
    seo?: {
      defaultTitle: string
      defaultDescription: string
      keywords: string[]
    }
    features?: Record<string, boolean>
  }
  status: string
  created_at: string
  updated_at: string
}

// CLIENT-SAFE: Get site context from middleware headers
export function getCurrentSite(): SiteConfig | null {
  // Only works on server - return null on client
  if (typeof window !== 'undefined') return null
  
  try {
    const { headers } = require('next/headers')
    const headersList = headers()
    const siteConfigHeader = headersList.get('x-site-config')
    const siteId = headersList.get('x-site-id')
    
    if (!siteConfigHeader || !siteId) return null
    
    const siteConfig = JSON.parse(siteConfigHeader) as SiteConfig
    
    if (!siteConfig.id || !siteConfig.domain || !siteConfig.name) {
      console.warn('Invalid site config:', siteConfig)
      return null
    }
    
    return siteConfig
  } catch (error) {
    console.error('Error getting site context:', error)
    return null
  }
}

// CLIENT-SAFE: Get site ID only
export function getCurrentSiteId(): string | null {
  // Only works on server - return null on client
  if (typeof window !== 'undefined') return null
  
  try {
    const { headers } = require('next/headers')
    const headersList = headers()
    return headersList.get('x-site-id')
  } catch (error) {
    return null
  }
}

// CLIENT-SAFE: Get site-aware Supabase client
export function getCurrentSiteClient() {
  const site = getCurrentSite()
  // Note: Import moved to avoid circular dependency
  const { createTenantClient } = require('./supabase/tenant-client')
  return createTenantClient(site?.id)
}