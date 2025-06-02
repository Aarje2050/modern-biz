// src/lib/seo/focused-patterns.ts - SIMPLE, FOCUSED, LENGTH-CONTROLLED
import { SiteConfig } from '@/lib/site-context'

// ===============================
// LENGTH LIMITS (Google Best Practices)
// ===============================
const SEO_LIMITS = {
  TITLE_MAX: 60,
  DESCRIPTION_MAX: 160
}

// ===============================
// SIMPLE, FOCUSED PATTERNS
// ===============================

export class FocusedSEOPatterns {
  private context: {
    niche: string
    location: string
    siteName: string
  }

  constructor(siteConfig: SiteConfig) {
    this.context = {
      niche: siteConfig.config?.niche || 'business',
      location: siteConfig.config?.location || '',
      siteName: siteConfig.name
    }
  }

  // ===============================
  // LENGTH CONTROL UTILITIES
  // ===============================
  
  private truncateTitle(title: string): string {
    if (title.length <= SEO_LIMITS.TITLE_MAX) return title
    return title.substring(0, SEO_LIMITS.TITLE_MAX - 3) + '...'
  }

  private truncateDescription(description: string): string {
    if (description.length <= SEO_LIMITS.DESCRIPTION_MAX) return description
    return description.substring(0, SEO_LIMITS.DESCRIPTION_MAX - 3) + '...'
  }

  // ===============================
  // FOCUSED TITLE PATTERNS
  // ===============================

  generateHomepageTitle(): string {
    const { niche, location, siteName } = this.context
    const nicheCapitalized = niche.charAt(0).toUpperCase() + niche.slice(1)
    
    // Short, focused patterns
    const patterns = [
      `${nicheCapitalized} Services${location ? ` in ${location}` : ''} | ${siteName}`,
      `${location} ${nicheCapitalized} Directory | ${siteName}`,
      `Find ${nicheCapitalized} Pros${location ? ` in ${location}` : ''} | ${siteName}`
    ]
    
    // Pick the shortest one that fits
    for (const pattern of patterns) {
      if (pattern.length <= SEO_LIMITS.TITLE_MAX) {
        return pattern
      }
    }
    
    // Fallback: ultra-short
    return this.truncateTitle(`${nicheCapitalized}${location ? ` ${location}` : ''} | ${siteName}`)
  }

  generateHomepageDescription(): string {
    const { niche, location } = this.context
    
    const patterns = [
      `Find trusted ${niche} professionals${location ? ` in ${location}` : ''}. Compare reviews, get quotes, and hire with confidence.`,
      `Connect with verified ${niche} experts${location ? ` in ${location}` : ''}. Read reviews and get free quotes.`,
      `Browse ${niche} services${location ? ` in ${location}` : ''}. Compare providers and get instant quotes.`
    ]
    
    // Pick the first one that fits
    for (const pattern of patterns) {
      if (pattern.length <= SEO_LIMITS.DESCRIPTION_MAX) {
        return pattern
      }
    }
    
    // Fallback: ultra-short
    return this.truncateDescription(`Find ${niche} services${location ? ` in ${location}` : ''}. Get quotes and compare reviews.`)
  }

  // ===============================
  // BUSINESS LISTING PATTERNS
  // ===============================

  generateBusinessListingTitle(options: {
    category?: string
    search?: string
    page?: number
  } = {}): string {
    const { niche, location } = this.context
    const nicheCapitalized = niche.charAt(0).toUpperCase() + niche.slice(1)

    let baseTitle = ''

    if (options.search) {
      baseTitle = `${options.search} Services${location ? ` in ${location}` : ''}`
    } else if (options.category) {
      baseTitle = `${options.category}${location ? ` in ${location}` : ''}`
    } else {
      baseTitle = `${nicheCapitalized} Services${location ? ` in ${location}` : ''}`
    }

    // Add page number if needed
    if (options.page && options.page > 1) {
      baseTitle += ` - Page ${options.page}`
    }

    return this.truncateTitle(baseTitle)
  }

  generateBusinessListingDescription(options: {
    category?: string
    search?: string
    totalCount?: number
  } = {}): string {
    const { niche, location } = this.context
    const countText = typeof options.totalCount === 'number' ? `${options.totalCount} ` : ''

    let description = ''

    if (options.search) {
      description = `Find ${options.search.toLowerCase()} services${location ? ` in ${location}` : ''}. ${countText}verified providers. Compare reviews and get quotes.`
    } else if (options.category) {
      description = `Browse ${options.category.toLowerCase()} professionals${location ? ` in ${location}` : ''}. ${countText}trusted providers with reviews and instant quotes.`
    } else {
      description = `Find ${niche} professionals${location ? ` in ${location}` : ''}. ${countText}verified providers. Compare reviews and get free quotes.`
    }

    return this.truncateDescription(description)
  }

  // ===============================
  // BUSINESS PAGE PATTERNS
  // ===============================

  generateBusinessPageTitle(business: {
    name: string
    city?: string
    state?: string
    category?: string
  }): string {
    const location = [business.city, business.state].filter(Boolean).join(', ')
    
    const patterns = [
      `${business.name}${location ? ` - ${location}` : ''}`,
      `${business.name}${business.category ? ` - ${business.category}` : ''}${location ? ` in ${location}` : ''}`,
      business.name
    ]

    // Pick the first one that fits
    for (const pattern of patterns) {
      if (pattern.length <= SEO_LIMITS.TITLE_MAX) {
        return pattern
      }
    }

    return this.truncateTitle(business.name)
  }

  generateBusinessPageDescription(business: {
    name: string
    description?: string
    city?: string
    state?: string
  }): string {
    if (business.description && business.description.length <= SEO_LIMITS.DESCRIPTION_MAX) {
      return business.description
    }

    const location = [business.city, business.state].filter(Boolean).join(', ')
    const { niche } = this.context
    
    const patterns = [
      `Contact ${business.name}${location ? ` in ${location}` : ''} for professional ${niche} services. Get quotes and read reviews.`,
      `${business.name} provides ${niche} services${location ? ` in ${location}` : ''}. Contact for quotes and information.`,
      `Professional ${niche} services by ${business.name}${location ? ` in ${location}` : ''}.`
    ]

    // Pick the first one that fits
    for (const pattern of patterns) {
      if (pattern.length <= SEO_LIMITS.DESCRIPTION_MAX) {
        return pattern
      }
    }

    return this.truncateDescription(`${business.name} - ${niche} services${location ? ` in ${location}` : ''}.`)
  }

  // ===============================
  // CATEGORY PAGE PATTERNS
  // ===============================

  generateCategoryPageTitle(category: {
    name: string
    businessCount?: number
  }): string {
    const { location } = this.context
    
    const patterns = [
      `${category.name}${location ? ` in ${location}` : ''}`,
      `${category.name} Services${location ? ` - ${location}` : ''}`,
      `Find ${category.name}${location ? ` in ${location}` : ''}`
    ]

    // Pick the first one that fits
    for (const pattern of patterns) {
      if (pattern.length <= SEO_LIMITS.TITLE_MAX) {
        return pattern
      }
    }

    return this.truncateTitle(category.name)
  }

  generateCategoryPageDescription(category: {
    name: string
    businessCount?: number
  }): string {
    const { location } = this.context
    const countText = typeof category.businessCount === 'number' ? `${category.businessCount} ` : ''

    const patterns = [
      `Find ${category.name.toLowerCase()} professionals${location ? ` in ${location}` : ''}. ${countText}verified providers with reviews and quotes.`,
      `Browse ${category.name.toLowerCase()} services${location ? ` in ${location}` : ''}. Compare ${countText}providers and get instant quotes.`,
      `${category.name} specialists${location ? ` in ${location}` : ''}. ${countText}trusted professionals with reviews.`
    ]

    // Pick the first one that fits
    for (const pattern of patterns) {
      if (pattern.length <= SEO_LIMITS.DESCRIPTION_MAX) {
        return pattern
      }
    }

    return this.truncateDescription(`Find ${category.name.toLowerCase()} services${location ? ` in ${location}` : ''}. Compare providers and get quotes.`)
  }

  // ===============================
  // STATIC PAGE PATTERNS
  // ===============================

  generateAboutTitle(): string {
    const { siteName } = this.context
    return this.truncateTitle(`About ${siteName}`)
  }

  generateAboutDescription(): string {
    const { niche, location, siteName } = this.context
    const pattern = `Learn about ${siteName}. We connect you with trusted ${niche} professionals${location ? ` in ${location}` : ''} for quality service.`
    return this.truncateDescription(pattern)
  }

  generateContactTitle(): string {
    const { siteName } = this.context
    return this.truncateTitle(`Contact ${siteName}`)
  }

  generateContactDescription(): string {
    const { niche, location, siteName } = this.context
    const pattern = `Contact ${siteName} for ${niche} services${location ? ` in ${location}` : ''}. Get help finding trusted professionals.`
    return this.truncateDescription(pattern)
  }

  // ===============================
  // FOCUSED KEYWORDS (SIMPLE)
  // ===============================

  generateFocusedKeywords(pageType: 'homepage' | 'listing' | 'business' | 'category', additional: string[] = []): string[] {
    const { niche, location } = this.context
    
    const base = [
      niche,
      location,
      `${niche} services`,
      `${niche} ${location}`,
      'professionals',
      'reviews'
    ].filter(Boolean)

    return [...base, ...additional].slice(0, 8) // Limit to 8 keywords max
  }
}

// ===============================
// FACTORY FUNCTION
// ===============================

export function createFocusedPatterns(siteConfig: SiteConfig): FocusedSEOPatterns {
  return new FocusedSEOPatterns(siteConfig)
}