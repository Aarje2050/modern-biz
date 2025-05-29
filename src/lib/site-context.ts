// src/lib/site-context.ts (MASTER INTERFACE - FIXED)
import { headers } from 'next/headers'

// MASTER SiteConfig interface (matches database schema)
export interface SiteConfig {
  id: string
  domain: string
  name: string
  slug: string
  site_type: 'directory' | 'landing' | 'service' | 'static'  // ADDED
  template: string  // ADDED
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

// Server-side: Get site context from middleware headers
export function getCurrentSite(): SiteConfig | null {
  try {
    const headersList = headers()
    const siteConfigHeader = headersList.get('x-site-config')
    const siteId = headersList.get('x-site-id')
    
    if (!siteConfigHeader || !siteId) return null
    
    const siteConfig = JSON.parse(siteConfigHeader) as SiteConfig
    
    // Validate required fields
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

// Server-side: Get site-aware Supabase client
export function getCurrentSiteClient() {
  const site = getCurrentSite()
  // Note: Import moved to avoid circular dependency
  const { createTenantClient } = require('./supabase/tenant-client')
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