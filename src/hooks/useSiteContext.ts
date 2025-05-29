// src/hooks/useSiteContext.ts (ENTERPRISE GRADE)
'use client'

import { useEffect, useState } from 'react'
import { SiteConfig } from '@/lib/site-context'

export function useSiteContext() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSiteContext = async () => {
      try {
        console.log('🔍 useSiteContext: Fetching from', window.location.hostname)
        
        const response = await fetch('/api/site/current', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        console.log('🔍 useSiteContext: API Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ useSiteContext: Site received:', {
            id: data.id,
            name: data.name,
            site_type: data.site_type,
            template: data.template
          })
          
          // Validate site config
          if (data.id && data.name && data.domain) {
            setSiteConfig(data)
            setError(null)
          } else {
            console.warn('⚠️ Invalid site config received:', data)
            setSiteConfig(null)
            setError('Invalid site configuration')
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.log('❌ useSiteContext: API Error:', response.status, errorData)
          setSiteConfig(null)
          setError(`API Error: ${response.status} - ${errorData.error}`)
        }
      } catch (error) {
        console.error('❌ useSiteContext: Network error:', error)
        setSiteConfig(null)
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    fetchSiteContext()
  }, [])

  return { siteConfig, loading, error }
}