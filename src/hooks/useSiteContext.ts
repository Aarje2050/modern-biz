// src/hooks/useSiteContext.ts - ENTERPRISE FIXED VERSION
'use client'

import { useEffect, useState, useRef } from 'react'
import { SiteConfig } from '@/lib/site-context'

// ENTERPRISE: Enhanced cache with failure tracking
interface CachedSiteConfig {
  data: any
  timestamp: number
  domain: string
}

class EnhancedSiteConfigCache {
  private cache: CachedSiteConfig | null = null
  private readonly TTL = 10 * 60 * 1000 // 10 minutes

  set(domain: string, data: any | null) {
    this.cache = {
      data,
      timestamp: Date.now(),
      domain
    }
  }

  get(domain: string): any | null {
    if (!this.cache || this.cache.domain !== domain) {
      return null
    }

    const isExpired = Date.now() - this.cache.timestamp > this.TTL
    
    if (isExpired) {
      this.cache = null
      return null
    }

    return this.cache.data
  }

  clear() {
    this.cache = null
  }

  has(domain: string): boolean {
    return this.get(domain) !== null
  }
}

// Global cache instance
const siteConfigCache = new EnhancedSiteConfigCache()

// ENTERPRISE: Development mode detection
const isDevelopment = process.env.NODE_ENV === 'development'
const LOCALHOST_DOMAINS = ['localhost:3000', 'localhost:3001', '127.0.0.1:3000']

// ENTERPRISE: Create default localhost config
const createLocalhostConfig = (domain: string): any => ({
  id: 'localhost-dev',
  name: 'Development Site',
  domain: domain,
  site_type: 'directory',
  template: 'modern',
  config: {},
  status: 'active',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export function useSiteContext() {
  const [siteConfig, setSiteConfig] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // ENTERPRISE: Request deduplication
  const fetchingRef = useRef(false)
  const currentDomain = useRef<string>('')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    const fetchSiteContext = async () => {
      const hostname = window.location.hostname + ':' + window.location.port
      
      // ENTERPRISE: Handle localhost in development
      if (isDevelopment && LOCALHOST_DOMAINS.includes(hostname)) {
        console.log('🏠 Site Context: Development mode - using localhost config')
        const localhostConfig = createLocalhostConfig(hostname)
        setSiteConfig(localhostConfig)
        setLoading(false)
        setError(null)
        return
      }

      // Prevent duplicate requests for same domain
      if (fetchingRef.current && currentDomain.current === hostname) {
        console.log('🔄 Site Context: Request already in progress, skipping...')
        return
      }

      // Check cache first (including failed lookups)
      const cached = siteConfigCache.get(hostname)
      if (cached) {
        console.log('⚡ Site Context: Using cached config for', hostname)
        setSiteConfig(cached)
        setLoading(false)
        setError(null)
        return
      }

      try {
        fetchingRef.current = true
        currentDomain.current = hostname
        
        console.log('🔍 Site Context: Fetching fresh config for', hostname)
        
        const response = await fetch('/api/site/current', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        // Don't process if component unmounted
        if (!mountedRef.current) return

        console.log('🔍 Site Context: API Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          
          // Validate site config
          if (data && data.id && data.name && data.domain) {
            console.log('✅ Site Context: Config loaded and cached:', {
              id: data.id,
              name: data.name,
              site_type: data.site_type,
              template: data.template
            })
            
            // Cache successful result
            siteConfigCache.set(hostname, data)
            
            setSiteConfig(data)
            setError(null)
          } else {
            console.warn('⚠️ Site Context: Invalid site config received:', data)
            setSiteConfig(null)
            setError('Invalid site configuration')
          }
        } else {
          console.log('❌ Site Context: API Error:', response.status)
          
          // Cache as failed lookup to prevent retries
          siteConfigCache.set(hostname, null)
          
          setSiteConfig(null)
          setError(`Site not found (${response.status})`)
        }
      } catch (error) {
        console.error('❌ Site Context: Network error:', error)
        
        // Don't process if component unmounted
        if (!mountedRef.current) return
        
        setSiteConfig(null)
        setError('Network error')
      } finally {
        if (mountedRef.current) {
          setLoading(false)
          fetchingRef.current = false
        }
      }
    }

    // ENTERPRISE: Debounced page visibility handler
    let visibilityTimeout: NodeJS.Timeout
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Debounce to prevent rapid fire on tab switching
        clearTimeout(visibilityTimeout)
        visibilityTimeout = setTimeout(() => {
          const hostname = window.location.hostname + ':' + window.location.port
          
          // Only refresh if cache is completely missing (not failed)
          const cached = siteConfigCache.get(hostname)
          if (!cached) {
            console.log('🔄 Site Context: Tab focus - cache miss, refreshing...')
            fetchSiteContext()
          } else {
            console.log('⚡ Site Context: Tab focus - using cached result')
          }
        }, 100)
      }
    }

    // Initial fetch
    fetchSiteContext()

    // Listen for page visibility changes (debounced)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(visibilityTimeout)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, []) // Empty dependency array - only run once

  return { siteConfig, loading, error }
}