// src/app/locations/[slug]/page.tsx - Single Location Page
import { createClient } from '@/lib/supabase/server'
import { getCurrentSite } from '@/lib/site-context'
import { locationMetadata } from '@/lib/seo/helpers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BusinessCard from '@/components/businesses/business-card'
import Pagination from '@/components/ui/pagination'
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

interface LocationData {
  city: string
  state: string
  slug: string
  businessCount: number
}

// Helper function to parse location slug
function parseLocationSlug(slug: string): { city: string; state: string } | null {
  // Handle formats like "toronto-on", "new-york-ny", "los-angeles-ca"
  const parts = slug.split('-')
  if (parts.length < 2) return null
  
  // Last part is state, everything else is city
  const state = parts[parts.length - 1]
  const city = parts.slice(0, -1).join(' ')
  
  return { city, state }
}

// Helper function to generate location slug (reverse of parse)
function generateLocationSlug(city: string, state: string): string {
  const cleanCity = city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const cleanState = state.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${cleanCity}-${cleanState}`
}

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const siteConfig = getCurrentSite()
  const supabase = createClient()
  
  if (!siteConfig) {
    return {
      title: 'Location Not Found',
      description: 'The location you are looking for could not be found.'
    }
  }
  
  // Parse location from slug
  const parsed = parseLocationSlug(params.slug)
  if (!parsed) {
    return {
      title: 'Invalid Location',
      description: 'The location format is invalid.'
    }
  }
  
  try {
    // Get businesses in this location for this site
    const { data: siteBusinesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('site_id', siteConfig.id)
      .eq('status', 'active')
    
    if (!siteBusinesses || siteBusinesses.length === 0) {
      return locationMetadata({
        city: parsed.city,
        state: parsed.state,
        slug: params.slug,
        businessCount: 0
      }, {
        niche: siteConfig.config?.niche || 'business',
        siteName: siteConfig.name
      })
    }
    
    const siteBusinessIds = siteBusinesses.map(b => b.id)
    
    // Get count of businesses in this location
    const { data: locationBusinesses } = await supabase
      .from('locations')
      .select('business_id')
      .in('business_id', siteBusinessIds)
      .ilike('city', parsed.city)
      .ilike('state', parsed.state)
    
    const businessCount = locationBusinesses?.length || 0
    
    return locationMetadata({
      city: parsed.city,
      state: parsed.state,
      slug: params.slug,
      businessCount
    }, {
      niche: siteConfig.config?.niche || 'business',
      siteName: siteConfig.name
    })
  } catch (error) {
    console.error('Location metadata generation error:', error)
    return {
      title: `${parsed.city}, ${parsed.state.toUpperCase()} - ${siteConfig.name}`,
      description: `Find services in ${parsed.city}, ${parsed.state.toUpperCase()}`
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
  
  // Parse location from slug
  const parsed = parseLocationSlug(params.slug)
  if (!parsed) {
    notFound()
  }
  
  const niche = siteConfig.config?.niche || 'business'
  
  try {
    // **STEP 1: Get all active businesses for this site**
    const { data: siteBusinesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('site_id', siteConfig.id)
      .eq('status', 'active')
    
    if (!siteBusinesses || siteBusinesses.length === 0) {
      notFound()
    }
    
    const siteBusinessIds = siteBusinesses.map(b => b.id)
    
    // **STEP 2: Get businesses in this location**
    const { data: locationBusinessIds } = await supabase
      .from('locations')
      .select('business_id')
      .in('business_id', siteBusinessIds)
      .ilike('city', parsed.city)
      .ilike('state', parsed.state)
    
    if (!locationBusinessIds || locationBusinessIds.length === 0) {
      notFound()
    }
    
    const businessIdsInLocation = locationBusinessIds.map(l => l.business_id)
    
    // **STEP 3: Get categories for filtering (only for this site)**
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('site_id', siteConfig.id)
      .order('name')
    
    // **STEP 4: Apply category filter if selected**
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
    
    if (filteredBusinessIds.length === 0) {
      // Show empty state but don't 404 - this is valid (no businesses in category + location combo)
    }
    
    // **STEP 5: Get business details with pagination**
    const from = (currentPage - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    
    let businessQuery = supabase
      .from('businesses')
      .select('id, name, slug, short_description, logo_url', { count: 'exact' })
      .in('id', filteredBusinessIds)
    
    // Apply sorting
    switch (sortOption) {
      case 'name_desc':
        businessQuery = businessQuery.order('name', { ascending: false })
        break
      case 'newest':
        businessQuery = businessQuery.order('created_at', { ascending: false })
        break
      case 'oldest':
        businessQuery = businessQuery.order('created_at', { ascending: true })
        break
      default: // name_asc
        businessQuery = businessQuery.order('name', { ascending: true })
        break
    }
    
    businessQuery = businessQuery.range(from, to)
    
    const { data: businesses, count: totalBusinesses } = await businessQuery
    
    // **STEP 6: Enhance businesses with location data**
    const enhancedBusinesses: BusinessWithLocation[] = await Promise.all(
      (businesses || []).map(async (business) => {
        // Get primary location for each business
        const { data: location } = await supabase
          .from('locations')
          .select('city, state')
          .eq('business_id', business.id)
          .eq('is_primary', true)
          .limit(1)
          .maybeSingle()
        
        return {
          ...business,
          city: location?.city || parsed.city,
          state: location?.state || parsed.state
        }
      })
    )
    
    // Calculate total pages
    const totalPages = Math.ceil((totalBusinesses || 0) / PAGE_SIZE)
    
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
                  {parsed.city}, {parsed.state.toUpperCase()}
                </span>
              </nav>
              
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">
                  {niche.charAt(0).toUpperCase() + niche.slice(1)} Services in {parsed.city}, {parsed.state.toUpperCase()}
                  {selectedCategoryData && (
                    <span className="block text-2xl font-normal mt-2 text-red-100">
                      {selectedCategoryData.name}
                    </span>
                  )}
                </h1>
                <p className="text-xl text-red-100 mb-6">
                  {selectedCategoryData 
                    ? `Find trusted ${selectedCategoryData.name.toLowerCase()} services in ${parsed.city}`
                    : `Discover verified ${niche} professionals in ${parsed.city}`}
                </p>
                
                {/* Filters */}
                <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4">
                  <form method="GET" className="flex-1 flex gap-4">
                    {/* Category Filter */}
                    <select 
                      name="category"
                      defaultValue={categoryFilter || ''}
                      className="flex-1 px-4 py-3 text-gray-900 focus:outline-none rounded-lg"
                      onChange={(e) => {
                        const form = e.target.form as HTMLFormElement
                        form.submit()
                      }}
                    >
                      <option value="">All Categories</option>
                      {categories?.map(category => (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    
                    {/* Sort Filter */}
                    <select 
                      name="sort"
                      defaultValue={sortOption}
                      className="px-4 py-3 text-gray-900 focus:outline-none rounded-lg"
                      onChange={(e) => {
                        const form = e.target.form as HTMLFormElement
                        form.submit()
                      }}
                    >
                      <option value="name_asc">Name A-Z</option>
                      <option value="name_desc">Name Z-A</option>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </form>
                </div>
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
                    in {parsed.city}, {parsed.state.toUpperCase()}
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
                    ? `No ${selectedCategoryData.name.toLowerCase()} services in ${parsed.city}`
                    : `No services found in ${parsed.city}`}
                </h3>
                <p className="text-gray-500 mb-6">
                  {selectedCategoryData 
                    ? `Try browsing all categories or check nearby locations.`
                    : `Be the first to list your ${niche} business in ${parsed.city}.`}
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
                Browse {niche.charAt(0).toUpperCase() + niche.slice(1)} Categories in {parsed.city}
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
                    {category.name} in {parsed.city}
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
                About {niche.charAt(0).toUpperCase() + niche.slice(1)} Services in {parsed.city}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {parsed.city} offers a variety of {niche} services to meet your needs. 
                Our directory features verified local businesses that provide quality services 
                with transparent pricing and customer reviews. Whether you're looking for 
                emergency services or scheduled appointments, you'll find trusted professionals 
                in {parsed.city}, {parsed.state.toUpperCase()}.
              </p>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Verified Businesses</h3>
                  <p className="text-sm text-gray-600">All listed businesses are verified for quality and reliability</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Local Service</h3>
                  <p className="text-sm text-gray-600">Connect with {niche} professionals in your area</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Quick Response</h3>
                  <p className="text-sm text-gray-600">Get fast quotes and service scheduling</p>
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