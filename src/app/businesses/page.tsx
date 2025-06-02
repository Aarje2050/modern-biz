// src/app/businesses/page.tsx - UPDATED WITH NEW SEO SYSTEM
import { createClient } from '@/lib/supabase/server'
import { getCurrentSite } from '@/lib/site-context'
import Link from 'next/link'
import Image from 'next/image'
import BusinessCard from '@/components/businesses/business-card'
import Pagination from '@/components/ui/pagination'
import { BreadcrumbSchema, ServerSchemaMarkup } from '@/components/seo/SchemaMarkup'
import { createSEOService } from '@/lib/seo/service'
import type { Metadata } from 'next'

// Number of businesses per page
const PAGE_SIZE = 12

type SortOption = 'name_asc' | 'name_desc' | 'newest' | 'oldest'

interface BusinessWithLocation {
  id: string
  name: string
  slug: string
  short_description: string | null
  logo_url: string | null
  city?: string
  state?: string
  isSaved?: boolean
  savedId?: string | null
}

interface Category {
  id: string
  name: string
  slug: string
}

// ENTERPRISE: Enhanced metadata generation using new SEO service
export async function generateMetadata({
  searchParams
}: {
  searchParams: { 
    page?: string
    sort?: SortOption
    category?: string
    search?: string
  }
}): Promise<Metadata> {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    return {
      title: 'Businesses - Business Directory',
      description: 'Browse businesses in our directory',
    }
  }

  // Create SEO service instance
  const seoService = createSEOService(siteConfig)
  if (!seoService) {
    return {
      title: 'Businesses',
      description: 'Browse businesses',
    }
  }

  // Get category info if filtering
  let categoryName = ''
  if (searchParams.category) {
    try {
      const supabase = createClient()
      const { data: category } = await supabase
        .from('categories')
        .select('name')
        .eq('slug', searchParams.category)
        .eq('site_id', siteConfig.id)
        .single()
      
      categoryName = category?.name || ''
    } catch (error) {
      console.error('Category lookup error:', error)
    }
  }

  // Use the enhanced SEO service with semantic patterns
  return seoService.generateBusinessListingMetadata({
    page: searchParams.page ? parseInt(searchParams.page, 10) : undefined,
    category: categoryName,
    search: searchParams.search,
    totalCount: undefined // Will be calculated dynamically if needed
  })
}

export const revalidate = 60

export default async function BusinessesPage({
  searchParams
}: {
  searchParams: { 
    page?: string
    sort?: SortOption
    category?: string
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
  const sortOption = searchParams.sort || 'name_asc'
  const categorySlug = searchParams.category
  const searchQuery = searchParams.search?.toLowerCase() || ''
  
  const niche = siteConfig.config?.niche || 'business'
  const location = siteConfig.config?.location || ''
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  // Get category if filter is applied (only from this site)
  let categoryFilter: Category | null = null
  if (categorySlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('slug', categorySlug)
      .eq('site_id', siteConfig.id)
      .single()
      
    categoryFilter = category
  }
  
  // Get all categories for this site for the filter
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('site_id', siteConfig.id)
    .order('name')
  
  // Calculate pagination offsets
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  
  // Build the base query for businesses (site-specific)
  let businessQuery = supabase
    .from('businesses')
    .select('id, name, slug, short_description, logo_url', { count: 'exact' })
    .eq('site_id', siteConfig.id)
    .eq('status', 'active')
  
  // Apply search filter if provided
  if (searchQuery) {
    businessQuery = businessQuery.or(`name.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`)
  }
  
  // Apply category filter if selected
  if (categoryFilter) {
    // Get business IDs in this category
    const { data: categoryBusinesses } = await supabase
      .from('business_categories')
      .select('business_id')
      .eq('category_id', categoryFilter.id)
    
    const businessIds = (categoryBusinesses || []).map(cb => cb.business_id)
    
    if (businessIds.length > 0) {
      businessQuery = businessQuery.in('id', businessIds)
    } else {
      // No businesses in this category, force empty result
      businessQuery = businessQuery.eq('id', 'non-existent-id')
    }
  }
  
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
  
  // Apply pagination
  businessQuery = businessQuery.range(from, to)
  
  // Execute the query
  const { data: businesses, count: totalBusinesses, error } = await businessQuery
  
  // Calculate total pages
  const totalPages = Math.ceil((totalBusinesses || 0) / PAGE_SIZE)
  
  // Enhance results with location information and saved status
  const enhancedBusinesses: BusinessWithLocation[] = await Promise.all((businesses || []).map(async (business) => {
    // Get primary location for each business
    const { data: location } = await supabase
      .from('locations')
      .select('city, state')
      .eq('business_id', business.id)
      .eq('is_primary', true)
      .limit(1)
      .maybeSingle()
    
    // Check if business is saved by current user (if logged in)
    let isSaved = false
    let savedId = null
    
    if (session) {
      const { data: savedBusiness } = await supabase
        .from('saved_businesses')
        .select('id')
        .eq('profile_id', session.user.id)
        .eq('business_id', business.id)
        .maybeSingle()
      
      isSaved = !!savedBusiness
      savedId = savedBusiness?.id
    }
    
    return {
      ...business,
      city: location?.city || undefined,
      state: location?.state || undefined,
      isSaved,
      savedId
    }
  }))

  // ENTERPRISE: Generate structured data
  const seoService = createSEOService(siteConfig)
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Businesses', url: '/businesses' }
  ]
  
  if (categoryFilter) {
    breadcrumbItems.push({
      name: categoryFilter.name,
      url: `/businesses?category=${categoryFilter.slug}`
    })
  }
  
  const structuredData = seoService?.generateSchema({
    breadcrumbs: breadcrumbItems,
    // Add collection schema for business listings
  }) || ''

  return (
    <>
      {/* ENTERPRISE: Add structured data */}
      {structuredData && (
        <ServerSchemaMarkup schemaJson={structuredData} id="businesses-page-schema" />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">
                Browse {niche.charAt(0).toUpperCase() + niche.slice(1)} Services
                {location && (
                  <span className="block text-2xl font-normal mt-2 text-red-100">
                    in {location.charAt(0).toUpperCase() + location.slice(1)}
                  </span>
                )}
              </h1>
              <p className="text-xl text-red-100 mb-8">
                {categoryFilter 
                  ? `Find ${categoryFilter.name.toLowerCase()} services near you`
                  : `Discover verified ${niche} professionals in your area`}
              </p>
              
              {/* Search and Filters */}
              <div className="max-w-4xl mx-auto space-y-4">
                {/* Search Box */}
                <form method="GET" action="/businesses" className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      name="search"
                      defaultValue={searchQuery}
                      placeholder={`Search ${niche} services...`}
                      className="w-full px-6 py-3 text-gray-900 placeholder-gray-500 focus:outline-none rounded-lg"
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <select 
                    name="category"
                    defaultValue={categorySlug || ''}
                    className="px-4 py-3 text-gray-900 focus:outline-none rounded-lg"
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
                  >
                    <option value="name_asc">Name A-Z</option>
                    <option value="name_desc">Name Z-A</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                  
                  {/* Hidden inputs to preserve other filters */}
                  {searchParams.page && <input type="hidden" name="page" value="1" />}
                  
                  <button
                    type="submit"
                    className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Search
                  </button>
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
                    {totalBusinesses} {totalBusinesses === 1 ? 'service' : 'services'} found
                    {categoryFilter && ` in ${categoryFilter.name}`}
                    {searchQuery && ` for "${searchQuery}"`}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  {(searchQuery || categoryFilter) && (
                    <Link
                      href="/businesses"
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
                    <BusinessCard 
                      key={business.id} 
                      business={business} 
                      isSaved={business.isSaved} 
                      savedId={business.savedId} 
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center">
                    <Pagination 
                      currentPage={currentPage} 
                      totalPages={totalPages}
                      baseUrl="/businesses"
                      searchParams={searchParams}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0h3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {searchQuery || categoryFilter 
                    ? 'No services match your search'
                    : `No ${niche} services listed yet`}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || categoryFilter 
                    ? 'Try adjusting your search criteria or browse all services.'
                    : `Be the first to list your ${niche} business in our directory.`}
                </p>
                <div className="space-x-4">
                  {(searchQuery || categoryFilter) && (
                    <Link
                      href="/businesses"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Browse All Services
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
                Browse by Category
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {categories.slice(0, 10).map((category) => (
                  <Link
                    key={category.id}
                    href={`/businesses?category=${category.slug}`}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      categorySlug === category.slug
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {category.name}
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
      </div>
    </>
  )
}