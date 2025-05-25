// src/hooks/useSiteContext.ts
'use client'

import { useEffect, useState } from 'react'
import { SiteConfig } from '@/lib/site-context'

export function useSiteContext() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get site config from a client-side API or from window/document
    // For now, we'll create an API endpoint to get current site
    const fetchSiteContext = async () => {
      try {
        const response = await fetch('/api/site/current')
        if (response.ok) {
          const data = await response.json()
          setSiteConfig(data)
        }
      } catch (error) {
        console.error('Error fetching site context:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSiteContext()
  }, [])

  return { siteConfig, loading }
}
