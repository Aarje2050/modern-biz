// src/components/businesses/business-card.tsx
import Image from 'next/image'
import Link from 'next/link'

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
}

export default function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Link 
      href={`/businesses/${business.slug}`} 
      className="block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative h-48 bg-gray-200">
        {business.logo_url ? (
          <Image
            src={business.logo_url}
            alt={business.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-3xl font-bold">
            {business.name.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-1">{business.name}</h3>
        {business.city && business.state && (
          <p className="text-sm text-gray-600 mb-2">
            {business.city}, {business.state}
          </p>
        )}
        <p className="text-sm text-gray-800 line-clamp-2">
          {business.short_description || 'No description available'}
        </p>
      </div>
    </Link>
  )
}