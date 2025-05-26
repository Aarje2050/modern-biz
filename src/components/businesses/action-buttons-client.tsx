// src/components/businesses/action-buttons-client.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

interface BusinessLocation {
  address_line1: string
  city: string
  state: string
  postal_code?: string
}

interface Business {
  id: string
  name: string
  slug: string
}

interface ActionButtonsProps {
  business: Business
  contactsByType: Record<string, string>
  primaryLocation?: BusinessLocation
  session: any
}

export default function ActionButtons({ 
  business, 
  contactsByType, 
  primaryLocation, 
  session 
}: ActionButtonsProps) {
  const [shareText, setShareText] = useState('Share')

  const handleShare = async () => {
    const url = window.location.href
    const title = business.name
    
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url)
        setShareText('Copied!')
        setTimeout(() => setShareText('Share'), 2000)
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url)
      setShareText('Copied!')
      setTimeout(() => setShareText('Share'), 2000)
    }
  }

  return (
    <div className={`grid gap-3 px-4 md:px-6 py-4 ${
      primaryLocation ? 'grid-cols-4' : 'grid-cols-3'
    }`}>
      {/* Website */}
      {contactsByType.website && (
        <a
          href={contactsByType.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors mobile-touch-feedback business-action-button"
        >
          <div className="w-6 h-6 text-blue-600 mb-1">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s1.343-9-3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-700">Website</span>
        </a>
      )}

      {/* Save */}
      <Link
        href={session 
          ? `/api/save-business?id=${business.id}` 
          : `/login?redirect_to=${encodeURIComponent(`/businesses/${business.slug}`)}`
        }
        className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors mobile-touch-feedback business-action-button"
      >
        <div className="w-6 h-6 text-red-600 mb-1">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <span className="text-xs font-medium text-gray-700">Save</span>
      </Link>

      {/* Share */}
      <button
        type="button"
        onClick={handleShare}
        className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors mobile-touch-feedback business-action-button"
      >
        <div className="w-6 h-6 text-green-600 mb-1">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </div>
        <span className="text-xs font-medium text-gray-700">{shareText}</span>
      </button>

      {/* Call */}
      {contactsByType.phone && (
        <Link
          href={session 
            ? `tel:${contactsByType.phone}` 
            : `/login?redirect_to=${encodeURIComponent(`/businesses/${business.slug}`)}`
          }
          className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors mobile-touch-feedback business-action-button"
        >
          <div className="w-6 h-6 text-emerald-600 mb-1">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-700">Call</span>
        </Link>
      )}

      {/* Directions - Only show if location exists */}
      {primaryLocation && (
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(
            `${primaryLocation.address_line1}, ${primaryLocation.city}, ${primaryLocation.state} ${primaryLocation.postal_code || ''}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors mobile-touch-feedback business-action-button"
        >
          <div className="w-6 h-6 text-purple-600 mb-1">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-700">Directions</span>
        </a>
      )}
    </div>
  )
}