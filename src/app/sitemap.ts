// src/app/sitemap.ts - Dynamic sitemap for SEO

import { MetadataRoute } from 'next'
import { getCurrentSite, getCurrentSiteClient } from '@/lib/site-context'

// Type definitions for sitemap data
interface SitemapBusiness {
  slug: string
  updated_at: string
}

interface SitemapCategory {
  slug: string
  updated_at: string
}

interface SitemapPost {
  slug: string
  updated_at: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getCurrentSite()
  
  if (!site) {
    return [
      {
        url: 'https://www.ductcleaningca.com',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      }
    ]
  }

  // Get the base URL (same logic as robots.ts)
  const getBaseUrl = () => {
    const domain = site.domain
    
    if (!domain.includes('localhost') && 
        !domain.includes('vercel.app') && 
        !domain.includes('netlify.app') && 
        !domain.startsWith('www.')) {
      return `https://www.${domain}`
    }
    
    if (domain.includes('localhost')) {
      return `http://${domain}`
    }
    
    return `https://${domain}`
  }

  const baseUrl = getBaseUrl()
  const supabase = getCurrentSiteClient()
  
  if (!supabase) {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      }
    ]
  }

  const sitemapEntries: MetadataRoute.Sitemap = []

  // Homepage
  sitemapEntries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  })

  // Static pages
  const staticPages = [
    { path: '/about', priority: 0.8 },
    { path: '/contact', priority: 0.8 },
    { path: '/businesses', priority: 0.9 },
    { path: '/categories', priority: 0.9 },
  ]

  staticPages.forEach(page => {
    sitemapEntries.push({
      url: `${baseUrl}${page.path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: page.priority,
    })
  })

  try {
    // Get active businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('slug, updated_at')
      .eq('status', 'approved')
      .eq('site_id', site.id)
      .limit(1000) // Limit for performance

    if (businesses) {
      businesses.forEach((business: SitemapBusiness) => {
        sitemapEntries.push({
          url: `${baseUrl}/businesses/${business.slug}`,
          lastModified: new Date(business.updated_at),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      })
    }

    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('slug, updated_at')
      .eq('site_id', site.id)

    if (categories) {
      categories.forEach((category: SitemapCategory) => {
        sitemapEntries.push({
          url: `${baseUrl}/categories/${category.slug}`,
          lastModified: new Date(category.updated_at),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      })
    }

    // Get blog posts if they exist
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .eq('site_id', site.id)
      .limit(500)

    if (posts) {
      posts.forEach((post: SitemapPost) => {
        sitemapEntries.push({
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: new Date(post.updated_at),
          changeFrequency: 'monthly',
          priority: 0.5,
        })
      })
    }

  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return sitemapEntries
}