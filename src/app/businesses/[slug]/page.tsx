// src/app/businesses/[slug]/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/formatting'
import ReviewForm from '@/components/reviews/review-form'
import { ShareButton, ReportButton } from '@/components/businesses/action-buttons'
import dynamic from 'next/dynamic';
import BusinessAssistant from '@/components/chat/business-assistant'
import BusinessActions from '@/components/businesses/business-actions'

// Business Hours Utility Functions
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

function getDayName(day: string): string {
  const dayMap: Record<string, string> = {
    'mon': 'Monday',
    'tue': 'Tuesday', 
    'wed': 'Wednesday',
    'thu': 'Thursday',
    'fri': 'Friday',
    'sat': 'Saturday',
    'sun': 'Sunday'
  };
  return dayMap[day] || day;
}

function getCurrentDayAbbr(): string {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[new Date().getDay()];
}

function isCurrentlyOpen(businessHours: any): { isOpen: boolean; nextChange: string | null } {
  if (!businessHours || !Array.isArray(businessHours)) {
    return { isOpen: false, nextChange: null };
  }

  const now = new Date();
  const currentDay = getCurrentDayAbbr();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const todayHours = businessHours.find(schedule => 
    schedule.days && schedule.days.includes(currentDay)
  );

  if (!todayHours || todayHours.status === 'closed' || !todayHours.hours || todayHours.hours.length === 0) {
    return { isOpen: false, nextChange: 'Opens tomorrow' };
  }

  for (const timeSlot of todayHours.hours) {
    if (timeSlot.from && timeSlot.to) {
      const [fromHour, fromMin] = timeSlot.from.split(':').map(Number);
      const [toHour, toMin] = timeSlot.to.split(':').map(Number);
      
      const openTime = fromHour * 60 + fromMin;
      const closeTime = toHour * 60 + toMin;
      
      if (currentTime >= openTime && currentTime < closeTime) {
        return { isOpen: true, nextChange: `Closes at ${formatTime(timeSlot.to)}` };
      }
    }
  }

  return { isOpen: false, nextChange: 'Closed today' };
}

// Business Hours Component
function BusinessHours({ businessHours }: { businessHours: any }) {
  if (!businessHours || !Array.isArray(businessHours)) {
    return (
      <div className="text-center py-6 text-slate-500">
        <p className="text-sm">Hours not available</p>
      </div>
    );
  }

  const { isOpen, nextChange } = isCurrentlyOpen(businessHours);
  const groupedHours: Array<{ days: string[]; hours: any[]; status: string }> = [];
  
  for (const schedule of businessHours) {
    if (schedule.days && Array.isArray(schedule.days)) {
      groupedHours.push(schedule);
    }
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-center p-3 rounded-lg ${
        isOpen 
          ? 'bg-emerald-50 border border-emerald-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className={`flex items-center ${isOpen ? 'text-emerald-700' : 'text-red-700'}`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="font-medium">
            {isOpen ? 'Open Now' : 'Closed'}
          </span>
          {nextChange && (
            <span className="text-sm ml-2 opacity-75">• {nextChange}</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {groupedHours.map((schedule, index) => {
          const dayNames = schedule.days.map(getDayName);
          const dayRange = dayNames.length > 2 ? `${dayNames[0]} - ${dayNames[dayNames.length - 1]}` : dayNames.join(', ');

          return (
            <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
              <span className="text-slate-700 font-medium text-sm">{dayRange}</span>
              <span className="text-slate-600 text-sm">
                {schedule.status === 'closed' || !schedule.hours || schedule.hours.length === 0 
                  ? 'Closed'
                  : schedule.hours.map((timeSlot: any) => (
                      timeSlot.from && timeSlot.to 
                        ? `${formatTime(timeSlot.from)} - ${formatTime(timeSlot.to)}`
                        : 'Closed'
                    )).join(', ')
                }
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ReviewList = dynamic(() => import('@/components/reviews/review-list'), {
  loading: () => <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
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

  // Define proper types for contacts and categories
  type BusinessContact = {
    type: string;
    value: string;
  }
  
  type Category = {
    name: string;
  }

  // Transform business data with proper typing
  const businessData = {
    id: business.id as string,
    name: business.name as string,
    description: business.description as string | undefined,
    short_description: business.short_description as string | undefined,
    // Map categories with proper typing
    categories: Array.isArray(business.categories) 
      ? business.categories.map((c: Category) => c.name) 
      : [],
    // Transform locations with proper typing
    locations: locations ? locations.map(loc => ({
      address_line1: loc.address_line1 as string,
      city: loc.city as string,
      state: loc.state as string
    })) : undefined,
    // Map business contacts with proper typing
    business_contacts: contacts 
      ? contacts.map((c: BusinessContact) => ({ 
          type: c.type, 
          value: c.value 
        })) 
      : undefined
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="relative h-72 md:h-96 lg:h-[28rem] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 overflow-hidden">
          {business.cover_url ? (
            <Image
              src={business.cover_url}
              alt={`${business.name} cover`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Hero Content */}
          <div className="relative h-full">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-8 md:pb-12">
              <div className="w-full">
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  {/* Business Logo */}
                  <div className="flex-shrink-0">
                    <div className="relative h-24 w-24 md:h-32 md:w-32 lg:h-36 lg:w-36 border-4 border-white rounded-2xl shadow-2xl overflow-hidden bg-white">
                      {business.logo_url ? (
                        <Image
                          src={business.logo_url}
                          alt={`${business.name} logo`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-bold text-2xl md:text-3xl">
                          {business.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Business Info */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                      {business.name}
                    </h1>
                    {business.short_description && (
                      <p className="text-lg md:text-xl text-white/90 mb-4 max-w-3xl leading-relaxed">
                        {business.short_description}
                      </p>
                    )}
                    
                    {/* Business Meta */}
                    <div className="flex flex-wrap items-center gap-4">
                      {business.verification_level !== 'none' && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
                          <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified {business.verification_level.replace('_', ' ')}
                        </span>
                      )}
                      {primaryLocation && (
                        <span className="inline-flex items-center text-white/90 text-sm font-medium">
                          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
            <Link
              href={`/businesses/${business.slug}`}
              className="border-b-2 border-blue-600 text-blue-600 whitespace-nowrap py-4 px-1 font-semibold text-sm"
            >
              Overview
            </Link>
            <Link
              href={`/businesses/${business.slug}/reviews`}
              className="border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            >
              Reviews
            </Link>
            {media && media.length > 0 && (
              <Link
                href={`/businesses/${business.slug}/photos`}
                className="border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
              >
                Photos ({media.length})
              </Link>
            )}
            {locations && locations.length > 0 && (
              <Link
                href={`/businesses/${business.slug}/locations`}
                className="border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
              >
                Locations {locations.length > 1 && `(${locations.length})`}
              </Link>
            )}
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <BusinessActions 
            businessId={business.id}
            businessSlug={business.slug}
            isSaved={isSaved}
            session={session}
            contactsByType={contactsByType}
            primaryLocation={primaryLocation}
          />
          
          {contactsByType.phone && (
            <a
              href={`tel:${contactsByType.phone}`}
              className="inline-flex items-center px-4 py-2.5 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium"
            >
              <svg className="h-5 w-5 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Now
            </a>
          )}
          
          {contactsByType.email && (
            <a
              href={`mailto:${contactsByType.email}`}
              className="inline-flex items-center px-4 py-2.5 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium"
            >
              <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
          )}
          
          
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">About {business.name}</h2>
              <div className="prose max-w-none text-slate-700 leading-relaxed">
                {business.description ? (
                  <p className="text-base">{business.description}</p>
                ) : (
                  <p className="text-slate-500 italic">No description provided yet.</p>
                )}
              </div>
              {business.established_year && (
                <div className="flex items-center mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg">
                    <svg className="h-5 w-5 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Established in {business.established_year}
                  </div>
                </div>
              )}
            </div>
            
            {/* Photo Gallery */}
            {media && media.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Photos</h2>
                  <Link 
                    href={`/businesses/${business.slug}/photos`} 
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                  >
                    View all {media.length} photos
                    <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {media.slice(0, 8).map((item) => (
                    <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer">
                      <Image
                        src={item.url}
                        alt={item.title || 'Business photo'}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Reviews Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Customer Reviews</h2>
                <Link 
                  href={`/businesses/${business.slug}/reviews`} 
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                >
                  See all reviews
                  <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              <ReviewList businessId={business.id} limit={3} />
              
              {session ? (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6">Write a Review</h3>
                  <ReviewForm businessId={business.id} />
                </div>
              ) : (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Share Your Experience</h3>
                    <p className="text-slate-600 mb-4">
                      Sign in to write a review and help others discover great businesses.
                    </p>
                    <Link
                      href={`/login?redirect_to=${encodeURIComponent(`/businesses/${params.slug}`)}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Sign In to Review
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Contact Information</h3>
              <div className="space-y-4">
                {contactsByType.phone && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-500 mb-1">Phone</div>
                      <a href={`tel:${contactsByType.phone}`} className="text-slate-900 font-medium hover:text-blue-600 transition-colors">
                        {contactsByType.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {contactsByType.email && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-500 mb-1">Email</div>
                      <a href={`mailto:${contactsByType.email}`} className="text-slate-900 font-medium hover:text-blue-600 transition-colors break-all">
                        {contactsByType.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {contactsByType.website && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-500 mb-1">Website</div>
                      <a 
                        href={contactsByType.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-slate-900 font-medium hover:text-blue-600 transition-colors break-all"
                      >
                        {contactsByType.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
                
                {Object.keys(contactsByType).length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    No contact information available
                  </div>
                )}
              </div>
            </div>
            
            {/* Location */}
            {primaryLocation && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Location</h3>
                <address className="not-italic mb-6 text-slate-700">
                  {primaryLocation.name && <div className="font-semibold mb-1">{primaryLocation.name}</div>}
                  <div>{primaryLocation.address_line1}</div>
                  {primaryLocation.address_line2 && <div>{primaryLocation.address_line2}</div>}
                  <div>{primaryLocation.city}, {primaryLocation.state} {primaryLocation.postal_code}</div>
                  <div>{primaryLocation.country}</div>
                </address>
                
                {/* Map Placeholder */}
                <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden mb-4 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm">Interactive map coming soon</p>
                  </div>
                </div>
                
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${primaryLocation.address_line1}, ${primaryLocation.city}, ${primaryLocation.state} ${primaryLocation.postal_code}`
                  )}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Get Directions
                </a>
                
                {locations && locations.length > 1 && (
                  <div className="mt-4 text-center">
                    <Link 
                      href={`/businesses/${business.slug}/locations`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all {locations.length} locations →
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {/* Business Hours */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Business Hours</h3>
              {primaryLocation?.business_hours ? (
                <BusinessHours businessHours={primaryLocation.business_hours} />
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">Hours not available</p>
                </div>
              )}
            </div>
            
            {/* Business Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Business Details</h3>
              <div className="space-y-4 text-sm">
                {/* <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600">Listed by</span>
                  <span className="font-medium">{profile?.full_name || 'Business Owner'}</span>
                </div> */}
                <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600">Listed on</span>
                  <span className="font-medium">{formatDate(business.created_at)}</span>
                </div>
                {business.verification_level !== 'none' && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-600">Verification</span>
                    <span className="inline-flex items-center text-emerald-600 font-medium">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {business.verification_level.replace('_', ' ').charAt(0).toUpperCase() + business.verification_level.replace('_', ' ').slice(1)}
                    </span>
                  </div>
                )}
                {business.established_year && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-600">Established</span>
                    <span className="font-medium">{business.established_year}</span>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row gap-3">
                  <ShareButton businessId={business.id} />
                  <ReportButton businessId={business.id} />
                </div>
              </div>
            </div>
            
            {/* Claim Business */}
            {!business.profile_id && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m2 0h2M9 7h6m-6 4h6m-6 4h6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-blue-900 mb-2">Own this business?</h3>
                    <p className="text-blue-800 mb-4 text-sm leading-relaxed">
                      Claim this listing to manage your business profile, respond to reviews, and reach more customers.
                    </p>
                    <Link 
                      href={`/businesses/${business.slug}/claim`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Claim This Business
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* AI Assistant */}
      <BusinessAssistant business={businessData} />
    </div>
  )
}