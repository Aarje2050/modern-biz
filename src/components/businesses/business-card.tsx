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
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex space-x-4">
            <div className="relative h-14 w-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
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
              <h2 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                <Link href={`/businesses/${business.slug}`}>
                  {business.name}
                </Link>
              </h2>
              <p className="text-sm text-gray-500">
                {business.city}{business.city && business.state ? ', ' : ''}{business.state}
              </p>
              {business.verification_level && business.verification_level !== 'none' && (
                <span className="mt-1 inline-block text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md font-medium">
                  Verified {business.verification_level.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
          <SaveBusinessButton businessId={business.id} isSaved={isSaved} savedId={savedId} />
        </div>

        {business.short_description && (
          <p className="text-gray-600 mt-3 text-sm line-clamp-2">
            {business.short_description}
          </p>
        )}

        {business.categories && business.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {business.categories.slice(0, 2).map((cat, i) => (
              <span key={i} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                {cat}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <Link
            href={`/businesses/${business.slug}`}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View Details →
          </Link>

          <div className="flex space-x-2 text-gray-400">
            {phone && (
              <a href={`tel:${phone}`} className="hover:text-gray-600" title="Call">
                📞
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="hover:text-gray-600" title="Email">
                ✉️
              </a>
            )}
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600" title="Website">
                🌐
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
