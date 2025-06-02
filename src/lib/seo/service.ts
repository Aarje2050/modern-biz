// src/lib/seo/service.ts - UPDATED WITH FOCUSED PATTERNS
import { Metadata } from 'next'
import { SiteConfig } from '@/lib/site-context'
import { createFocusedPatterns, FocusedSEOPatterns } from './focused-patterns'

// ===============================
// TYPES & INTERFACES  
// ===============================

export interface SEOPageData {
  title?: string
  description?: string
  keywords?: string[]
  canonical?: string
  noIndex?: boolean
  noFollow?: boolean
  ogImage?: string
  ogType?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export interface SchemaData {
  business?: {
    name: string
    description: string
    url: string
    telephone?: string
    address?: {
      street: string
      city: string
      state: string
      postal: string
      country: string
    }
    priceRange?: string
    rating?: {
      value: number
      count: number
    }
    hours?: string[]
    image?: string
  }
  breadcrumbs?: BreadcrumbItem[]
  article?: {
    headline: string
    description: string
    author: string
    publishedTime: string
    modifiedTime?: string
    image?: string
  }
  localBusiness?: {
    name: string
    description: string
    category: string
    location: {
      street?: string
      city: string
      state?: string
      postal?: string
      country?: string
      latitude?: number
      longitude?: number
    }
    contact: {
      phone?: string
      email?: string
      website?: string
    }
    hours?: Record<string, string>
    rating?: {
      value: number
      count: number
    }
    priceRange?: string
    image?: string
  }
}

// ===============================
// ENHANCED SEO SERVICE CLASS
// ===============================

export class SEOService {
  private siteConfig: SiteConfig
  private baseUrl: string
  private isDev: boolean
  private focusedPatterns: FocusedSEOPatterns

  constructor(siteConfig: SiteConfig) {
    this.siteConfig = siteConfig
    this.isDev = process.env.NODE_ENV === 'development'
    
    // CRITICAL: Build proper base URL from site domain
    this.baseUrl = this.buildBaseUrl(siteConfig.domain)
    
    // Initialize focused patterns (shorter, more targeted)
    this.focusedPatterns = createFocusedPatterns(siteConfig)
  }

  private buildBaseUrl(domain: string): string {
    // Handle localhost development domains
    if (domain.includes('localhost')) {
      return `http://${domain}`
    }
    
    // Handle production domains
    if (domain.includes('vercel.app') || domain.includes('netlify.app')) {
      return `https://${domain}`
    }
    
    // Handle custom domains (assume HTTPS)
    return `https://${domain}`
  }

  // ===============================
  // FOCUSED METADATA GENERATION (LENGTH-CONTROLLED)
  // ===============================

  generateHomepageMetadata(): Metadata {
    const title = this.focusedPatterns.generateHomepageTitle()
    const description = this.focusedPatterns.generateHomepageDescription()
    const keywords = this.focusedPatterns.generateFocusedKeywords('homepage')

    return this.generateMetadata({
      title,
      description,
      keywords,
      canonical: '/',
      ogType: 'website'
    })
  }

  generateBusinessListingMetadata(options: {
    page?: number
    category?: string
    search?: string
    totalCount?: number
  } = {}): Metadata {
    const title = this.focusedPatterns.generateBusinessListingTitle(options)
    const description = this.focusedPatterns.generateBusinessListingDescription(options)
    
    // Simple, focused keywords
    const additionalKeywords = [options.category, options.search].filter((item): item is string => Boolean(item))
    const keywords = this.focusedPatterns.generateFocusedKeywords('listing', additionalKeywords)

    let canonical = '/businesses'
    if (options.category) canonical += `?category=${options.category}`
    if (options.search) canonical += `${options.category ? '&' : '?'}search=${options.search}`

    return this.generateMetadata({
      title,
      description,
      keywords,
      canonical,
      ogType: 'website'
    })
  }

  generateBusinessPageMetadata(business: {
    name: string
    description?: string
    city?: string
    state?: string
    slug: string
    category?: string
  }): Metadata {
    const title = this.focusedPatterns.generateBusinessPageTitle(business)
    const description = this.focusedPatterns.generateBusinessPageDescription(business)
    
    // Simple, focused keywords
    const additionalKeywords = [
      business.name,
      business.category,
      business.city,
      business.state
    ].filter((item): item is string => Boolean(item))
    const keywords = this.focusedPatterns.generateFocusedKeywords('business', additionalKeywords)

    return this.generateMetadata({
      title,
      description,
      keywords,
      canonical: `/businesses/${business.slug}`,
      ogType: 'article'
    })
  }

  generateCategoryPageMetadata(category: {
    name: string
    slug: string
    businessCount?: number
  }): Metadata {
    const title = this.focusedPatterns.generateCategoryPageTitle(category)
    const description = this.focusedPatterns.generateCategoryPageDescription(category)
    
    // Simple, focused keywords
    const additionalKeywords = [category.name].filter((item): item is string => Boolean(item))
    const keywords = this.focusedPatterns.generateFocusedKeywords('category', additionalKeywords)

    return this.generateMetadata({
      title,
      description,
      keywords,
      canonical: `/categories/${category.slug}`,
      ogType: 'website'
    })
  }

  // ===============================
  // CORE METADATA GENERATION
  // ===============================

  generateMetadata(pageData: SEOPageData = {}): Metadata {
    const siteTitle = this.siteConfig.name
    const siteKeywords = this.siteConfig.config?.seo?.keywords || []

    // Build final title (don't double-append site name if already included)
    const title = pageData.title || siteTitle

    // Build final description
    const description = pageData.description || 
                       this.siteConfig.config?.seo?.defaultDescription || 
                       `Find the best services on ${this.siteConfig.name}`

    // Combine keywords
    const keywords = [
      ...(pageData.keywords || []),
      ...siteKeywords
    ].join(', ')

    // Build canonical URL
    const canonical = pageData.canonical 
      ? `${this.baseUrl}${pageData.canonical}`
      : undefined

    // Build Open Graph image
    const ogImage = pageData.ogImage || this.getDefaultOGImage()

    return {
      metadataBase: new URL(this.baseUrl),
      title,
      description,
      keywords,
      authors: [{ name: this.siteConfig.name }],
      creator: this.siteConfig.name,
      publisher: this.siteConfig.name,
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      alternates: {
        canonical: canonical,
      },
      openGraph: {
        type: pageData.ogType || 'website',
        siteName: this.siteConfig.name,
        title,
        description,
        url: canonical,
        images: ogImage ? [ogImage] : undefined,
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ogImage ? [ogImage] : undefined,
        creator: `@${this.siteConfig.slug}`,
      },
      robots: pageData.noIndex || pageData.noFollow ? {
        index: !pageData.noIndex,
        follow: !pageData.noFollow,
        nocache: pageData.noIndex,
        googleBot: {
          index: !pageData.noIndex,
          follow: !pageData.noFollow,
        },
      } : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
      },
      ...(pageData.publishedTime && {
        other: {
          'article:published_time': pageData.publishedTime,
          'article:modified_time': pageData.modifiedTime || pageData.publishedTime,
          'article:author': pageData.author || this.siteConfig.name,
          'article:section': pageData.section || 'General',
          'article:tag': pageData.tags?.join(', ') || '',
        }
      })
    }
  }

  private getDefaultOGImage(): string | undefined {
    // You can customize this based on your site's branding
    return `${this.baseUrl}/api/og?title=${encodeURIComponent(this.siteConfig.name)}`
  }

  // ===============================
  // SCHEMA MARKUP GENERATION
  // ===============================

  generateSchema(data: SchemaData): string {
    const schemas: any[] = []

    // Organization Schema (always include for site)
    schemas.push({
      '@type': 'Organization',
      '@id': `${this.baseUrl}#organization`,
      name: this.siteConfig.name,
      url: this.baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${this.baseUrl}/logo.png`,
      },
      sameAs: [], // Add social media URLs if available
    })

    // Website Schema
    schemas.push({
      '@type': 'WebSite',
      '@id': `${this.baseUrl}#website`,
      url: this.baseUrl,
      name: this.siteConfig.name,
      description: this.siteConfig.config?.seo?.defaultDescription,
      publisher: {
        '@id': `${this.baseUrl}#organization`
      },
      potentialAction: [
        {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${this.baseUrl}/search?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      ]
    })

    // Business Schema
    if (data.business) {
      schemas.push({
        '@type': 'LocalBusiness',
        '@id': `${this.baseUrl}/business#business`,
        name: data.business.name,
        description: data.business.description,
        url: data.business.url,
        telephone: data.business.telephone,
        address: data.business.address ? {
          '@type': 'PostalAddress',
          streetAddress: data.business.address.street,
          addressLocality: data.business.address.city,
          addressRegion: data.business.address.state,
          postalCode: data.business.address.postal,
          addressCountry: data.business.address.country,
        } : undefined,
        aggregateRating: data.business.rating ? {
          '@type': 'AggregateRating',
          ratingValue: data.business.rating.value,
          reviewCount: data.business.rating.count,
        } : undefined,
        priceRange: data.business.priceRange,
        openingHours: data.business.hours,
        image: data.business.image,
      })
    }

    // Local Business Schema
    if (data.localBusiness) {
      schemas.push({
        '@type': 'LocalBusiness',
        name: data.localBusiness.name,
        description: data.localBusiness.description,
        '@id': `${this.baseUrl}/business/${data.localBusiness.name.toLowerCase().replace(/\s+/g, '-')}#business`,
        url: data.localBusiness.contact.website || this.baseUrl,
        telephone: data.localBusiness.contact.phone,
        email: data.localBusiness.contact.email,
        address: {
          '@type': 'PostalAddress',
          streetAddress: data.localBusiness.location.street,
          addressLocality: data.localBusiness.location.city,
          addressRegion: data.localBusiness.location.state,
          postalCode: data.localBusiness.location.postal,
          addressCountry: data.localBusiness.location.country || 'US',
        },
        geo: data.localBusiness.location.latitude && data.localBusiness.location.longitude ? {
          '@type': 'GeoCoordinates',
          latitude: data.localBusiness.location.latitude,
          longitude: data.localBusiness.location.longitude,
        } : undefined,
        aggregateRating: data.localBusiness.rating ? {
          '@type': 'AggregateRating',
          ratingValue: data.localBusiness.rating.value,
          reviewCount: data.localBusiness.rating.count,
        } : undefined,
        priceRange: data.localBusiness.priceRange,
        image: data.localBusiness.image,
        openingHours: data.localBusiness.hours ? Object.entries(data.localBusiness.hours).map(([day, hours]) => `${day} ${hours}`) : undefined,
      })
    }

    // Breadcrumb Schema
    if (data.breadcrumbs && data.breadcrumbs.length > 0) {
      schemas.push({
        '@type': 'BreadcrumbList',
        itemListElement: data.breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: `${this.baseUrl}${crumb.url}`
        }))
      })
    }

    // Article Schema
    if (data.article) {
      schemas.push({
        '@type': 'Article',
        headline: data.article.headline,
        description: data.article.description,
        author: {
          '@type': 'Person',
          name: data.article.author,
        },
        publisher: {
          '@id': `${this.baseUrl}#organization`
        },
        datePublished: data.article.publishedTime,
        dateModified: data.article.modifiedTime || data.article.publishedTime,
        image: data.article.image,
        url: this.baseUrl,
      })
    }

    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': schemas
    }, null, this.isDev ? 2 : 0)
  }

  // ===============================
  // HELPER METHODS
  // ===============================

  buildCanonicalUrl(path: string): string {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${this.baseUrl}${cleanPath}`
  }

  buildImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    return `${this.baseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`
  }
}

// ===============================
// FACTORY FUNCTION
// ===============================

export function createSEOService(siteConfig: SiteConfig | null): SEOService | null {
  if (!siteConfig) {
    console.warn('SEO Service: No site config provided')
    return null
  }
  
  return new SEOService(siteConfig)
}

// ===============================
// CONVENIENCE FUNCTIONS
// ===============================

export function generateSiteMetadata(siteConfig: SiteConfig | null): Metadata {
  if (!siteConfig) {
    return {
      title: 'Business Directory',
      description: 'Find local businesses and services',
    }
  }
  
  const seoService = createSEOService(siteConfig)
  return seoService?.generateHomepageMetadata() || {
    title: siteConfig.name,
    description: siteConfig.config?.seo?.defaultDescription || 'Find local businesses and services',
  }
}

export function generateSiteSchema(siteConfig: SiteConfig | null, additionalData: SchemaData = {}): string {
  if (!siteConfig) return ''
  
  const seoService = createSEOService(siteConfig)
  return seoService?.generateSchema(additionalData) || ''
}