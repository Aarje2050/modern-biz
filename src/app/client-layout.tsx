// src/app/client-layout.tsx
// FIXED VERSION - Remove old analytics, keep only essential functions
'use client'

import EmailProcessorStarter from '@/components/email-processor-starter'

// REMOVED: SimpleTracker component (causing duplicate tracking)
// Page tracking is now handled by SimplePageTracker component on individual pages

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EmailProcessorStarter />
      {children}
    </>
  )
}