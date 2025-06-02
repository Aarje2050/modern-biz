// src/lib/seo/helpers.ts - UPDATED WITH TEMPLATE SYSTEM
import { Metadata } from 'next'
import { getCurrentSite } from '@/lib/site-context'
import { createSEOService } from './service'
import { createTemplateProcessor } from './templates'

// ===============================
// SIMPLE ONE-LINER FUNCTIONS (TEMPLATE-POWERED)
// ===============================

export function categoryMetadata(
  category: { name: string; slug: string; description?: string; businessCount?: number },
  overrides: { title?: string; description?: string } = {}
) {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    return {
      title: overrides.title || `${category.name}`,
      description: overrides.description || category.description || `Find ${category.name.toLowerCase()} services`,
    }
  }

  const seoService = createSEOService(siteConfig)
  const templateProcessor = createTemplateProcessor(siteConfig)
  
  if (!seoService) {
    const templateResult = templateProcessor.generateCategory(category, overrides)
    return {
      title: templateResult.title,
      description: templateResult.description,
    }
  }

  // Use template system for title and description
  const templateResult = templateProcessor.generateCategory(category, overrides)
  const keywords = [
    siteConfig.config?.niche || 'business',
    siteConfig.config?.location || '',
    category.name,
    'services',
    'professionals'
  ].filter(Boolean)

  return seoService.generateMetadata({
    title: templateResult.title,
    description: templateResult.description,
    keywords,
    canonical: `/categories/${category.slug}`,
    ogType: 'website'
  })
}

export function businessMetadata(
  business: { name: string; description?: string; city?: string; state?: string; slug: string; category?: string },
  overrides: { title?: string; description?: string } = {}
) {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    return {
      title: overrides.title || business.name,
      description: overrides.description || business.description || `Contact ${business.name} for professional services`,
    }
  }

  const seoService = createSEOService(siteConfig)
  const templateProcessor = createTemplateProcessor(siteConfig)
  
  if (!seoService) {
    const templateResult = templateProcessor.generateBusiness(business, overrides)
    return {
      title: templateResult.title,
      description: templateResult.description,
    }
  }

  // Use template system for title and description
  const templateResult = templateProcessor.generateBusiness(business, overrides)
  const keywords = [
    business.name,
    business.category || siteConfig.config?.niche || 'business',
    business.city || siteConfig.config?.location || '',
    'services',
    'reviews'
  ].filter(Boolean)

  return seoService.generateMetadata({
    title: templateResult.title,
    description: templateResult.description,
    keywords,
    canonical: `/businesses/${business.slug}`,
    ogType: 'article'
  })
}

export function aboutMetadata(overrides: { title?: string; description?: string } = {}) {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    return {
      title: overrides.title || 'About Us',
      description: overrides.description || 'Learn more about our services',
    }
  }

  const seoService = createSEOService(siteConfig)
  const templateProcessor = createTemplateProcessor(siteConfig)
  
  if (!seoService) {
    const templateResult = templateProcessor.generateAbout(overrides)
    return {
      title: templateResult.title,
      description: templateResult.description,
    }
  }

  // Use template system for title and description
  const templateResult = templateProcessor.generateAbout(overrides)
  const keywords = [
    siteConfig.config?.niche || 'business',
    siteConfig.config?.location || '',
    'about',
    'company',
    'services'
  ].filter(Boolean)
  
  return seoService.generateMetadata({
    title: templateResult.title,
    description: templateResult.description,
    keywords,
    canonical: '/about',
    ogType: 'website'
  })
}

export function contactMetadata(overrides: { title?: string; description?: string } = {}) {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    return {
      title: overrides.title || 'Contact Us',
      description: overrides.description || 'Get in touch with us',
    }
  }

  const seoService = createSEOService(siteConfig)
  const templateProcessor = createTemplateProcessor(siteConfig)
  
  if (!seoService) {
    const templateResult = templateProcessor.generateContact(overrides)
    return {
      title: templateResult.title,
      description: templateResult.description,
    }
  }

  // Use template system for title and description
  const templateResult = templateProcessor.generateContact(overrides)
  const keywords = [
    siteConfig.config?.niche || 'business',
    siteConfig.config?.location || '',
    'contact',
    'quotes',
    'services'
  ].filter(Boolean)
  
  return seoService.generateMetadata({
    title: templateResult.title,
    description: templateResult.description,
    keywords,
    canonical: '/contact',
    ogType: 'website'
  })
}

export function listingMetadata(
  options: { category?: string; search?: string; page?: number; totalCount?: number } = {},
  overrides: { title?: string; description?: string } = {}
) {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    return {
      title: overrides.title || 'Business Listings',
      description: overrides.description || 'Browse business listings',
    }
  }

  const seoService = createSEOService(siteConfig)
  const templateProcessor = createTemplateProcessor(siteConfig)
  
  if (!seoService) {
    const templateResult = templateProcessor.generateListing(options, overrides)
    return {
      title: templateResult.title,
      description: templateResult.description,
    }
  }

  // Use template system for title and description
  const templateResult = templateProcessor.generateListing(options, overrides)
  const keywords = [
    siteConfig.config?.niche || 'business',
    siteConfig.config?.location || '',
    options.category,
    options.search,
    'services',
    'directory'
  ].filter((item): item is string => typeof item === 'string' && item.trim() !== '')

  let canonical = '/businesses'
  if (options.category) canonical += `?category=${options.category}`
  if (options.search) canonical += `${options.category ? '&' : '?'}search=${options.search}`

  return seoService.generateMetadata({
    title: templateResult.title,
    description: templateResult.description,
    keywords,
    canonical,
    ogType: 'website'
  })
}

export function homepageMetadata(overrides: { title?: string; description?: string } = {}) {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    return {
      title: overrides.title || 'Business Directory',
      description: overrides.description || 'Find local businesses and services',
    }
  }

  const seoService = createSEOService(siteConfig)
  const templateProcessor = createTemplateProcessor(siteConfig)
  
  if (!seoService) {
    const templateResult = templateProcessor.generateHomepage(overrides)
    return {
      title: templateResult.title,
      description: templateResult.description,
    }
  }

  // Use template system for title and description
  const templateResult = templateProcessor.generateHomepage(overrides)
  const keywords = [
    siteConfig.config?.niche || 'business',
    siteConfig.config?.location || '',
    'services',
    'directory',
    'professionals'
  ].filter(Boolean)
  
  return seoService.generateMetadata({
    title: templateResult.title,
    description: templateResult.description,
    keywords,
    canonical: '/',
    ogType: 'website'
  })
}

export function customMetadata(data: { 
  title: string; 
  description: string; 
  canonical?: string; 
  keywords?: string[]; 
  ogType?: 'website' | 'article' 
}) {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    return {
      title: data.title,
      description: data.description,
    }
  }

  const seoService = createSEOService(siteConfig)
  
  if (!seoService) {
    return {
      title: data.title,
      description: data.description,
    }
  }

  return seoService.generateMetadata({
    title: data.title,
    description: data.description,
    canonical: data.canonical,
    keywords: data.keywords,
    ogType: data.ogType || 'website'
  })
}