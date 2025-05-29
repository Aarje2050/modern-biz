'use client'
import { usePathname } from 'next/navigation'
import { useSiteContext } from '@/hooks/useSiteContext'
import { resolveTemplate, getThemeVariables } from '@/lib/template/middleware'
import { Suspense } from 'react'

// DON'T import existing pages - let them handle their own metadata
// Instead, use dynamic imports or separate client components

// Template component registry (NEW COMPONENTS ONLY)
const COMPONENT_REGISTRY = {
  // Directory template - DON'T import existing, use fallback
  DirectoryHome: null, // Will fallback to existing page
  BusinessesPage: null, // Will fallback to existing page  
  CategoriesPage: null, // Will fallback to existing page
  SearchPage: null, // Will fallback to existing page
  BusinessDetail: () => <div>Business Detail (TODO)</div>,
  CategoryDetail: () => <div>Category Detail (TODO)</div>,
  
  // Landing template (new components only)
  LandingHome: () => {
    // Import the component directly here to avoid build issues
    const { default: LandingHome } = require('@/templates/landing/conversion/Home')
    return <LandingHome />
  },
  AboutPage: () => {
    const { default: About } = require('@/templates/shared/About')
    return <About />
  },
  ContactPage: () => {
    const { default: Contact } = require('@/templates/shared/Contact')
    return <Contact />
  },
  
  // Service template (new components only)
  ServiceHome: () => {
    const { default: ServiceHome } = require('@/templates/service/local/Home')
    return <ServiceHome />
  },
  ServicesPage: () => <div>Services Page (TODO)</div>,
  BookingPage: () => <div>Booking Page (TODO)</div>,
}

// Loading component
function TemplateLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}

// Error component
function TemplateError({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go Home
        </button>
      </div>
    </div>
  )
}

interface TemplatePageProps {
  children?: React.ReactNode
  fallback?: React.ReactNode
}

export default function TemplatePage({ children, fallback }: TemplatePageProps) {
  const pathname = usePathname()
  const { siteConfig, loading: siteLoading } = useSiteContext()
  
  // DEBUG: Log what's happening
  console.log('🎯 TemplatePage Debug:', {
    pathname,
    siteConfig: siteConfig ? {
      name: siteConfig.name,
      site_type: siteConfig.site_type,
      template: siteConfig.template
    } : 'No site config',
    loading: siteLoading
  })
  
  // Show loading while site context loads
  if (siteLoading) {
    return <TemplateLoading />
  }
  
  // No site config = use existing pages (backward compatibility)
  if (!siteConfig || !siteConfig.template || siteConfig.template === 'directory-modern') {
    console.log('📂 Using existing directory template')
    return children || fallback || <div>Loading...</div>
  }
  
  // Resolve template and component
  const { template, component, isSupported } = resolveTemplate(pathname, siteConfig)
  
  console.log('🔧 Template Resolution:', {
    template: template?.name,
    component,
    isSupported,
    siteType: template?.siteType
  })
  
  // Not supported = use existing page
  if (!isSupported || !component) {
    console.log('⚠️ Template not supported, using fallback')
    return children || fallback || <div>Page not found</div>
  }
  
  // Get component from registry
  const Component = COMPONENT_REGISTRY[component as keyof typeof COMPONENT_REGISTRY]
  
  // No component = use existing page
  if (!Component) {
    console.log('⚠️ Component not found in registry:', component)
    return children || fallback || <div>Loading...</div>
  }
  
  console.log('🚀 Loading template component:', component)
  
  // Apply theme variables
  const themeVars = getThemeVariables(siteConfig)
  
  return (
    <div 
      className={`template-${template?.siteType || 'directory'}`}
      style={themeVars as React.CSSProperties}
    >
      <Suspense fallback={<TemplateLoading />}>
        <Component />
      </Suspense>
    </div>
  )
}

// Layout wrapper for templates (SIMPLIFIED)
export function TemplateLayout({ children }: { children: React.ReactNode }) {
  return <div className="template-layout">{children}</div>
}

// HOC for template-aware pages (OPTIONAL)
export function withTemplate<T extends object>(
  WrappedComponent: React.ComponentType<T>
) {
  return function TemplateWrappedComponent(props: T) {
    return (
      <TemplatePage>
        <WrappedComponent {...props} />
      </TemplatePage>
    )
  }
}