// src/app/client-layout.tsx
'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { track } from '@/lib/analytics'
import EmailProcessorStarter from '@/components/email-processor-starter'

function SimpleTracker() {
  const pathname = usePathname()
  
  useEffect(() => {
    if (pathname.startsWith('/businesses/')) {
      const slug = pathname.split('/')[2]
      if (slug) track.pageView('business', slug)
    }
    if (pathname.startsWith('/categories/')) {
      const slug = pathname.split('/')[2] 
      if (slug) track.pageView('category', slug)
    }
  }, [pathname])
  
  return null
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SimpleTracker />
      <EmailProcessorStarter />
      {children}
    </>
  )
}