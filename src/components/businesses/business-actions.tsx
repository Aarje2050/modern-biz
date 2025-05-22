'use client'

import Link from 'next/link'
import { track } from '@/lib/analytics'

interface BusinessActionsProps {
  businessId: string
  businessSlug: string
  isSaved: boolean
  session: any
  contactsByType: {
    phone?: string
    website?: string
    email?: string
  }
  primaryLocation?: {
    address_line1: string
    city: string
    state: string
    postal_code?: string
  } | null
}

export default function BusinessActions({ 
  businessId, 
  businessSlug,
  isSaved,
  session,
  contactsByType, 
  primaryLocation 
}: BusinessActionsProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {/* Call Button */}
      {contactsByType.phone && (
        <a
          href={`tel:${contactsByType.phone}`}
          onClick={() => track.businessAction(businessId, 'call')}
          className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm text-gray-600 hover:bg-gray-50"
        >
          <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Call
        </a>
      )}
      
      {/* Website Button */}
      {contactsByType.website && (
        <a
          href={contactsByType.website}
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => track.businessAction(businessId, 'website')}
          className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm text-gray-600 hover:bg-gray-50"
        >
          <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          Website
        </a>
      )}
      
      {/* Directions Button */}
      {primaryLocation && (
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(
            `${primaryLocation.address_line1}, ${primaryLocation.city}, ${primaryLocation.state} ${primaryLocation.postal_code || ''}`
          )}`}
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => track.businessAction(businessId, 'directions')}
          className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm text-gray-600 hover:bg-gray-50"
        >
          <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Directions
        </a>
      )}
      
      {/* Email Button */}
      {contactsByType.email && (
        <a
          href={`mailto:${contactsByType.email}`}
          onClick={() => track.businessAction(businessId, 'email')}
          className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm text-gray-600 hover:bg-gray-50"
        >
          <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email
        </a>
      )}
      
      {/* Save Business Button */}
<Link
  href={session 
    ? `/api/save-business?id=${businessId}` 
    : `/login?redirect_to=${encodeURIComponent(`/businesses/${businessSlug}`)}`
  }
  onClick={() => {
    if (session) {
      track.businessAction(businessId, 'save');
    }
  }}
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
>
  Save Business
</Link>
    </div>
  )
}
