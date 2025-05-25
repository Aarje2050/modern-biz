// src/components/email-processor-starter.tsx
'use client'

import { useEffect } from 'react'

export default function EmailProcessorStarter() {
  useEffect(() => {
    // Start email processor manager on app load
    const startProcessor = async () => {
      try {
        const response = await fetch('/api/email/manager', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' })
        })
        
        const data = await response.json()
        
        if (data.success) {
          console.log('✅ Email processor started:', data.message)
        } else {
          console.error('❌ Email processor start failed:', data.error)
        }
      } catch (error) {
        console.error('❌ Email processor startup error:', error)
      }
    }

    // Small delay to ensure app is fully loaded
    const timer = setTimeout(startProcessor, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  return null // This component renders nothing
}

