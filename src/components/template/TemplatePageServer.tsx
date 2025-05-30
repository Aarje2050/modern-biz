// src/components/template/TemplatePageServer.tsx (FIXED - SERVER ONLY)
import { SiteConfig } from '@/lib/site-context'
import TemplatePageClient from './TemplatePageClient'
import { createClient } from '@/lib/supabase/server'

interface TemplatePageServerProps {
  siteConfig: SiteConfig
  fallback: React.ReactNode
}

// ============================================================================
// MAIN COMPONENT (KEEP YOUR EXISTING LOGIC)
// ============================================================================
export default function TemplatePageServer({ siteConfig, fallback }: TemplatePageServerProps) {
  // For non-directory sites, render client-side template
  if (siteConfig.site_type !== 'directory' && siteConfig.template !== 'directory-modern') {
    return <TemplatePageClient siteConfig={siteConfig} fallback={fallback} />
  }
  
  // For directory sites, render the fallback (DirectoryHomePage)
  return <>{fallback}</>
}

// ============================================================================
// ENTERPRISE TEMPLATE SYSTEM (DIRECTORY FOCUSED - SERVER ONLY)
// ============================================================================

// Type-safe template definitions for directory sites
const DIRECTORY_TEMPLATES = {
  about: {
    'template-v1': () => import('@/templates/directory/modern/pages/AboutProfessional'),
    'template-v2': () => import('@/templates/directory/modern/pages/AboutStory')
  },
  contact: {
    'template-v1': () => import('@/templates/directory/modern/pages/ContactSimple'),
    'template-v2': () => import('@/templates/directory/modern/pages/ContactLocal')
  }
} as const

// Type definitions
type DirectoryPageType = keyof typeof DIRECTORY_TEMPLATES
type DirectoryTemplateId<T extends DirectoryPageType> = keyof typeof DIRECTORY_TEMPLATES[T]

/**
 * Enterprise-grade template resolver for directory sites
 * SERVER COMPONENT ONLY - handles template selection with proper fallbacks
 */
export async function getDirectoryPageTemplate(
  siteConfig: SiteConfig, 
  pageType: DirectoryPageType
): Promise<React.ComponentType<{ siteConfig: SiteConfig }> | null> {
  
  // Only handle directory sites
  if (siteConfig.site_type !== 'directory') {
    return null
  }

  try {
    // Get template selection from database
    const supabase = createClient()
    const { data, error } = await supabase
      .from('site_customizations')
      .select('page_templates')
      .eq('site_id', siteConfig.id)
      .eq('section', 'templates')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Database error fetching templates:', error)
    }

    const selectedTemplateId = data?.page_templates?.[pageType]
    
    // Get available templates for this page type
    const availableTemplates = DIRECTORY_TEMPLATES[pageType]
    
    // Type-safe template selection with fallback
    const templateId = isValidTemplateId(selectedTemplateId, availableTemplates) 
      ? selectedTemplateId 
      : getDefaultTemplateId(availableTemplates)

    // Load and return the template component
    const templateImport = availableTemplates[templateId]
    const { default: TemplateComponent } = await templateImport()
    
    return TemplateComponent

  } catch (error) {
    console.error('Template loading error:', error)
    return null
  }
}

// ============================================================================
// UTILITY FUNCTIONS (TYPE-SAFE - SERVER ONLY)
// ============================================================================

/**
 * Type guard to check if template ID is valid for given templates
 */
function isValidTemplateId<T extends Record<string, any>>(
  templateId: any,
  availableTemplates: T
): templateId is keyof T {
  return typeof templateId === 'string' && templateId in availableTemplates
}

/**
 * Get the default template ID (first available template)
 */
function getDefaultTemplateId<T extends Record<string, any>>(
  availableTemplates: T
): keyof T {
  return Object.keys(availableTemplates)[0] as keyof T
}

// ============================================================================
// FUTURE EXPANSION SYSTEM (COMMENTED FOR NOW)
// ============================================================================

/*
// When you're ready to add more site types, uncomment and extend this:

const LANDING_TEMPLATES = {
  about: {
    'minimal': () => import('@/templates/landing/modern/pages/AboutMinimal'),
    'product': () => import('@/templates/landing/modern/pages/AboutProduct')
  },
  contact: {
    'form': () => import('@/templates/landing/modern/pages/ContactForm')
  }
} as const

const SERVICE_TEMPLATES = {
  about: {
    'expertise': () => import('@/templates/service/modern/pages/AboutExpertise'),
    'credentials': () => import('@/templates/service/modern/pages/AboutCredentials')
  },
  contact: {
    'booking': () => import('@/templates/service/modern/pages/ContactBooking'),
    'consultation': () => import('@/templates/service/modern/pages/ContactConsultation')
  }
} as const

// Master template registry (for future use)
const TEMPLATE_REGISTRY = {
  directory: DIRECTORY_TEMPLATES,
  landing: LANDING_TEMPLATES,
  service: SERVICE_TEMPLATES
} as const

// Generic template resolver (for future use)
export async function getPageTemplate(
  siteConfig: SiteConfig,
  pageType: string
) {
  const siteType = siteConfig.site_type
  
  if (siteType === 'directory') {
    return getDirectoryPageTemplate(siteConfig, pageType as DirectoryPageType)
  }
  
  // Add other site types here when ready:
  // if (siteType === 'landing') {
  //   return getLandingPageTemplate(siteConfig, pageType)
  // }
  
  return null
}
*/