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

// Add these functions to your existing lib/seo/helpers.ts file

// Location metadata generator
export function locationMetadata(location: {
  city: string
  state: string
  slug: string
  businessCount?: number
}, options?: {
  niche?: string
  siteName?: string
  customTitle?: string
  customDescription?: string
}) {
  const niche = options?.niche || 'business'
  const siteName = options?.siteName || 'Business Directory'
  const nicheTitle = niche.charAt(0).toUpperCase() + niche.slice(1)
  
  // Generate location display name
  const locationName = `${location.city}, ${location.state.toUpperCase()}`
  
  // SEO-optimized title patterns
  const title = options?.customTitle || 
    `${nicheTitle} Services in ${locationName} | ${siteName}`
  
  // Rich description with local SEO keywords
  const description = options?.customDescription ||
    `Find trusted ${niche} services in ${locationName}. Browse verified local businesses, read reviews, and get quotes. ${location.businessCount ? `${location.businessCount} services available.` : ''}`
  
  // Location-specific keywords
  const keywords = [
    `${niche} ${location.city}`,
    `${niche} services ${location.city}`,
    `${location.city} ${niche}`,
    `${niche} ${location.state}`,
    `local ${niche} ${location.city}`,
    `${location.city} ${location.state} ${niche}`,
    `${niche} near me`
  ].join(', ')

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `/locations/${location.slug}`,
      type: 'website' as const,
    },
    alternates: {
      canonical: `/locations/${location.slug}`
    },
    other: {
      'geo.region': location.state,
      'geo.placename': location.city,
      'ICBM': '', // Add coordinates if available
      'DC.title': title,
    }
  }
}

// Business in location metadata
export function businessInLocationMetadata(business: {
  name: string
  city: string
  state: string
  category?: string
  description?: string | null
}, options?: {
  niche?: string
  siteName?: string
}) {
  const niche = options?.niche || 'business'
  const siteName = options?.siteName || 'Business Directory'
  const locationName = `${business.city}, ${business.state.toUpperCase()}`
  
  const title = `${business.name} - ${business.category || 'Professional'} Services in ${locationName} | ${siteName}`
  
  const description = business.description ||
    `${business.name} provides professional ${business.category?.toLowerCase() || niche} services in ${locationName}. Read reviews, get contact info, and request quotes.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website' as const,
    }
  }
}

// Location listings page metadata
export function locationListingsMetadata(options: {
  niche?: string
  siteName?: string
  siteLocation?: string
  page?: number
  search?: string
  totalCount?: number
}) {
  const niche = options.niche || 'business'
  const siteName = options.siteName || 'Business Directory'
  const nicheTitle = niche.charAt(0).toUpperCase() + niche.slice(1)
  
  let title = `Browse ${nicheTitle} Services by Location`
  if (options.siteLocation) {
    title += ` in ${options.siteLocation.charAt(0).toUpperCase() + options.siteLocation.slice(1)}`
  }
  if (options.page && options.page > 1) {
    title += ` - Page ${options.page}`
  }
  if (options.search) {
    title = `"${options.search}" Locations - ${title}`
  }
  title += ` - ${siteName}`
  
  const description = `Find ${niche} services by location${options.siteLocation ? ` in ${options.siteLocation}` : ''}${options.search ? ` matching "${options.search}"` : ''}. Browse businesses by city and get local service providers.${options.page && options.page > 1 ? ` Page ${options.page}.` : ''}`

  return {
    title,
    description,
    keywords: `${niche} locations, local ${niche}, ${niche} by city, ${options.siteLocation || ''}, find ${niche}${options.search ? `, ${options.search}` : ''}`,
    openGraph: {
      title,
      description,
      url: `/locations${options.page && options.page > 1 ? `?page=${options.page}` : ''}`,
      type: 'website' as const,
    },
    alternates: {
      canonical: `/locations${options.page && options.page > 1 ? `?page=${options.page}` : ''}`
    }
  }
}