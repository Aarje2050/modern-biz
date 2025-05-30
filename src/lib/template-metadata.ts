// src/lib/template-metadata.ts (NEW FILE - CLIENT SAFE)
// This file contains template metadata and can be imported by both client and server components

export interface TemplateOption {
    id: string
    name: string
    description: string
    preview?: string
  }
  
  export interface PageTemplateConfig {
    [pageType: string]: TemplateOption[]
  }
  
  export interface SiteTemplateConfig {
    [siteType: string]: PageTemplateConfig
  }
  
  // Template metadata for admin interface (CLIENT-SAFE)
  export const TEMPLATE_METADATA: SiteTemplateConfig = {
    directory: {
      about: [
        {
          id: 'template-v1',
          name: 'Professional',
          description: 'Clean, corporate-style about page with company focus',
          preview: '/admin/previews/directory-about-professional.jpg'
        },
        {
          id: 'template-v2',
          name: 'Story-Focused',
          description: 'Narrative-driven about page with founder story',
          preview: '/admin/previews/directory-about-story.jpg'
        }
      ],
      contact: [
        {
          id: 'template-v1',
          name: 'Simple Form',
          description: 'Basic contact form with essential fields',
          preview: '/admin/previews/directory-contact-simple.jpg'
        },
        {
          id: 'template-v2',
          name: 'Local-Focused', 
          description: 'Location-centric contact page with map integration',
          preview: '/admin/previews/directory-contact-local.jpg'
        }
      ]
    },
    
    // Future site types (commented for now)
    /*
    landing: {
      about: [
        {
          id: 'minimal',
          name: 'Minimal',
          description: 'Clean and simple about section',
          preview: '/admin/previews/landing-about-minimal.jpg'
        },
        {
          id: 'product',
          name: 'Product-Focused',
          description: 'Highlights product features and benefits',
          preview: '/admin/previews/landing-about-product.jpg'
        }
      ],
      contact: [
        {
          id: 'form',
          name: 'Contact Form',
          description: 'Standard contact form layout',
          preview: '/admin/previews/landing-contact-form.jpg'
        }
      ]
    },
    
    service: {
      about: [
        {
          id: 'expertise',
          name: 'Expertise',
          description: 'Highlight skills and experience',
          preview: '/admin/previews/service-about-expertise.jpg'
        },
        {
          id: 'credentials',
          name: 'Credentials',
          description: 'Show qualifications and certifications',
          preview: '/admin/previews/service-about-credentials.jpg'
        }
      ],
      contact: [
        {
          id: 'booking',
          name: 'Booking',
          description: 'Appointment booking focused',
          preview: '/admin/previews/service-contact-booking.jpg'
        },
        {
          id: 'consultation',
          name: 'Consultation',
          description: 'Free consultation focused',
          preview: '/admin/previews/service-contact-consultation.jpg'
        }
      ]
    }
    */
  }
  
  // Helper functions (CLIENT-SAFE)
  export function getTemplateMetadata(siteType: string): PageTemplateConfig {
    return TEMPLATE_METADATA[siteType] || {}
  }
  
  export function getPageTemplateOptions(siteType: string, pageType: string): TemplateOption[] {
    return TEMPLATE_METADATA[siteType]?.[pageType] || []
  }
  
  export function getSupportedSiteTypes(): string[] {
    return Object.keys(TEMPLATE_METADATA)
  }
  
  export function getSupportedPageTypes(siteType: string): string[] {
    return Object.keys(TEMPLATE_METADATA[siteType] || {})
  }