// src/components/analytics/SimplePageTracker.tsx
// Add this component to any page that needs tracking
'use client'

import { useEffect } from 'react'
import { trackPageView } from '@/lib/analytics/tracker'

interface SimplePageTrackerProps {
  entityType: 'business' | 'category'
  entityId: string // slug or ID
}

export default function SimplePageTracker({ entityType, entityId }: SimplePageTrackerProps) {
  useEffect(() => {
    // Track page view on mount
    trackPageView(entityType, entityId)
  }, [entityType, entityId])

  return null // This component renders nothing
}

// Usage example:
// <SimplePageTracker entityType="business" entityId={business.slug} />