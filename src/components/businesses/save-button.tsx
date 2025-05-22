// src/components/businesses/save-button.tsx (NEW FILE)
'use client'

import Link from 'next/link'
import { track } from '@/lib/analytics'

interface SaveButtonProps {
  businessId: string
  businessSlug: string
  isSaved: boolean
  session: any
}

export default function SaveButton({ 
  businessId, 
  businessSlug, 
  isSaved, 
  session 
}: SaveButtonProps) {
  const handleSaveClick = () => {
    track.businessAction(businessId, 'save')
  }
  
  return (
    <Link
      href={session 
        ? `/api/save-business?id=${businessId}` 
        : `/login?redirect_to=${encodeURIComponent(`/businesses/${businessSlug}`)}`
      }
      onClick={handleSaveClick}
      className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm text-gray-600 hover:bg-gray-50"
    >
      <svg 
        className={`h-5 w-5 mr-2 ${isSaved ? 'text-red-500' : 'text-gray-500'}`} 
        fill={isSaved ? 'currentColor' : 'none'} 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {isSaved ? 'Saved' : 'Save'}
    </Link>
  )
}