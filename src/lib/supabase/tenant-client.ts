// src/lib/supabase/tenant-client.ts (Complete Working Version)
import { createClient as createBrowserClient } from './client'
import { createClient as createServerClient } from './server'


interface SiteConfig {
  id: string
  domain: string
  name: string
  config: any
}

// Site-aware browser client (simplified to avoid TypeScript issues)
export function createTenantClient(siteId?: string) {
  const client = createBrowserClient()
  if (!client) return null
  
  // Don't modify the client, just return it
  // Filtering will be done manually in components
  return client
}

// Site-aware server client (simplified)
export function createTenantServerClient(siteId?: string) {
  const client = createServerClient()
  
  // Don't modify the client, just return it
  // Filtering will be done manually in queries
  return client
}

// Helper functions for site-specific queries
export function getTenantBusinesses(client: any, siteId: string) {
  return client
    .from('businesses')
    .select('*')
    .eq('site_id', siteId)
}

export function getTenantCategories(client: any, siteId: string) {
  return client
    .from('categories')
    .select('*')
    .eq('site_id', siteId)
}

export function getTenantProfiles(client: any, siteId: string) {
  return client
    .from('profiles')
    .select('*')
    .eq('site_id', siteId)
}

export function getTenantReviews(client: any, siteId: string) {
  return client
    .from('reviews')
    .select('*')
    .eq('site_id', siteId)
}

export function getTenantLocations(client: any, siteId: string) {
  return client
    .from('locations')
    .select('*')
    .eq('site_id', siteId)
}

export function getTenantBusinessContacts(client: any, siteId: string) {
  return client
    .from('business_contacts')
    .select('*')
    .eq('site_id', siteId)
}

// Explicit tenant client for server-side operations
export function createExplicitTenantClient(siteId: string) {
  const client = createServerClient()
  
  return {
    // Direct query methods that work
    getBusinesses: () => getTenantBusinesses(client, siteId),
    getCategories: () => getTenantCategories(client, siteId),
    getProfiles: () => getTenantProfiles(client, siteId),
    getReviews: () => getTenantReviews(client, siteId),
    getLocations: () => getTenantLocations(client, siteId),
    getBusinessContacts: () => getTenantBusinessContacts(client, siteId),
    
    // Generic method for manual queries
    query: (table: string) => {
      const tenantTables = ['businesses', 'categories', 'profiles', 'reviews', 'locations', 'business_contacts']
      
      if (tenantTables.includes(table)) {
        return client.from(table).select('*').eq('site_id', siteId)
      }
      
      return client.from(table).select('*')
    },
    
    // Access to raw client for custom queries
    client,
    siteId
  }
}

// Utility functions
export async function getSiteByDomain(domain: string): Promise<SiteConfig | null> {
  try {
    const client = createServerClient()
    
    console.log('🔍 getSiteByDomain: Looking up domain:', domain)
    
    const { data, error } = await client
      .from('sites')
      .select('id, domain, name, slug, site_type, template, config, status, created_at, updated_at')
      .eq('domain', domain)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ getSiteByDomain: No site found for domain:', domain)
      } else {
        console.error('❌ getSiteByDomain: Database error:', error)
      }
      return null
    }

    if (!data) {
      console.log('❌ getSiteByDomain: No data returned for domain:', domain)
      return null
    }

    console.log('✅ getSiteByDomain: Site found:', {
      id: data.id,
      name: data.name,
      domain: data.domain,
      site_type: data.site_type,
      template: data.template
    })
    
    return data as SiteConfig
  } catch (error) {
    console.error('❌ getSiteByDomain: Exception:', error)
    return null
  }
}

export async function getAllSites(): Promise<SiteConfig[]> {
  try {
    const client = createServerClient()
    
    const { data, error } = await client
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Sites fetch error:', error)
      return []
    }

    return data as SiteConfig[]
  } catch (error) {
    console.error('Sites fetch exception:', error)
    return []
  }
}

// Export all functions for backward compatibility
// All existing imports will continue to work