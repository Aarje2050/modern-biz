// src/app/locations/page.tsx (FIXED - Proper Location Data Fetching)
import { createClient } from '@/lib/supabase/server'
import { getCurrentSite } from '@/lib/site-context'
import Link from 'next/link'
import Pagination from '@/components/ui/pagination'
import { locationListingsMetadata } from '@/lib/seo/helpers'
import type { Metadata } from 'next'

interface Location {
  city: string
  state: string
  slug: string
  businessCount: number
}

// SEO-friendly pagination
const PAGE_SIZE = 20

// Helper function to generate location slug with robust Canadian province support
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

export async function generateMetadata({
  searchParams
}: {
  searchParams: { page?: string; search?: string }
}): Promise<Metadata> {
  const siteConfig = getCurrentSite()
  const currentPage = searchParams.page ? parseInt(searchParams.page, 10) : 1
  const searchQuery = searchParams.search || ''
  
  if (!siteConfig) {
    return {
      title: 'Locations - Business Directory',
      description: 'Browse businesses by location',
    }
  }

  const niche = siteConfig.config?.niche || 'business'
  const siteLocation = siteConfig.config?.location || ''
  
  return locationListingsMetadata({
    niche,
    siteName: siteConfig.name,
    siteLocation,
    page: currentPage > 1 ? currentPage : undefined,
    search: searchQuery || undefined
  })
}

export const revalidate = 3600 // Cache for 1 hour - good for SEO

export default async function LocationsPage({
  searchParams
}: {
  searchParams: { 
    page?: string
    search?: string 
  }
}) {
  const siteConfig = getCurrentSite()
  
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

  const supabase = createClient()
  const currentPage = searchParams.page ? parseInt(searchParams.page, 10) : 1
  const searchQuery = searchParams.search?.toLowerCase() || ''
  const niche = siteConfig.config?.niche || 'business'
  const siteLocation = siteConfig.config?.location || ''
  
  // Calculate pagination
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  
  try {
    // **CORRECTED APPROACH: Join businesses with locations to get site-aware data**
    const { data: businessLocations, error } = await supabase
      .from('businesses')
      .select(`
        id,
        site_id,
        locations!inner(
          city,
          state,
          is_active
        )
      `)
      .eq('site_id', siteConfig.id)
      .eq('status', 'active')
      .eq('locations.is_active', true)
      .not('locations.city', 'is', null)
      .not('locations.state', 'is', null)
    
    if (error) {
      console.error('Database error:', error)
      throw error
    }
    
    if (!businessLocations || businessLocations.length === 0) {
      // No businesses with locations, show empty state
      return (
        <div className="min-h-screen bg-gray-50">
          <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl font-bold mb-4">
                  Browse {niche.charAt(0).toUpperCase() + niche.slice(1)} Services by Location
                  {siteLocation && (
                    <span className="block text-2xl font-normal mt-2 text-red-100">
                      in {siteLocation.charAt(0).toUpperCase() + siteLocation.slice(1)}
                    </span>
                  )}
                </h1>
              </div>
            </div>
          </section>
          
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No locations available</h3>
                <p className="text-gray-500 mb-6">Be the first to add a business with location information.</p>
                <Link 
                  href="/businesses/add" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  Add Your Business
                </Link>
              </div>
            </div>
          </section>
        </div>
      )
    }
    
    // **STEP 2: Process unique locations and count businesses**
    const locationMap = new Map<string, { city: string; state: string; count: number; businessIds: Set<string> }>()
    
    businessLocations.forEach(business => {
      // Handle the case where locations might be an array or single object
      const locations = Array.isArray(business.locations) ? business.locations : [business.locations]
      
      locations.forEach(location => {
        if (location && location.city && location.state) {
          const key = `${location.city.toLowerCase()}-${location.state.toLowerCase()}`
          const existing = locationMap.get(key)
          
          if (existing) {
            // Only count unique businesses (in case business has multiple locations in same city)
            if (!existing.businessIds.has(business.id)) {
              existing.count += 1
              existing.businessIds.add(business.id)
            }
          } else {
            locationMap.set(key, {
              city: location.city,
              state: location.state,
              count: 1,
              businessIds: new Set([business.id])
            })
          }
        }
      })
    })
    
    // **STEP 3: Convert to array and sort**
    let allLocations: Location[] = Array.from(locationMap.entries()).map(([key, data]) => ({
      city: data.city,
      state: data.state,
      slug: generateLocationSlug(data.city, data.state),
      businessCount: data.count
    })).sort((a, b) => a.city.localeCompare(b.city))
    
    // **STEP 4: Apply search filter**
    if (searchQuery) {
      allLocations = allLocations.filter(location =>
        location.city.toLowerCase().includes(searchQuery) ||
        location.state.toLowerCase().includes(searchQuery)
      )
    }
    
    // **STEP 5: Apply pagination**
    const totalLocations = allLocations.length
    const paginatedLocations = allLocations.slice(from, from + PAGE_SIZE)
    const totalPages = Math.ceil(totalLocations / PAGE_SIZE)
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">
                Browse {niche.charAt(0).toUpperCase() + niche.slice(1)} Services by Location
                {siteLocation && (
                  <span className="block text-2xl font-normal mt-2 text-red-100">
                    in {siteLocation.charAt(0).toUpperCase() + siteLocation.slice(1)}
                  </span>
                )}
              </h1>
              <p className="text-xl text-red-100 mb-8">
                Find local {niche} services in your area
              </p>
              
              {/* Search Locations */}
              <div className="max-w-2xl mx-auto">
                <form method="GET" action="/locations">
                  <div className="relative">
                    <input
                      type="text"
                      name="search"
                      defaultValue={searchQuery}
                      placeholder="Search locations..."
                      className="w-full px-6 py-4 text-gray-900 placeholder-gray-500 focus:outline-none text-lg rounded-lg"
                    />
                    <input type="hidden" name="page" value="1" />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Results Summary & Actions */}
            <div className="mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-gray-600">
                    {totalLocations} {totalLocations === 1 ? 'location' : 'locations'} found
                    {searchQuery && ` for "${searchQuery}"`}
                    {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  {searchQuery && (
                    <Link
                      href="/locations"
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear search
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

            {/* Locations Grid */}
            {paginatedLocations.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
                  {paginatedLocations.map((location) => (
                    <Link 
                      key={location.slug} 
                      href={`/locations/${location.slug}`}
                      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden group"
                    >
                      <div className="p-6 text-center">
                        {/* Location Icon */}
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 mb-4 mx-auto group-hover:bg-red-50 transition-colors">
                          <svg className="w-8 h-8 group-hover:text-red-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        
                        {/* Location Name */}
                        <h2 className="text-lg font-semibold mb-2 group-hover:text-red-600 transition-colors">
                          {location.city}
                        </h2>
                        <p className="text-sm text-gray-500 mb-3">
                          {location.state}
                        </p>
                        
                        {/* Business Count */}
                        <div className="text-sm text-gray-500">
                          {location.businessCount} {location.businessCount === 1 ? 'service' : 'services'}
                        </div>
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="h-1 bg-gradient-to-r from-red-600 to-red-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
                    </Link>
                  ))}
                </div>
                
                {/* SEO-Optimized Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center">
                    <Pagination 
                      currentPage={currentPage} 
                      totalPages={totalPages}
                      baseUrl="/locations"
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
                  {searchQuery ? `No locations found for "${searchQuery}"` : 'No locations available'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery 
                    ? 'Try searching with different keywords or browse all locations.'
                    : `Be the first to add a ${niche} service to create locations.`}
                </p>
                <div className="space-x-4">
                  {searchQuery && (
                    <Link
                      href="/locations"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Browse All Locations
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

        {/* Pagination Preview Section (SEO benefit) */}
        {totalPages > 1 && (
          <section className="py-8 bg-white border-t">
            <div className="container mx-auto px-4">
              <div className="text-center text-sm text-gray-600">
                <p>
                  Showing page {currentPage} of {totalPages} • 
                  Total {totalLocations} locations • 
                  {PAGE_SIZE} locations per page
                </p>
                
                {/* SEO breadcrumb-style navigation */}
                <div className="flex justify-center items-center space-x-2 mt-2">
                  <Link href="/locations" className="text-red-600 hover:underline">
                    All Locations
                  </Link>
                  {currentPage > 1 && (
                    <>
                      <span>›</span>
                      <span>Page {currentPage}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    )
  } catch (error) {
    console.error('Locations page error:', error)
    
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">Service Locations</h1>
            </div>
          </div>
        </section>
        
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-2">Unable to load locations</h3>
              <p className="text-gray-500 mb-6">Please try again later.</p>
              <Link 
                href="/businesses/add" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                Add Your Business
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  }
}