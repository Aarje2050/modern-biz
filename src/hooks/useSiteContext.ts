// src/hooks/useSiteContext.ts - ENTERPRISE OPTIMIZED VERSION
'use client'

import { useEffect, useState, useRef } from 'react'
import { SiteConfig } from '@/lib/site-context'

// ENTERPRISE: Site config cache with TTL
interface CachedSiteConfig {
  data: SiteConfig
  timestamp: number
  domain: string
}

class SiteConfigCache {
  private cache: CachedSiteConfig | null = null
  private readonly TTL = 10 * 60 * 1000 // 10 minutes

  set(domain: string, data: SiteConfig) {
    this.cache = {
      data,
      timestamp: Date.now(),
      domain
    }
  }

  get(domain: string): SiteConfig | null {
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
const siteConfigCache = new SiteConfigCache()

export function useSiteContext() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // ENTERPRISE: Prevent duplicate requests
  const fetchingRef = useRef(false)
  const currentDomain = useRef<string>('')

  useEffect(() => {
    const fetchSiteContext = async () => {
      const hostname = window.location.hostname
      
      // Prevent duplicate requests for same domain
      if (fetchingRef.current && currentDomain.current === hostname) {
        console.log('🔄 Site Context: Request already in progress, skipping...')
        return
      }

      // Check cache first
      const cachedConfig = siteConfigCache.get(hostname)
      if (cachedConfig) {
        console.log('⚡ Site Context: Using cached config for', hostname)
        setSiteConfig(cachedConfig)
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
        
        console.log('🔍 Site Context: API Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          
          // Validate site config
          if (data.id && data.name && data.domain) {
            console.log('✅ Site Context: Config loaded and cached:', {
              id: data.id,
              name: data.name,
              site_type: data.site_type,
              template: data.template
            })
            
            // Cache the config
            siteConfigCache.set(hostname, data)
            
            setSiteConfig(data)
            setError(null)
          } else {
            console.warn('⚠️ Site Context: Invalid site config received:', data)
            setSiteConfig(null)
            setError('Invalid site configuration')
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.log('❌ Site Context: API Error:', response.status, errorData)
          setSiteConfig(null)
          setError(`API Error: ${response.status} - ${errorData.error}`)
        }
      } catch (error) {
        console.error('❌ Site Context: Network error:', error)
        setSiteConfig(null)
        setError('Network error')
      } finally {
        setLoading(false)
        fetchingRef.current = false
      }
    }

    // ENTERPRISE: Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const hostname = window.location.hostname
        
        // Only refresh if cache is old or missing
        if (!siteConfigCache.has(hostname)) {
          console.log('🔄 Site Context: Tab focus - cache miss, refreshing...')
          fetchSiteContext()
        } else {
          console.log('⚡ Site Context: Tab focus - using cached config')
        }
      }
    }

    // Initial fetch
    fetchSiteContext()

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, []) // Empty dependency array - only run once

  return { siteConfig, loading, error }
}