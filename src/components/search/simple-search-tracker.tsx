// src/components/search/simple-search-tracker.tsx (NEW FILE)
'use client'

import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics'

interface SimpleSearchTrackerProps {
  query: string | null
  resultCount: number
}

export default function SimpleSearchTracker({ 
  query, 
  resultCount 
}: SimpleSearchTrackerProps) {
  const lastTrackedQuery = useRef<string | null>(null)
  
  useEffect(() => {
    // Only track if there's a query and it's different from last tracked
    if (query && query.trim() && query !== lastTrackedQuery.current) {
      track.search(query, resultCount)
      lastTrackedQuery.current = query
    }
  }, [query, resultCount])
  
  return null // This component doesn't render anything
}