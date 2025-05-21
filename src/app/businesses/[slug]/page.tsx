// src/app/businesses/[slug]/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/formatting'

// Add metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  
  const { data: business } = await supabase
    .from('businesses')
    .select('name, short_description')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single()
    
  if (!business) {
    return {
      title: 'Business Not Found',
      description: 'The business you are looking for could not be found.'
    }
  }
  
  return {
    title: business.name,
    description: business.short_description || `Learn more about ${business.name}`,
    openGraph: {
      title: business.name,
      description: business.short_description || `Learn more about ${business.name}`,
      type: 'website'
    }
  }
}

export default async function BusinessDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  
  // Get the business
  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', params.slug)
    .single()
  
  if (error || !business || business.status !== 'active') {
    notFound()
  }
  
  // Get profile of business owner
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', business.profile_id)
    .single()
  
  // Get locations
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('business_id', business.id)
    .order('is_primary', { ascending: false })
  
  // Get contacts
  const { data: contacts } = await supabase
    .from('business_contacts')
    .select('*')
    .eq('business_id', business.id)
  
  // Get featured media
  const { data: media } = await supabase
    .from('media')
    .select('*')
    .eq('business_id', business.id)
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })
    .limit(12)
  
  // Group contacts by type
  const contactsByType: Record<string, string> = {}
  contacts?.forEach(contact => {
    contactsByType[contact.type] = contact.value
  })
  
  // Get primary location
  const primaryLocation = locations?.find(loc => loc.is_primary) || locations?.[0]
  
  return (
    <div className="bg-white">
      {/* Hero section with cover image */}
      <div className="relative h-80 bg-gray-200">
        {business.cover_url ? (
          <Image
            src={business.cover_url}
            alt={`${business.name} cover`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-400 text-xl">No cover image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end">
          <div className="container mx-auto px-4 pb-8">
            <div className="flex items-end">
              <div className="relative h-24 w-24 border-4 border-white rounded-full overflow-hidden bg-white mr-4">
                {business.logo_url ? (
                  <Image
                    src={business.logo_url}
                    alt={`${business.name} logo`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                    {business.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white text-shadow">{business.name}</h1>
            </div>
          </div>
        </div>
      </div>

      

<div className="border-b border-gray-200 mb-8">
  <div className="container mx-auto px-4">
    <nav className="-mb-px flex space-x-8">
      <Link
        href={`/businesses/${business.slug}`}
        className="border-b-2 border-gray-900 text-gray-900 whitespace-nowrap py-4 px-1 font-medium text-sm"
      >
        Business Details
      </Link>
      <Link
        href={`/businesses/${business.slug}/reviews`}
        className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
      >
        Reviews
      </Link>
    </nav>
  </div>
</div>
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row">
          {/* Left column - Business info */}
          <div className="flex-1 lg:pr-8">
            {/* Business description */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">About</h2>
              <div className="prose max-w-none">
                <p>{business.description}</p>
              </div>
              {business.established_year && (
                <p className="text-sm text-gray-600 mt-4">
                  Established in {business.established_year}
                </p>
              )}
            </div>
            
            {/* Photo gallery */}
            {media && media.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Photos</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {media.map((item) => (
                    <div key={item.id} className="relative h-40 bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={item.url}
                        alt={item.title || 'Business photo'}
                        fill
                        className="object-cover hover:opacity-90 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Business hours - Placeholder for future */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Business Hours</h2>
              <p className="text-gray-600">Hours information not available</p>
            </div>
          </div>
          
          {/* Right column - Contact & location */}
          <div className="w-full lg:w-80">
            {/* Contact info card */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm mb-6">
              <h2 className="text-lg font-bold mb-4">Contact Information</h2>
              <ul className="space-y-3">
                {contactsByType.phone && (
                  <li className="flex">
                    <svg className="h-6 w-6 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{contactsByType.phone}</span>
                  </li>
                )}
                {contactsByType.email && (
                  <li className="flex">
                    <svg className="h-6 w-6 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${contactsByType.email}`} className="text-blue-600 hover:underline">
                      {contactsByType.email}
                    </a>
                  </li>
                )}
                {contactsByType.website && (
                  <li className="flex">
                    <svg className="h-6 w-6 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <a href={contactsByType.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                      {contactsByType.website.replace(/^https?:\/\//, '')}
                    </a>
                  </li>
                )}
              </ul>
              
              {Object.keys(contactsByType).length === 0 && (
                <p className="text-gray-600">No contact information available</p>
              )}
            </div>
            
            {/* Location card */}
            {primaryLocation && (
              <div className="bg-gray-50 rounded-lg p-6 shadow-sm mb-6">
                <h2 className="text-lg font-bold mb-4">Location</h2>
                <address className="not-italic mb-4">
                  {primaryLocation.name && <div className="font-medium">{primaryLocation.name}</div>}
                  <div>{primaryLocation.address_line1}</div>
                  {primaryLocation.address_line2 && <div>{primaryLocation.address_line2}</div>}
                  <div>{primaryLocation.city}, {primaryLocation.state} {primaryLocation.postal_code}</div>
                  <div>{primaryLocation.country}</div>
                </address>
                
                {/* Placeholder for future map integration */}
                <div className="h-48 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                  Map placeholder
                </div>
                {/* Link to directions - would use latitude/longitude when available */}
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${primaryLocation.address_line1}, ${primaryLocation.city}, ${primaryLocation.state} ${primaryLocation.postal_code}`
                  )}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >
                  Get directions
                </a>
              </div>
            )}
            
            {/* Business details card */}
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Listed by:</span>
                  <span>{profile?.full_name || 'Business Owner'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Listed on:</span>
                  <span>{formatDate(business.created_at)}</span>
                </div>
                {business.verification_level !== 'none' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verification:</span>
                    <span className="text-green-600">{business.verification_level}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}