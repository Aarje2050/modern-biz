'use client'
import { usePathname } from 'next/navigation'
import { SiteConfig } from '@/lib/site-context'
import { resolveTemplate, getThemeVariables } from '@/lib/template/middleware'
import { Suspense } from 'react'

// Template component registry (CLIENT COMPONENTS ONLY)
const COMPONENT_REGISTRY = {
  // Landing template
  LandingHome: () => {
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
  
  // Service template
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

interface TemplatePageClientProps {
  siteConfig: SiteConfig
  fallback: React.ReactNode
}

export default function TemplatePageClient({ siteConfig, fallback }: TemplatePageClientProps) {
  const pathname = usePathname()
  
  console.log('🎯 TemplatePageClient Debug:', {
    pathname,
    siteConfig: {
      name: siteConfig.name,
      site_type: siteConfig.site_type,
      template: siteConfig.template
    }
  })
  
  // Resolve template and component
  const { template, component, isSupported } = resolveTemplate(pathname, siteConfig)
  
  console.log('🔧 Template Resolution:', {
    template: template?.name,
    component,
    isSupported,
    siteType: template?.siteType
  })
  
  // Not supported = use fallback
  if (!isSupported || !component) {
    console.log('⚠️ Template not supported, using fallback')
    return <>{fallback}</>
  }
  
  // Get component from registry
  const Component = COMPONENT_REGISTRY[component as keyof typeof COMPONENT_REGISTRY]
  
  if (!Component) {
    console.log('⚠️ Component not found in registry:', component)
    return <TemplateError error={`Component not found: ${component}`} />
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