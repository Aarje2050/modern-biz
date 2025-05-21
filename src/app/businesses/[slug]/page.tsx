// src/app/businesses/[slug]/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/formatting'
import ReviewForm from '@/components/reviews/review-form'
import { ShareButton, ReportButton } from '@/components/businesses/action-buttons'
import dynamic from 'next/dynamic';

const ReviewList = dynamic(() => import('@/components/reviews/review-list'), {
  loading: () => <p>Loading reviews...</p>
});


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
export const revalidate = 300; 
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
  
  // Get the user session to check if authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  // Group contacts by type
  const contactsByType: Record<string, string> = {}
  contacts?.forEach(contact => {
    contactsByType[contact.type] = contact.value
  })
  
  // Get primary location
  const primaryLocation = locations?.find(loc => loc.is_primary) || locations?.[0]
  
  // Check if the business is saved by the current user
  let isSaved = false
  let savedId = null
  
  if (session) {
    const { data: savedBusiness } = await supabase
      .from('core.saved_businesses')
      .select('id')
      .eq('profile_id', session.user.id)
      .eq('business_id', business.id)
      .maybeSingle()
    
    isSaved = !!savedBusiness
    savedId = savedBusiness?.id
  }

 // src/app/businesses/[slug]/page.tsx

// ... keep all the imports and data fetching code the same ...
// Return statement for src/app/businesses/[slug]/page.tsx
return (
  <div className="bg-gray-50 min-h-screen">
    {/* Hero section with cover image */}
    <div className="relative h-64 md:h-96 bg-gray-200">
      {business.cover_url ? (
        <Image
          src={business.cover_url}
          alt={`${business.name} cover`}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600 flex items-center justify-center">
          <span className="text-gray-300 text-xl">{business.name}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black bg-opacity-40">
        <div className="container mx-auto h-full px-4 flex flex-col justify-end pb-6 md:pb-12">
          <div className="flex flex-col md:flex-row md:items-end">
            <div className="relative h-24 w-24 md:h-28 md:w-28 border-4 border-white rounded-lg shadow-xl overflow-hidden bg-white mr-5 -mb-12 md:mb-0">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={`${business.name} logo`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-100 text-gray-500 font-bold text-2xl">
                  {business.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="mt-16 md:mt-0">
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md">{business.name}</h1>
              {business.short_description && (
                <p className="text-white text-opacity-90 mt-2 text-lg max-w-2xl drop-shadow-md">{business.short_description}</p>
              )}
              <div className="flex items-center mt-3">
                {business.verification_level !== 'none' && (
                  <span className="inline-flex items-center mr-4 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {business.verification_level.replace('_', ' ').toUpperCase()}
                  </span>
                )}
                {primaryLocation && (
                  <span className="text-white text-sm flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {primaryLocation.city}, {primaryLocation.state}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Tabbed navigation */}
    <div className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
          <Link
            href={`/businesses/${business.slug}`}
            className="border-b-2 border-gray-900 text-gray-900 whitespace-nowrap py-4 px-1 font-medium text-sm"
          >
            Overview
          </Link>
          <Link
            href={`/businesses/${business.slug}/reviews`}
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Reviews
          </Link>
          {media && media.length > 0 && (
            <Link
              href={`/businesses/${business.slug}/photos`}
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              Photos
            </Link>
          )}
          {locations && locations.length > 0 && (
            <Link
              href={`/businesses/${business.slug}/locations`}
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              Locations
            </Link>
          )}
        </nav>
      </div>
    </div>
    
    {/* Main content */}
    <div className="container mx-auto px-4 py-8">
      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        {contactsByType.phone && (
          <a
            href={`tel:${contactsByType.phone}`}
            className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm text-gray-600 hover:bg-gray-50"
          >
            <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call
          </a>
        )}
        {contactsByType.website && (
          <a
            href={contactsByType.website}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm text-gray-600 hover:bg-gray-50"
          >
            <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Website
          </a>
        )}
        {primaryLocation && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(
              `${primaryLocation.address_line1}, ${primaryLocation.city}, ${primaryLocation.state} ${primaryLocation.postal_code}`
            )}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm text-gray-600 hover:bg-gray-50"
          >
            <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Directions
          </a>
        )}
        {contactsByType.email && (
          <a
            href={`mailto:${contactsByType.email}`}
            className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm text-gray-600 hover:bg-gray-50"
          >
            <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </a>
        )}
        {/* Save business link */}
        <Link
          href={session ? `/api/save-business?id=${business.id}` : `/login?redirect_to=${encodeURIComponent(`/businesses/${params.slug}`)}`}
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
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column - Business info */}
        <div className="flex-1">
          {/* Business description */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">About {business.name}</h2>
            <div className="prose max-w-none">
              {business.description ? (
                <p>{business.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description provided.</p>
              )}
            </div>
            {business.established_year && (
              <div className="flex items-center mt-4 text-sm text-gray-600">
                <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Established in {business.established_year}
              </div>
            )}
          </div>
          
          {/* Photo gallery */}
          {media && media.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Photos</h2>
                <Link 
                  href={`/businesses/${business.slug}/photos`} 
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  View all {media.length} photos
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.slice(0, 8).map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden group">
                    <Image
                      src={item.url}
                      alt={item.title || 'Business photo'}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Reviews section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Reviews</h2>
              <Link 
                href={`/businesses/${business.slug}/reviews`} 
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                See all reviews
              </Link>
            </div>
            <ReviewList businessId={business.id} limit={3} />
            {session ? (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4">Write a Review</h3>
                <ReviewForm businessId={business.id} />
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600">
                  Please <a href={`/login?redirect_to=${encodeURIComponent(`/businesses/${params.slug}`)}`} className="text-gray-800 font-medium underline">sign in</a> to write a review.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right column - Contact & location */}
        <div className="w-full lg:w-96 space-y-6">
          {/* Contact info card */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Contact Information</h2>
            <ul className="space-y-4">
              {contactsByType.phone && (
                <li className="flex">
                  <svg className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Phone</div>
                    <a href={`tel:${contactsByType.phone}`} className="font-medium hover:text-gray-700">
                      {contactsByType.phone}
                    </a>
                  </div>
                </li>
              )}
              {contactsByType.email && (
                <li className="flex">
                  <svg className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Email</div>
                    <a href={`mailto:${contactsByType.email}`} className="font-medium hover:text-gray-700 break-all">
                      {contactsByType.email}
                    </a>
                  </div>
                </li>
              )}
              {contactsByType.website && (
                <li className="flex">
                  <svg className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Website</div>
                    <a 
                      href={contactsByType.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-medium hover:text-gray-700 break-all"
                    >
                      {contactsByType.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </li>
              )}
            </ul>
            
            {Object.keys(contactsByType).length === 0 && (
              <p className="text-gray-600">No contact information available</p>
            )}
          </div>
          
          {/* Location card */}
          {primaryLocation && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Location</h2>
              <address className="not-italic mb-4">
                {primaryLocation.name && <div className="font-medium">{primaryLocation.name}</div>}
                <div>{primaryLocation.address_line1}</div>
                {primaryLocation.address_line2 && <div>{primaryLocation.address_line2}</div>}
                <div>{primaryLocation.city}, {primaryLocation.state} {primaryLocation.postal_code}</div>
                <div>{primaryLocation.country}</div>
              </address>
              
              {/* Placeholder for future map integration */}
              <div className="h-52 bg-gray-200 rounded-lg overflow-hidden mb-4">
                {/* Replace with actual map when available */}
                <div className="h-full w-full bg-gradient-to-b from-gray-300 to-gray-200 flex items-center justify-center text-gray-500">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${primaryLocation.address_line1}, ${primaryLocation.city}, ${primaryLocation.state} ${primaryLocation.postal_code}`
                )}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 w-full justify-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Get directions
              </a>
              
              {locations && locations.length > 1 && (
                <div className="mt-4 text-center">
                  <Link 
                    href={`/businesses/${business.slug}/locations`}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    View all {locations.length} locations
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {/* Business hours */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Business Hours</h2>
            {primaryLocation?.business_hours ? (
              <div>
                {/* Implement business hours display when available */}
                <p className="text-gray-600">Hours information available</p>
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-500">
                <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Hours information not available
              </div>
            )}
          </div>
          
          {/* Business details card */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Business Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <div className="text-gray-500 w-24 flex-shrink-0">Listed by:</div>
                <div>{profile?.full_name || 'Business Owner'}</div>
              </div>
              <div className="flex items-center">
                <div className="text-gray-500 w-24 flex-shrink-0">Listed on:</div>
                <div>{formatDate(business.created_at)}</div>
              </div>
              {business.verification_level !== 'none' && (
                <div className="flex items-center">
                  <div className="text-gray-500 w-24 flex-shrink-0">Verification:</div>
                  <div className="flex items-center text-green-600">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {business.verification_level.replace('_', ' ').charAt(0).toUpperCase() + business.verification_level.replace('_', ' ').slice(1)}
                  </div>
                </div>
              )}
              {business.established_year && (
                <div className="flex items-center">
                  <div className="text-gray-500 w-24 flex-shrink-0">Established:</div>
                  <div>{business.established_year}</div>
                </div>
              )}
            </div>
            
            {/* Share and report buttons */}
         {/* Share and report buttons */}
<div className="mt-6 pt-4 border-t border-gray-200">
  <div className="flex space-x-4">
    <ShareButton />
    <ReportButton />
  </div>
</div>
          </div>
          
          {/* Claim this business */}
          {!business.profile_id && (
            <div className="bg-blue-50 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-blue-800 mb-2">Own this business?</h2>
              <p className="text-blue-700 mb-4 text-sm">
                Claim this listing to manage your business profile, respond to reviews, and more.
              </p>
              <Link 
                href={`/businesses/${business.slug}/claim`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Claim this business
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)
}