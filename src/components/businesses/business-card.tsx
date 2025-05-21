// src/components/businesses/business-card.tsx
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
  }
  isSaved?: boolean
  savedId?: string | null
}

export default function BusinessCard({ business, isSaved = false, savedId }: BusinessCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4">
            <div className="relative h-16 w-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                  {business.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-medium hover:text-gray-700">
                <Link href={`/businesses/${business.slug}`}>
                  {business.name}
                </Link>
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {business.city}{business.city && business.state ? ', ' : ''}{business.state}
              </p>
            </div>
          </div>
          <SaveBusinessButton businessId={business.id} isSaved={isSaved} savedId={savedId} />
        </div>
        
        {business.short_description && (
          <p className="text-gray-600 mt-4 text-sm line-clamp-2">
            {business.short_description}
          </p>
        )}
        
        <div className="mt-4">
          <Link 
            href={`/businesses/${business.slug}`}
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}