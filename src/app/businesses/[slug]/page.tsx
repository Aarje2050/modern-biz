// src/app/businesses/[slug]/page.tsx (MINIMAL Site-Aware Changes Only)
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/formatting'
import { getCurrentSite } from '@/lib/site-context' // ADDED: Site context
import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import SimplePageTracker from '@/components/analytics/SimplePageTracker'




// Client Components
const ContactInfo = dynamic(() => import('@/components/businesses/contact-info'), {
  loading: () => <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>
})

const ReviewList = dynamic(() => import('@/components/reviews/review-list'), {
  loading: () => <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>
})

const ReviewForm = dynamic(() => import('@/components/reviews/review-form'), {
  loading: () => <div className="animate-pulse h-24 bg-gray-100 rounded-lg"></div>
})

const BusinessAssistant = dynamic(() => import('@/components/chat/business-assistant'), {
  loading: () => null
})

const SectionNavigation = dynamic(() => import('@/components/businesses/section-navigation'), {
  loading: () => null
})

const ActionButtons = dynamic(() => import('@/components/businesses/action-buttons-client'), {
  loading: () => <div className="animate-pulse h-20 bg-gray-100 rounded-lg"></div>
})

const ImageGallery = dynamic(() => import('@/components/businesses/image-gallery'), {
  loading: () => null
})

const RatingDisplay = dynamic(() => import('@/components/businesses/rating-display'), {
  loading: () => <div className="animate-pulse h-6 w-24 bg-gray-100 rounded"></div>
})

const PhotoPreview = dynamic(() => import('@/components/businesses/photo-preview'), {
  loading: () => null
})

// Types
interface BusinessLocation {
  id: string
  name?: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code?: string
  country: string
  latitude?: number
  longitude?: number
  is_primary: boolean
  business_hours?: any
}

interface BusinessContact {
  type: string
  value: string
  is_primary: boolean
}

interface BusinessMedia {
  id: string
  url: string
  thumbnail_url?: string
  title?: string
  is_featured: boolean
}

interface BusinessCategory {
  category: any // Flexible to handle Supabase type inference issues
}

interface Business {
  id: string
  name: string
  slug: string
  description?: string
  short_description?: string
  logo_url?: string
  cover_url?: string
  established_year?: number
  status: string
  verification_level: string
  profile_id?: string
  created_at: string
  categories?: BusinessCategory[]
}

// Business Hours Utilities
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
}

function getDayName(day: string): string {
  const dayMap: Record<string, string> = {
    'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday',
    'thu': 'Thursday', 'fri': 'Friday', 'sat': 'Saturday', 'sun': 'Sunday'
  }
  return dayMap[day] || day
}

function getCurrentDayAbbr(): string {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return days[new Date().getDay()]
}

function isCurrentlyOpen(businessHours: any): { isOpen: boolean; nextChange: string | null } {
  if (!businessHours || !Array.isArray(businessHours)) {
    return { isOpen: false, nextChange: null }
  }

  const now = new Date()
  const currentDay = getCurrentDayAbbr()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const todayHours = businessHours.find(schedule => 
    schedule.days && schedule.days.includes(currentDay)
  )

  if (!todayHours || todayHours.status === 'closed' || !todayHours.hours || todayHours.hours.length === 0) {
    return { isOpen: false, nextChange: 'Opens tomorrow' }
  }

  for (const timeSlot of todayHours.hours) {
    if (timeSlot.from && timeSlot.to) {
      const [fromHour, fromMin] = timeSlot.from.split(':').map(Number)
      const [toHour, toMin] = timeSlot.to.split(':').map(Number)
      
      const openTime = fromHour * 60 + fromMin
      const closeTime = toHour * 60 + toMin
      
      if (currentTime >= openTime && currentTime < closeTime) {
        return { isOpen: true, nextChange: `Closes at ${formatTime(timeSlot.to)}` }
      }
    }
  }

  return { isOpen: false, nextChange: 'Closed today' }
}

// Helper function to safely extract category data
function getCategoryData(category: any): { name: string; slug: string } | null {
  if (!category) return null
  
  // Handle if category is an array (Supabase type inference)
  if (Array.isArray(category)) {
    return category[0] || null
  }
  
  // Handle if category is a single object (runtime reality)
  if (category.name && category.slug) {
    return category
  }
  
  return null
}
function Breadcrumbs({ business, siteConfig }: { business: Business; siteConfig: any }) {
  const category = getCategoryData(business.categories?.[0]?.category)
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4 px-4 md:px-6 overflow-x-auto">
      <Link href="/" className="hover:text-red-600 whitespace-nowrap">
        {siteConfig?.name || 'Home'}
      </Link>
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
      
      {category && (
        <>
          <Link href={`/categories/${category.slug}`} className="hover:text-red-600 whitespace-nowrap">
            {category.name}
          </Link>
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </>
      )}
      
      <span className="text-gray-700 font-medium truncate">{business.name}</span>
    </nav>
  )
}

function BusinessHours({ businessHours }: { businessHours: any }) {
  if (!businessHours || !Array.isArray(businessHours)) {
    return (
      <div className="text-center py-4 text-gray-500">
        <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">Hours not available</p>
      </div>
    )
  }

  const { isOpen, nextChange } = isCurrentlyOpen(businessHours)
  
  return (
    <div className="space-y-3">
      <div className={`flex items-center justify-center p-3 rounded-lg ${
        isOpen ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className={`flex items-center ${isOpen ? 'text-emerald-700' : 'text-red-700'}`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="font-medium">{isOpen ? 'Open Now' : 'Closed'}</span>
          {nextChange && <span className="text-sm ml-2 opacity-75">• {nextChange}</span>}
        </div>
      </div>

      <div className="space-y-2">
        {businessHours.map((schedule: any, index: number) => {
          const dayNames = schedule.days?.map(getDayName) || []
          const dayRange = dayNames.length > 2 ? `${dayNames[0]} - ${dayNames[dayNames.length - 1]}` : dayNames.join(', ')

          return (
            <div key={index} className="flex justify-between items-center py-2 text-sm">
              <span className="font-medium text-gray-700">{dayRange}</span>
              <span className="text-gray-600">
                {schedule.status === 'closed' || !schedule.hours?.length 
                  ? 'Closed'
                  : schedule.hours.map((timeSlot: any) => (
                      timeSlot.from && timeSlot.to 
                        ? `${formatTime(timeSlot.from)} - ${formatTime(timeSlot.to)}`
                        : 'Closed'
                    )).join(', ')
                }
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// SEO Metadata
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient()
  const siteConfig = getCurrentSite() // ADDED: Site context
  
  // ADDED: Site check
  if (!siteConfig) {
    return {
      title: 'Business Not Found',
      description: 'The business you are looking for could not be found.'
    }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select(`
      name, 
      short_description, 
      description,
      logo_url,
      categories:business_categories(category:categories(name, slug))
    `)
    .eq('slug', params.slug)
    .eq('site_id', siteConfig.id) // ADDED: Site filter
    .eq('status', 'active')
    .single()
    
  if (!business) {
    return {
      title: 'Business Not Found',
      description: 'The business you are looking for could not be found.'
    }
  }

  const categoryData = getCategoryData(business.categories?.[0]?.category)
  const category = categoryData?.name
  const siteName = siteConfig?.name || 'Business Directory' // ADDED: Site name
  const location = siteConfig?.config?.location || '' // ADDED: Site location
  
  const title = `${business.name}${category ? ` - ${category}` : ''}${location ? ` in ${location}` : ''} | ${siteName}`
  const description =  `Learn more about ${business.name}, a trusted local business.`
  
  return {
    title,
    description,
    keywords: `${business.name}, ${category || 'business'}, ${location}, reviews, contact`,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/businesses/${params.slug}`,
      siteName,
      images: business.logo_url ? [{ url: business.logo_url, alt: `${business.name} logo` }] : undefined,
    },
    alternates: {
      canonical: `/businesses/${params.slug}`,
    }
  }
}

export const revalidate = 600

export default async function BusinessDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const siteConfig = getCurrentSite() // ADDED: Site context
  
  // ADDED: Site check
  if (!siteConfig) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Site Not Found</h1>
          <p className="text-gray-600">This domain is not configured in our system.</p>
        </div>
      </div>
    )
  }
  
  // Get business with all related data
  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      *,
      categories:business_categories(category:categories(name, slug))
    `)
    .eq('slug', params.slug)
    .eq('site_id', siteConfig.id) // ADDED: Site filter
    .single()
  
  if (error || !business || business.status !== 'active') {
    notFound()
  }
  
  // Parallel data fetching
  const [
    { data: locations },
    { data: contacts },
    { data: media },
    { data: { session } },
    { data: relatedBusinesses },
    { data: reviews }
  ] = await Promise.all([
    supabase.from('locations').select('*').eq('business_id', business.id).order('is_primary', { ascending: false }),
    supabase.from('business_contacts').select('*').eq('business_id', business.id),
    supabase.from('media').select('*').eq('business_id', business.id).order('is_featured', { ascending: false }).limit(12),
    supabase.auth.getSession(),
    // MODIFIED: Related businesses from same site only
    supabase.from('businesses')
      .select('id, name, slug, short_description, logo_url')
      .eq('site_id', siteConfig.id)
      .eq('status', 'active')
      .neq('id', business.id)
      .limit(4),
    supabase.from('reviews')
      .select('rating')
      .eq('business_id', business.id)
      .eq('status', 'published')
  ])
  
  const primaryLocation = locations?.find(loc => loc.is_primary) || locations?.[0]
  const contactsByType: Record<string, string> = {}
  contacts?.forEach(contact => {
    contactsByType[contact.type] = contact.value
  })

  // Calculate average rating
  const avgRating = reviews?.length ? 
    (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Breadcrumbs - Desktop Only */}
      <div className="hidden md:block bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs business={business} siteConfig={siteConfig} />
        </div>
      </div>

      {/* Hero Section - GMB Inspired */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto">
          
          {/* Cover Photo */}
          <div className="relative h-48 md:h-64 overflow-hidden">
            {business.cover_url ? (
              <Image
                src={business.cover_url}
                alt={`${business.name} cover`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600" />
            )}
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>

          {/* Business Info Card */}
          <div className="relative px-4 md:px-6 pb-6">
            <div className="bg-white rounded-2xl shadow-lg -mt-8 p-6 relative z-10 business-hero-card">
              <div className="flex items-start gap-4">
                
                {/* Logo */}
                <div className="relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                  {business.logo_url ? (
                    <Image
                      src={business.logo_url}
                      alt={`${business.name} logo`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-bold text-lg">
                      {business.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Business Details */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                    {business.name}
                  </h1>
                  
                  {/* Rating & Reviews - Client Component */}
                  {avgRating && (
                    <RatingDisplay 
                      rating={avgRating}
                      reviewCount={reviews?.length || 0}
                    />
                  )}
                  
                  {/* Categories & Verification */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {business.categories?.slice(0, 2).map((cat: BusinessCategory, idx: number) => {
                      const category = getCategoryData(cat.category)
                      return category ? (
                        <Link
                          key={idx}
                          href={`/categories/${category.slug}`}
                          className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full hover:bg-red-100 transition-colors"
                        >
                          {category.name}
                        </Link>
                      ) : null
                    })}
                    
                    {business.verification_level !== 'none' && (
                      <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  
                  {/* Key Info Row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {primaryLocation?.business_hours && (
                      <div className="flex items-center">
                        <span className={`inline-flex items-center ${
                          isCurrentlyOpen(primaryLocation.business_hours).isOpen 
                            ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            isCurrentlyOpen(primaryLocation.business_hours).isOpen 
                              ? 'bg-emerald-500' : 'bg-red-500'
                          }`} />
                          {isCurrentlyOpen(primaryLocation.business_hours).isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    )}
                    
                    {primaryLocation && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {primaryLocation.city}, {primaryLocation.state}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Gallery Preview - Client Component */}
          {media && media.length > 0 && (
            <div className="px-4 md:px-6 pb-4">
              <PhotoPreview images={media} businessName={business.name} />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto">
        <ActionButtons
  business={business}
  contactsByType={contactsByType}
  primaryLocation={primaryLocation}
  session={session}
/>
        </div>
      </div>

      {/* Section Navigation - Fixed positioning */}
      <div className="sticky top-14 md:top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto">
          <SectionNavigation />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* About Section */}
          <section id="about" className="bg-white rounded-xl shadow-sm border p-6 section-scroll-padding">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
            <div className="prose max-w-none text-gray-700">
              {business.description ? (
                <p className="leading-relaxed">{business.description}</p>
              ) : business.short_description ? (
                <p className="leading-relaxed">{business.short_description}</p>
              ) : (
                <p className="text-gray-500 italic">No description provided yet.</p>
              )}
            </div>
            
            {/* Key Details */}
            <div className="mt-6 pt-6 border-t space-y-3">
              {business.established_year && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Established</span>
                  <span className="font-medium text-gray-900">{business.established_year}</span>
                </div>
              )}
              
              {primaryLocation && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Areas served</span>
                  <span className="font-medium text-gray-900">
                    {primaryLocation.city} and nearby areas
                  </span>
                </div>
              )}
            </div>
          </section>
          
          {/* Photos Section with Gallery */}
          {media && media.length > 0 && (
            <section id="gallery" className="bg-white rounded-xl shadow-sm border p-6 section-scroll-padding">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Photos</h2>
              <ImageGallery images={media} businessName={business.name} />
            </section>
          )}
          
          {/* Reviews Section */}
          <section id="reviews" className="bg-white rounded-xl shadow-sm border p-6 section-scroll-padding">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews</h2>
            <ReviewList businessId={business.id} limit={5} />
            
            {session ? (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
                <ReviewForm businessId={business.id} />
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t text-center py-8 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Share Your Experience</h3>
                <p className="text-gray-600 mb-4">Sign in to write a review</p>
                <Link
                  href={`/login?redirect_to=${encodeURIComponent(`/businesses/${params.slug}`)}`}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Sign In to Review
                </Link>
              </div>
            )}
          </section>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Info</h3>
              <ContactInfo 
                contacts={contacts || []} 
                session={session}
                businessSlug={business.slug}
              />
            </div>
          </div>
          
          {/* Location & Hours */}
          {primaryLocation && (
            <section id="location" className="bg-white rounded-xl shadow-sm border section-scroll-padding">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Location</h3>
                
                <address className="not-italic text-gray-700 mb-4">
                  {primaryLocation.name && <div className="font-medium mb-1">{primaryLocation.name}</div>}
                  <div>{primaryLocation.address_line1}</div>
                  {primaryLocation.address_line2 && <div>{primaryLocation.address_line2}</div>}
                  <div>{primaryLocation.city}, {primaryLocation.state} {primaryLocation.postal_code}</div>
                </address>
                
                {primaryLocation.business_hours && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-3">Hours</h4>
                    <BusinessHours businessHours={primaryLocation.business_hours} />
                  </div>
                )}
                
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${primaryLocation.address_line1}, ${primaryLocation.city}, ${primaryLocation.state}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Get Directions
                </a>
              </div>
            </section>
          )}
          
          {/* Related Businesses */}
          {relatedBusinesses && relatedBusinesses.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Related Businesses</h3>
              <div className="space-y-3">
                {relatedBusinesses.slice(0, 3).map((related) => (
                  <Link
                    key={related.id}
                    href={`/businesses/${related.slug}`}
                    className="block group"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors mobile-touch-feedback">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {related.logo_url ? (
                          <Image
                            src={related.logo_url}
                            alt={related.name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                            {related.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 group-hover:text-red-600 transition-colors truncate">
                          {related.name}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {related.short_description || 'Local business'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Claim Business */}
          {!business.profile_id && (
            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-red-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m2 0h2M9 7h6m-6 4h6m-6 4h6" />
                </svg>
                <h3 className="text-lg font-bold text-red-900 mb-2">Own this business?</h3>
                <p className="text-red-800 mb-4 text-sm">
                  Claim your listing to manage reviews and reach more customers.
                </p>
                <Link 
                  href={`/businesses/${business.slug}/claim`}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                >
                  Claim Business
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* AI Assistant - Positioned correctly above mobile nav */}
      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-40">
        <BusinessAssistant business={{
          id: business.id,
          name: business.name,
          description: business.description,
          short_description: business.short_description,
          categories: business.categories?.map((c: BusinessCategory) => {
            const categoryData = getCategoryData(c.category)
            return categoryData?.name
          }).filter(Boolean) || [],
          locations: locations?.map(loc => ({
            address_line1: loc.address_line1,
            city: loc.city,
            state: loc.state
          })),
          business_contacts: contacts?.map(c => ({ type: c.type, value: c.value }))
        }} />
      </div>
      <SimplePageTracker entityType="business" entityId={business.slug} />
    </div>
  )
}