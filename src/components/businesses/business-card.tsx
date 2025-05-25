// src/components/businesses/business-card.tsx (Updated Design)
import Link from 'next/link'
import Image from 'next/image'
import SaveBusinessButton from './save-business-button'

type BusinessCardProps = {
  business: {
    id: string
    name: string
    slug: string
    short_description: string | null
    logo_url: string | null
    city?: string
    state?: string
    verification_level?: string
    categories?: string[]
    contacts?: { type: string, value: string }[]
  }
  isSaved?: boolean
  savedId?: string | null
}

export default function BusinessCard({ business, isSaved = false, savedId }: BusinessCardProps) {
  const phone = business.contacts?.find(c => c.type === 'phone')?.value
  const email = business.contacts?.find(c => c.type === 'email')?.value
  const website = business.contacts?.find(c => c.type === 'website')?.value

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* Logo/Header Section */}
      <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200">
        {business.logo_url ? (
          <Image
            src={business.logo_url}
            alt={business.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-600 font-bold text-lg shadow-sm">
              {business.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        )}
        
        {/* Save Button Overlay */}
        <div className="absolute top-3 right-3">
          <SaveBusinessButton businessId={business.id} isSaved={isSaved} savedId={savedId} />
        </div>
        
        {/* Verification Badge */}
        {business.verification_level && business.verification_level !== 'none' && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Business Name & Location */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors mb-1">
            <Link href={`/businesses/${business.slug}`}>
              {business.name}
            </Link>
          </h3>
          {(business.city || business.state) && (
            <p className="text-sm text-gray-500 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {business.city}{business.city && business.state ? ', ' : ''}{business.state}
            </p>
          )}
        </div>

        {/* Description */}
        {business.short_description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {business.short_description}
          </p>
        )}

        {/* Categories */}
        {business.categories && business.categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {business.categories.slice(0, 2).map((category, index) => (
              <span 
                key={index}
                className="inline-block bg-red-50 text-red-700 text-xs px-2 py-1 rounded-full font-medium"
              >
                {category}
              </span>
            ))}
            {business.categories.length > 2 && (
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                +{business.categories.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Link
            href={`/businesses/${business.slug}`}
            className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            View Details
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Contact Icons */}
          <div className="flex items-center space-x-2">
            {phone && (
              <a 
                href={`tel:${phone}`} 
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                title="Call"
                aria-label="Call business"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            )}
            {email && (
              <a 
                href={`mailto:${email}`} 
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Email"
                aria-label="Email business"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            )}
            {website && (
              <a 
                href={website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                title="Website"
                aria-label="Visit website"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}