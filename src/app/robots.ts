// src/app/robots.ts - Dynamic robots.txt for multi-tenant setup

import { MetadataRoute } from 'next'
import { getCurrentSite } from '@/lib/site-context'

export default function robots(): MetadataRoute.Robots {
  const site = getCurrentSite()
  
  // Get the base URL - handle both www and non-www
  const getBaseUrl = () => {
    if (!site) return 'https://www.ductcleaningca.com'
    
    const domain = site.domain
    
    // Add www if not present and not localhost/staging
    if (!domain.includes('localhost') && 
        !domain.includes('vercel.app') && 
        !domain.includes('netlify.app') && 
        !domain.startsWith('www.')) {
      return `https://www.${domain}`
    }
    
    // Handle localhost
    if (domain.includes('localhost')) {
      return `http://${domain}`
    }
    
    // Default to https
    return `https://${domain}`
  }

  const baseUrl = getBaseUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block admin and API routes from crawling
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/_next/',
          '/debug/',
          '/startup/',
          '/login',
          '/register',
          '/verify',
          '/profile',
          '/saved',
          '/messages',
          '/*.json$',
          '/*?*utm_*',
          '/*?*fbclid*',
          '/*?*gclid*',
        ]
      },
      
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}