// src/app/login/page.tsx (SITE-AWARE)
import SiteAwareLoginForm from '@/components/auth/SiteAwareLoginForm'
import { getCurrentSite } from '@/lib/site-context'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = getCurrentSite()
  
  const siteName = siteConfig?.name || 'Website'
  
  return {
    title: `Sign In - ${siteName}`,
    description: `Sign in to your ${siteName} account`,
    robots: 'noindex',
  }
}

export default function LoginPage() {
  const siteConfig = getCurrentSite()
  
  // For non-directory sites, only allow login if explicitly enabled
  if (siteConfig && siteConfig.site_type !== 'directory') {
    // Landing and service sites might not need login functionality
    // Redirect to homepage for now
    redirect('/')
  }
  
  return <SiteAwareLoginForm />
}