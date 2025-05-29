// Enterprise Template Middleware - FIXED TYPES
import { SiteConfig } from '@/lib/site-context' // Import from master file

export interface TemplateConfig {
  name: string
  siteType: SiteConfig['site_type']
  routes: string[]
  components: {
    layout: string
    pages: Record<string, string>
  }
  features: string[]
}

// Template Registry - Single source of truth
export const TEMPLATE_REGISTRY: Record<string, TemplateConfig> = {
  'directory-modern': {
    name: 'directory-modern',
    siteType: 'directory',
    routes: ['/', '/businesses', '/categories', '/search', '/businesses/[slug]', '/categories/[slug]'],
    components: {
      layout: 'DirectoryLayout',
      pages: {
        home: 'DirectoryHome',
        businesses: 'BusinessesPage',
        categories: 'CategoriesPage', 
        search: 'SearchPage',
        business_detail: 'BusinessDetail',
        category_detail: 'CategoryDetail'
      }
    },
    features: ['reviews', 'messaging', 'analytics', 'search']
  },
  'landing-conversion': {
    name: 'landing-conversion',
    siteType: 'landing', 
    routes: ['/', '/about', '/contact'],
    components: {
      layout: 'LandingLayout',
      pages: {
        home: 'LandingHome',
        about: 'AboutPage',
        contact: 'ContactPage'
      }
    },
    features: ['analytics', 'contact_form']
  },
  'service-local': {
    name: 'service-local',
    siteType: 'service',
    routes: ['/', '/services', '/about', '/contact', '/book'],
    components: {
      layout: 'ServiceLayout', 
      pages: {
        home: 'ServiceHome',
        services: 'ServicesPage',
        about: 'AboutPage',
        contact: 'ContactPage',
        booking: 'BookingPage'
      }
    },
    features: ['booking', 'reviews', 'contact_form', 'analytics']
  }
}

// CLIENT-SAFE site context retrieval (no headers() import)
export function getCurrentSiteFromClient(siteConfig: SiteConfig | null): SiteConfig | null {
  if (!siteConfig) return null
  
  // Validate required fields
  if (!siteConfig.id || !siteConfig.domain || !siteConfig.name) {
    console.warn('Invalid site config:', siteConfig)
    return null
  }
  
  return siteConfig
}

// SERVER-SAFE site context retrieval (for server components only)
export function getCurrentSiteFromServer(): SiteConfig | null {
  // Only import headers() in server context
  if (typeof window !== 'undefined') {
    console.warn('getCurrentSiteFromServer called on client')
    return null
  }
  
  try {
    const { headers } = require('next/headers')
    const headersList = headers()
    const siteConfigHeader = headersList.get('x-site-config')
    
    if (!siteConfigHeader) return null
    
    const siteConfig = JSON.parse(siteConfigHeader) as SiteConfig
    
    // Validate required fields
    if (!siteConfig.id || !siteConfig.domain || !siteConfig.name) {
      console.warn('Invalid site config:', siteConfig)
      return null
    }
    
    return siteConfig
  } catch (error) {
    console.error('Error parsing site context:', error)
    return null
  }
}

// Template resolution with fallbacks (CLIENT-SAFE)
export function resolveTemplate(pathname: string, siteConfig?: SiteConfig | null): {
  template: TemplateConfig | null
  component: string | null
  isSupported: boolean
} {
  // No site = directory fallback
  if (!siteConfig) {
    return {
      template: TEMPLATE_REGISTRY['directory-modern'],
      component: 'DirectoryHome',
      isSupported: true
    }
  }
  
  const templateName = siteConfig.template || 'directory-modern'
  const template = TEMPLATE_REGISTRY[templateName]
  
  if (!template) {
    console.warn(`Template not found: ${templateName}`)
    return {
      template: null,
      component: null,
      isSupported: false
    }
  }
  
  // Check route support
  const isSupported = template.routes.some(route => 
    matchRoute(route, pathname)
  )
  
  if (!isSupported) {
    return {
      template,
      component: null,
      isSupported: false
    }
  }
  
  // Resolve component
  const component = resolvePageComponent(template, pathname)
  
  return {
    template,
    component,
    isSupported: true
  }
}

// Dynamic route matching
function matchRoute(template: string, pathname: string): boolean {
  if (template === pathname) return true
  
  // Handle dynamic routes [slug]
  if (template.includes('[') && template.includes(']')) {
    const templateParts = template.split('/')
    const pathParts = pathname.split('/')
    
    if (templateParts.length !== pathParts.length) return false
    
    return templateParts.every((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) return true
      return part === pathParts[i]
    })
  }
  
  return false
}

// Component resolution
function resolvePageComponent(template: TemplateConfig, pathname: string): string | null {
  // Route to component mapping
  const routeMap: Record<string, string> = {
    '/': 'home',
    '/businesses': 'businesses',
    '/categories': 'categories', 
    '/search': 'search',
    '/services': 'services',
    '/about': 'about',
    '/contact': 'contact',
    '/book': 'booking'
  }
  
  // Dynamic routes
  if (pathname.startsWith('/businesses/') && pathname !== '/businesses') {
    return template.components.pages.business_detail || null
  }
  
  if (pathname.startsWith('/categories/') && pathname !== '/categories') {
    return template.components.pages.category_detail || null
  }
  
  // Static routes
  const pageKey = routeMap[pathname]
  if (pageKey && template.components.pages[pageKey]) {
    return template.components.pages[pageKey]
  }
  
  return null
}

// Feature checking (CLIENT-SAFE)
export function hasFeature(feature: string, siteConfig?: SiteConfig | null): boolean {
  if (!siteConfig) return false
  
  const template = TEMPLATE_REGISTRY[siteConfig.template || 'directory-modern']
  return template?.features.includes(feature) || false
}

// Theme utilities (CLIENT-SAFE)
export function getThemeVariables(siteConfig?: SiteConfig | null): Record<string, string> {
  return {
    '--primary-color': siteConfig?.config?.theme?.primaryColor || '#2563eb',
    '--secondary-color': siteConfig?.config?.theme?.secondaryColor || '#64748b'
  }
}