// src/app/register/page.tsx (SITE-AWARE)
import SiteAwareRegisterForm from '@/components/auth/SiteAwareRegisterForm'
import { getCurrentSite } from '@/lib/site-context'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = getCurrentSite()
  
  const siteName = siteConfig?.name || 'Website'
  
  return {
    title: `Sign Up - ${siteName}`,
    description: `Create an account on ${siteName}`,
    robots: 'noindex',
  }
}

export default function RegisterPage() {
  const siteConfig = getCurrentSite()
  
  // Only directory sites allow registration for now
  if (siteConfig && siteConfig.site_type !== 'directory') {
    redirect('/')
  }
  
  return <SiteAwareRegisterForm />
}