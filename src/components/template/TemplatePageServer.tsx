// src/components/template/TemplatePageServer.tsx (SERVER COMPONENT)
import { SiteConfig } from '@/lib/site-context'
import TemplatePageClient from './TemplatePageClient'

interface TemplatePageServerProps {
  siteConfig: SiteConfig
  fallback: React.ReactNode
}

export default function TemplatePageServer({ siteConfig, fallback }: TemplatePageServerProps) {
  // For non-directory sites, render client-side template
  if (siteConfig.site_type !== 'directory' && siteConfig.template !== 'directory-modern') {
    return <TemplatePageClient siteConfig={siteConfig} fallback={fallback} />
  }
  
  // For directory sites, render the fallback (DirectoryHomePage)
  return <>{fallback}</>
}