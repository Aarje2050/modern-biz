// src/app/login/page.tsx - FIXED ENTERPRISE VERSION
import SiteAwareLoginForm from '@/components/auth/SiteAwareLoginForm'
import { getCurrentSite } from '@/lib/site-context'
import type { Metadata } from 'next'


export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = getCurrentSite() // FIXED: Use getCurrentSite not getCurrentSiteId
  
  const siteName = siteConfig?.name || 'BusinessDir'
  
  return {
    title: `Sign In - ${siteName}`,
    description: `Sign in to your ${siteName} account to manage your business profile and connect with customers`,
    robots: 'noindex',
  }
}

export default function LoginPage() {
  // REMOVED: Server-side redirect logic that was causing issues
  // All sites can have login functionality
  
  return (
  <>
  
  <SiteAwareLoginForm />
  </>
  )
}