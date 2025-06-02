// src/lib/seo/templates.ts - SIMPLE TEMPLATE SYSTEM
import { SiteConfig } from '@/lib/site-context'

// ===============================
// SEO TEMPLATES (SET ONCE, USE EVERYWHERE)
// ===============================

const SEO_TEMPLATES = {
  // Homepage Templates
  homepage: {
    title: "Professional {niche} Services in {location} | {siteName}",
    description: "Find trusted {niche} professionals in {location}. Compare reviews, get quotes, and hire with confidence. Verified providers available."
  },

  // Category Page Templates  
  category: {
    title: "{category} Services in {location} | {siteName}",
    description: "Find {category} professionals in {location}. Browse verified providers with reviews and get instant quotes from trusted specialists."
  },

  // Business Detail Templates
  business: {
    title: "{businessName} - {category} Services in {city}",
    description: "Contact {businessName} in {city} for professional {niche} services. Get quotes and read reviews from verified customers."
  },

  // About Page Templates
  about: {
    title: "About {siteName} - {niche} Services in {location}",
    description: "Learn about {siteName}. We connect you with trusted {niche} professionals in {location} for quality service and competitive pricing."
  },

  // Contact Page Templates
  contact: {
    title: "Contact {siteName} - Get {niche} Quotes in {location}",
    description: "Contact {siteName} for {niche} services in {location}. Get help finding trusted professionals and receive free quotes today."
  },

  // Business Listing Templates
  listing: {
    title: "{niche} Services in {location} | {siteName}",
    description: "Browse {niche} professionals in {location}. Compare verified providers, read reviews, and get free quotes from trusted specialists."
  }
}

// ===============================
// TEMPLATE PROCESSOR
// ===============================

export class TemplateProcessor {
  private siteConfig: SiteConfig
  private context: Record<string, string>

  constructor(siteConfig: SiteConfig) {
    this.siteConfig = siteConfig
    this.context = this.buildContext()
  }

  private buildContext(): Record<string, string> {
    const niche = this.siteConfig.config?.niche || 'business'
    const location = this.siteConfig.config?.location || ''
    
    return {
      siteName: this.siteConfig.name,
      niche: niche,
      location: location,
      nicheCapitalized: niche.charAt(0).toUpperCase() + niche.slice(1),
      locationCapitalized: location.charAt(0).toUpperCase() + location.slice(1)
    }
  }

  private processTemplate(template: string, additionalContext: Record<string, string> = {}): string {
    const allContext = { ...this.context, ...additionalContext }
    
    let result = template
    
    // Replace all placeholders
    Object.entries(allContext).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      result = result.replace(new RegExp(placeholder, 'g'), value || '')
    })

    // Clean up extra spaces and formatting
    result = result.replace(/\s+/g, ' ').trim()
    result = result.replace(/\s*-\s*$/, '') // Remove trailing dashes
    result = result.replace(/\s*\|\s*$/, '') // Remove trailing pipes
    
    return result
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }

  // ===============================
  // PAGE TYPE GENERATORS
  // ===============================

  generateHomepage(overrides: { title?: string; description?: string } = {}) {
    return {
      title: overrides.title || this.truncate(this.processTemplate(SEO_TEMPLATES.homepage.title), 60),
      description: overrides.description || this.truncate(this.processTemplate(SEO_TEMPLATES.homepage.description), 160)
    }
  }

  generateCategory(
    category: { name: string; slug: string; description?: string }, 
    overrides: { title?: string; description?: string } = {}
  ) {
    const context = {
      category: category.name,
      categoryLower: category.name.toLowerCase()
    }

    return {
      title: overrides.title || this.truncate(this.processTemplate(SEO_TEMPLATES.category.title, context), 60),
      description: overrides.description || this.truncate(this.processTemplate(SEO_TEMPLATES.category.description, context), 160)
    }
  }

  generateBusiness(
    business: { name: string; description?: string; city?: string; state?: string; category?: string },
    overrides: { title?: string; description?: string } = {}
  ) {
    const location = [business.city, business.state].filter(Boolean).join(', ')
    const context = {
      businessName: business.name,
      city: business.city || this.context.location,
      category: business.category || this.context.niche,
      businessLocation: location || this.context.location
    }

    return {
      title: overrides.title || this.truncate(this.processTemplate(SEO_TEMPLATES.business.title, context), 60),
      description: overrides.description || business.description || this.truncate(this.processTemplate(SEO_TEMPLATES.business.description, context), 160)
    }
  }

  generateAbout(overrides: { title?: string; description?: string } = {}) {
    return {
      title: overrides.title || this.truncate(this.processTemplate(SEO_TEMPLATES.about.title), 60),
      description: overrides.description || this.truncate(this.processTemplate(SEO_TEMPLATES.about.description), 160)
    }
  }

  generateContact(overrides: { title?: string; description?: string } = {}) {
    return {
      title: overrides.title || this.truncate(this.processTemplate(SEO_TEMPLATES.contact.title), 60),
      description: overrides.description || this.truncate(this.processTemplate(SEO_TEMPLATES.contact.description), 160)
    }
  }

  generateListing(
    options: { category?: string; search?: string; page?: number } = {},
    overrides: { title?: string; description?: string } = {}
  ) {
    let context = {}

    if (options.category) {
      context = { category: options.category, categoryLower: options.category.toLowerCase() }
    }

    if (options.search) {
      context = { ...context, searchTerm: options.search }
    }

    let title = overrides.title || this.processTemplate(SEO_TEMPLATES.listing.title, context)
    
    // Add page number if needed
    if (options.page && options.page > 1) {
      title += ` - Page ${options.page}`
    }

    return {
      title: this.truncate(title, 60),
      description: overrides.description || this.truncate(this.processTemplate(SEO_TEMPLATES.listing.description, context), 160)
    }
  }

  // ===============================
  // CUSTOM TEMPLATE SUPPORT
  // ===============================

  generateCustom(
    customTemplates: { title: string; description: string },
    context: Record<string, string> = {},
    overrides: { title?: string; description?: string } = {}
  ) {
    return {
      title: overrides.title || this.truncate(this.processTemplate(customTemplates.title, context), 60),
      description: overrides.description || this.truncate(this.processTemplate(customTemplates.description, context), 160)
    }
  }
}

// ===============================
// FACTORY FUNCTION
// ===============================

export function createTemplateProcessor(siteConfig: SiteConfig): TemplateProcessor {
  return new TemplateProcessor(siteConfig)
}

// ===============================
// QUICK ACCESS FUNCTIONS
// ===============================

export function getTemplates() {
  return SEO_TEMPLATES
}

export function updateTemplate(pageType: keyof typeof SEO_TEMPLATES, field: 'title' | 'description', newTemplate: string) {
  SEO_TEMPLATES[pageType][field] = newTemplate
}