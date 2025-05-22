// src/components/businesses/action-buttons.tsx (UPDATE EXISTING)
'use client'

import { useState } from 'react'
import { track } from '@/lib/analytics'

interface ActionButtonsProps {
  businessId: string
}

export function ShareButton({ businessId }: ActionButtonsProps) {
  const [shared, setShared] = useState(false)
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    track.businessAction(businessId, 'share') // Add tracking
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }
  
  return (
    <button
      type="button"
      className="flex items-center text-sm text-gray-600 hover:text-gray-900"
      onClick={handleShare}
    >
      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      {shared ? 'Copied!' : 'Share'}
    </button>
  )
}

export function ReportButton({ businessId }: ActionButtonsProps) {
  const handleReport = () => {
    track.businessAction(businessId, 'report') // Add tracking
    alert('Thank you for reporting this listing. Our team will review it shortly.')
  }
  
  return (
    <button
      type="button"
      className="flex items-center text-sm text-gray-600 hover:text-gray-900"
      onClick={handleReport}
    >
      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
      Report listing
    </button>
  )
}