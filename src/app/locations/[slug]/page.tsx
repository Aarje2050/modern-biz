// src/app/locations/[slug]/page.tsx - ENTERPRISE SOLUTION: Database-driven slug resolution
import { createClient } from '@/lib/supabase/server'
import { getCurrentSite } from '@/lib/site-context'
import { locationMetadata } from '@/lib/seo/helpers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BusinessCard from '@/components/businesses/business-card'
import Pagination from '@/components/ui/pagination'
import LocationFilters from '@/components/locations/LocationFilters'
import type { Metadata } from 'next'

// Number of results per page
const PAGE_SIZE = 12

interface BusinessWithLocation {
  id: string
  name: string
  slug: string
  short_description: string | null
  logo_url: string | null
  city?: string
  state?: string
}

interface LocationMatch {
  city: string
  state: string
  slug: string
}

// ENTERPRISE: Simple, reliable slug generation (same as locations listing page)
function generateLocationSlug(city: string, state: string): string {
  const cleanCity = city.toLowerCase()
    .replace(/\bno\.\s*(\d+)/g, 'no-$1') // "No. 128" -> "no-128"
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  // Map full state names to URL-friendly versions (comprehensive)
  const stateMapping: Record<string, string> = {
    // Canadian provinces and territories
    'ontario': 'ontario',
    'quebec': 'quebec',
    'british columbia': 'british-columbia',
    'alberta': 'alberta', 
    'manitoba': 'manitoba',
    'saskatchewan': 'saskatchewan',
    'nova scotia': 'nova-scotia',
    'new brunswick': 'new-brunswick',
    'newfoundland and labrador': 'newfoundland-and-labrador',
    'prince edward island': 'prince-edward-island',
    'yukon': 'yukon',
    'northwest territories': 'northwest-territories',
    'nunavut': 'nunavut',
    // US states
    'california': 'california',
    'new york': 'new-york',
    'texas': 'texas',
    'florida': 'florida',
    'illinois': 'illinois',
    'pennsylvania': 'pennsylvania',
    'ohio': 'ohio',
    'georgia': 'georgia',
    'michigan': 'michigan',
    'north carolina': 'north-carolina'
  }
  
  const cleanState = stateMapping[state.toLowerCase()] || 
                     state.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  
  return `${cleanCity}-${cleanState}`
}

// ENTERPRISE: Find location by matching generated slug with database data
async function findLocationBySlug(slug: string, siteId: string): Promise<LocationMatch | null> {
  const supabase = createClient()
  
  try {
    // Get ALL unique locations for this site
    const { data: businessLocations } = await supabase
      .from('businesses')
      .select(`
        id,
        locations!inner(city, state, is_active)
      `)
      .eq('site_id', siteId)
      .eq('status', 'active')
      .eq('locations.is_active', true)
      .not('locations.city', 'is', null)
      .not('locations.state', 'is', null)
    
    if (!businessLocations) return null
    
    // Create unique location set
    const uniqueLocations = new Map<string, LocationMatch>()
    
    businessLocations.forEach(business => {
      const locations = Array.isArray(business.locations) ? business.locations : [business.locations]
      
      locations.forEach(location => {
        if (location?.city && location?.state) {
          const locationKey = `${location.city.toLowerCase()}-${location.state.toLowerCase()}`
          
          if (!uniqueLocations.has(locationKey)) {
            const generatedSlug = generateLocationSlug(location.city, location.state)
            
            uniqueLocations.set(locationKey, {
              city: location.city,
              state: location.state,
              slug: generatedSlug
            })
          }
        }
      })
    })
    
    // Find the location that matches our slug
    for (const location of uniqueLocations.values()) {
      if (location.slug === slug) {
        return location
      }
    }
    
    return null
  } catch (error) {
    console.error('Location lookup error:', error)
    return null
  }
}

// Helper function to generate SEO-optimized location content
function generateLocationContent(city: string, state: string, niche: string, businessCount: number) {
  const serviceTypes = {
    'duct-cleaning': {
      services: ['air duct cleaning', 'dryer vent cleaning', 'HVAC maintenance', 'indoor air quality testing'],
      benefits: ['improved air quality', 'energy efficiency', 'reduced allergens', 'better HVAC performance'],
      urgency: 'regular cleaning every 3-5 years'
    },
    'pet-stores': {
      services: ['pet supplies', 'grooming services', 'veterinary care', 'pet training'],
      benefits: ['healthy pets', 'expert care', 'quality products', 'professional guidance'],
      urgency: 'ongoing pet care needs'
    },
    'business': {
      services: ['professional services', 'consultation', 'maintenance', 'support'],
      benefits: ['reliable service', 'expert knowledge', 'quality results', 'customer satisfaction'],
      urgency: 'when you need professional help'
    }
  }
  
  const info = serviceTypes[niche as keyof typeof serviceTypes] || serviceTypes.business
  const locationKey = `${city}-${state}`.toLowerCase()
  
  // Generate varied content based on location characteristics
  const contentVariations = [
    `${city}, ${state} residents trust our directory to find reliable ${niche} professionals. With ${businessCount} verified local businesses, you'll discover ${info.services.join(', ')} services that prioritize ${info.benefits.join(' and ')}. Our listed professionals understand the unique needs of ${city} customers and provide ${info.urgency}.`,
    
    `Finding quality ${niche} services in ${city} has never been easier. Our comprehensive directory features ${businessCount} local businesses specializing in ${info.services.join(', ')}. Each listed company serves the ${city}, ${state} area with a commitment to ${info.benefits.join(', ')}, ensuring you receive professional service when you need it most.`,
    
    `${city}'s ${niche} industry offers exceptional service standards, and our directory connects you with the best local providers. Browse ${businessCount} verified businesses offering ${info.services.join(', ')} with transparent pricing and customer reviews. These ${city} professionals deliver ${info.benefits.join(', ')} to ensure complete customer satisfaction.`
  ]
  
  // Use a simple hash of the location to consistently pick the same variation
  const hash = locationKey.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const variationIndex = Math.abs(hash) % contentVariations.length
  return contentVariations[variationIndex]
}

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    return {
      title: 'Location Not Found',
      description: 'The location you are looking for could not be found.'
    }
  }
  
  // ENTERPRISE: Use database to resolve slug
  const locationMatch = await findLocationBySlug(params.slug, siteConfig.id)
  
  if (!locationMatch) {
    return {
      title: 'Location Not Found',
      description: 'The location you are looking for could not be found.'
    }
  }
  
  try {
    // Get business count for this location
    const supabase = createClient()
    
    const { data: businessesInLocation } = await supabase
      .from('businesses')
      .select(`
        id,
        locations!inner(city, state, is_active)
      `)
      .eq('site_id', siteConfig.id)
      .eq('status', 'active')
      .eq('locations.is_active', true)
      .ilike('locations.city', locationMatch.city)
      .ilike('locations.state', locationMatch.state)
    
    const businessCount = businessesInLocation?.length || 0
    
    return locationMetadata({
      city: locationMatch.city,
      state: locationMatch.state,
      slug: params.slug,
      businessCount
    }, {
      niche: siteConfig.config?.niche || 'business',
      siteName: siteConfig.name
    })
  } catch (error) {
    console.error('Location metadata generation error:', error)
    return {
      title: `${locationMatch.city}, ${locationMatch.state} - ${siteConfig.name}`,
      description: `Find services in ${locationMatch.city}, ${locationMatch.state}`
    }
  }
}

export const revalidate = 600

export default async function LocationPage({ 
  params,
  searchParams
}: { 
  params: { slug: string }
  searchParams: { page?: string; sort?: string; category?: string }
}) {
  const siteConfig = getCurrentSite()
  const supabase = createClient()
  const currentPage = searchParams.page ? parseInt(searchParams.page, 10) : 1
  const sortOption = searchParams.sort || 'name_asc'
  const categoryFilter = searchParams.category
  
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
  
  // ENTERPRISE: Use database to resolve slug
  const locationMatch = await findLocationBySlug(params.slug, siteConfig.id)
  
  if (!locationMatch) {
    notFound()
  }
  
  const niche = siteConfig.config?.niche || 'business'
  
  try {
    // **STEP 1: Get businesses in this location for this site**
    const { data: businessesInLocation, error: locationError } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        slug,
        short_description,
        logo_url,
        created_at,
        locations!inner(city, state, is_active)
      `)
      .eq('site_id', siteConfig.id)
      .eq('status', 'active')
      .eq('locations.is_active', true)
      .ilike('locations.city', locationMatch.city)
      .ilike('locations.state', locationMatch.state)
    
    if (locationError) {
      console.error('Location query error:', locationError)
      throw locationError
    }
    
    if (!businessesInLocation || businessesInLocation.length === 0) {
      notFound()
    }
    
    // Extract business IDs for category filtering
    const businessIdsInLocation = businessesInLocation.map(b => b.id)
    
    // **STEP 2: Get categories for filtering (only for this site)**
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('site_id', siteConfig.id)
      .order('name')
    
    // **STEP 3: Apply category filter if selected**
    let filteredBusinessIds = businessIdsInLocation
    
    if (categoryFilter && categories) {
      const selectedCategory = categories.find(c => c.slug === categoryFilter)
      if (selectedCategory) {
        // Get businesses in this category
        const { data: categoryBusinesses } = await supabase
          .from('business_categories')
          .select('business_id')
          .eq('category_id', selectedCategory.id)
          .in('business_id', businessIdsInLocation)
        
        filteredBusinessIds = categoryBusinesses?.map(cb => cb.business_id) || []
      }
    }
    
    // **STEP 4: Filter businesses based on category selection**
    let filteredBusinesses = businessesInLocation.filter(b => 
      filteredBusinessIds.includes(b.id)
    )
    
    // **STEP 5: Apply sorting**
    switch (sortOption) {
      case 'name_desc':
        filteredBusinesses.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'newest':
        filteredBusinesses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filteredBusinesses.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      default: // name_asc
        filteredBusinesses.sort((a, b) => a.name.localeCompare(b.name))
        break
    }
    
    // **STEP 6: Apply pagination**
    const totalBusinesses = filteredBusinesses.length
    const from = (currentPage - 1) * PAGE_SIZE
    const paginatedBusinesses = filteredBusinesses.slice(from, from + PAGE_SIZE)
    
    // **STEP 7: Transform to expected format**
    const enhancedBusinesses: BusinessWithLocation[] = paginatedBusinesses.map(business => {
      // Extract location data (locations is an array due to inner join)
      const locationData = Array.isArray(business.locations) ? business.locations[0] : business.locations
      
      return {
        id: business.id,
        name: business.name,
        slug: business.slug,
        short_description: business.short_description,
        logo_url: business.logo_url,
        city: locationData?.city || locationMatch.city,
        state: locationData?.state || locationMatch.state
      }
    })
    
    // Calculate total pages
    const totalPages = Math.ceil(totalBusinesses / PAGE_SIZE)
    
    // Find selected category data
    const selectedCategoryData = categories?.find(c => c.slug === categoryFilter)
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-2 text-sm text-red-100 mb-6">
                <Link href="/" className="hover:text-white">Home</Link>
                <span>›</span>
                <Link href="/locations" className="hover:text-white">Locations</Link>
                <span>›</span>
                <span className="text-white font-medium">
                  {locationMatch.city}, {locationMatch.state}
                </span>
              </nav>
              
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">
                  {niche.charAt(0).toUpperCase() + niche.slice(1)} Services in {locationMatch.city}, {locationMatch.state}
                  {selectedCategoryData && (
                    <span className="block text-2xl font-normal mt-2 text-red-100">
                      {selectedCategoryData.name}
                    </span>
                  )}
                </h1>
                <p className="text-xl text-red-100 mb-6">
                  {selectedCategoryData 
                    ? `Find trusted ${selectedCategoryData.name.toLowerCase()} services in ${locationMatch.city}`
                    : `Discover verified ${niche} professionals in ${locationMatch.city}`}
                </p>
                
                {/* Filters */}
                <LocationFilters
                  categories={categories || []}
                  currentCategory={categoryFilter}
                  currentSort={sortOption}
                  locationSlug={params.slug}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Results Summary */}
            <div className="mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-gray-600">
                    {totalBusinesses} {totalBusinesses === 1 ? 'service' : 'services'} found 
                    in {locationMatch.city}, {locationMatch.state}
                    {selectedCategoryData && ` for ${selectedCategoryData.name}`}
                    {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  {(selectedCategoryData || sortOption !== 'name_asc') && (
                    <Link
                      href={`/locations/${params.slug}`}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear filters
                    </Link>
                  )}
                  
                  <Link
                    href="/businesses/add"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Add Your Business
                  </Link>
                </div>
              </div>
            </div>

            {/* Business Listings */}
            {enhancedBusinesses && enhancedBusinesses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {enhancedBusinesses.map(business => (
                    <BusinessCard key={business.id} business={business} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center">
                    <Pagination 
                      currentPage={currentPage} 
                      totalPages={totalPages}
                      baseUrl={`/locations/${params.slug}`}
                      searchParams={searchParams}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {selectedCategoryData 
                    ? `No ${selectedCategoryData.name.toLowerCase()} services in ${locationMatch.city}`
                    : `No services found in ${locationMatch.city}`}
                </h3>
                <p className="text-gray-500 mb-6">
                  {selectedCategoryData 
                    ? `Try browsing all categories or check nearby locations.`
                    : `Be the first to list your ${niche} business in ${locationMatch.city}.`}
                </p>
                <div className="space-x-4">
                  {selectedCategoryData && (
                    <Link
                      href={`/locations/${params.slug}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Browse All Categories
                    </Link>
                  )}
                  <Link 
                    href="/businesses/add" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                  >
                    Add Your Business
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Quick Categories Section */}
        {categories && categories.length > 0 && (
          <section className="py-12 bg-white border-t">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-center mb-8">
                Browse {niche.charAt(0).toUpperCase() + niche.slice(1)} Categories in {locationMatch.city}
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {categories.slice(0, 10).map((category) => (
                  <Link
                    key={category.id}
                    href={`/locations/${params.slug}?category=${category.slug}`}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      categoryFilter === category.slug
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {category.name} in {locationMatch.city}
                  </Link>
                ))}
                {categories.length > 10 && (
                  <Link
                    href="/categories"
                    className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    View All Categories
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Location Info Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">
                About {niche.charAt(0).toUpperCase() + niche.slice(1)} Services in {locationMatch.city}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                {generateLocationContent(locationMatch.city, locationMatch.state, niche, totalBusinesses)}
              </p>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Verified Businesses</h3>
                  <p className="text-sm text-gray-600">All {locationMatch.city} businesses are verified for quality and reliability</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Local {locationMatch.city} Service</h3>
                  <p className="text-sm text-gray-600">Connect with trusted {niche} professionals in the {locationMatch.city} area</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Quick Response</h3>
                  <p className="text-sm text-gray-600">Fast quotes and service scheduling throughout {locationMatch.city}, {locationMatch.state}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  } catch (error) {
    console.error('Location page error:', error)
    notFound()
  }
}