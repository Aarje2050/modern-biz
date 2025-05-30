// src/app/register/page.tsx - FIXED ENTERPRISE VERSION
import SiteAwareRegisterForm from '@/components/auth/SiteAwareRegisterForm'
import { getCurrentSite } from '@/lib/site-context'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = getCurrentSite()
  
  const siteName = siteConfig ? siteConfig.name : 'BusinessDir'
  
  return {
    title: `Join ${siteName} - Create Your Account`,
    description: `Create an account on ${siteName} to discover local businesses, write reviews, and connect with your community`,
    robots: 'noindex',
  }
}

export default function RegisterPage() {
  // REMOVED: Server-side redirect logic that was causing issues
  // All sites can have registration functionality
  
  return <SiteAwareRegisterForm />
}