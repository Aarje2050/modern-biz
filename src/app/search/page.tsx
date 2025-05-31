// src/app/search/page.tsx (Site-Aware Implementation)
import { createClient } from '@/lib/supabase/server'
import { getCurrentSite } from '@/lib/site-context'
import SearchInput from '@/components/search/search-input'
import FilterSidebar from '@/components/search/filter-sidebar'
import SearchResults from '@/components/search/search-results'
import Pagination from '@/components/ui/pagination'
import SearchTracker from '@/components/search/simple-search-tracker'
import Link from 'next/link'
import type { Metadata } from 'next'

// Number of results per page
const PAGE_SIZE = 12

type SearchPageProps = {
  searchParams: { 
    q?: string 
    category?: string
    location?: string
    page?: string
  }
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const siteConfig = getCurrentSite()
  const query = searchParams.q
  const currentPage = searchParams.page ? parseInt(searchParams.page, 10) : 1
  
  if (!siteConfig) {
    return {
      title: query 
        ? `Search results for "${query}" - Business Directory`
        : 'Search Businesses - Business Directory',
      description: 'Find businesses in our directory',
    }
  }

  const niche = siteConfig.config?.niche || 'business'
  const location = siteConfig.config?.location || ''
  
  // SEO-optimized titles
  let title = `Search ${niche.charAt(0).toUpperCase() + niche.slice(1)} Services`
  if (location) {
    title += ` in ${location.charAt(0).toUpperCase() + location.slice(1)}`
  }
  if (query) {
    title = `"${query}" - ${title}`
  }
  if (currentPage > 1) {
    title += ` - Page ${currentPage}`
  }
  title += ` - ${siteConfig.name}`
  
  const description = `Search for ${niche} services${location ? ` in ${location}` : ''}${query ? ` matching "${query}"` : ''}. Find verified professionals, read reviews, and get quotes.${currentPage > 1 ? ` Page ${currentPage}.` : ''}`

  return {
    title,
    description,
    keywords: `${niche} search, ${location}, services, directory${query ? `, ${query}` : ''}`,
    openGraph: {
      title,
      description,
      url: `/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
      siteName: siteConfig.name,
      type: 'website',
    },
    alternates: {
      canonical: `/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    }
  }
}

export const revalidate = 300 // Cache for 5 minutes for search results

export default async function SearchPage({ searchParams }: SearchPageProps) {
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
  const query = searchParams.q || null
  const categoryParam = searchParams.category
  const locationParam = searchParams.location
  const currentPage = searchParams.page ? parseInt(searchParams.page, 10) : 1
  
  const niche = siteConfig.config?.niche || 'business'
  const siteLocation = siteConfig.config?.location || ''
  
  // **SITE-AWARE: Get categories only for this site**
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('site_id', siteConfig.id)
    .order('name')
  
  // **SITE-AWARE: Build the search query - only businesses from this site**
  let businessQuery = supabase
    .from('businesses')
    .select('id, name, slug, short_description, logo_url', { count: 'exact' })
    .eq('site_id', siteConfig.id) // Site-specific filter
    .eq('status', 'active')
  
  // Apply search filters
  if (query) {
    businessQuery = businessQuery.or(`name.ilike.%${query}%,short_description.ilike.%${query}%,description.ilike.%${query}%`)
  }
  
  // Apply category filter (only categories from this site)
  if (categoryParam && categories && categories.length > 0) {
    const categorySlugs = categoryParam.split(',')
  
    // Get category IDs from slugs (site-specific categories only)
    const matchingCategories = categories.filter(cat => categorySlugs.includes(cat.slug))
    
    if (matchingCategories.length > 0) {
      const categoryIds = matchingCategories.map(cat => cat.id)
  
      // Get business IDs from business_categories for these site-specific categories
      const { data: businessCatData, error: bcErr } = await supabase
        .from('business_categories')
        .select('business_id')
        .in('category_id', categoryIds)
  
      if (bcErr || !businessCatData?.length) {
        console.error('Failed to fetch business_ids for category filter', bcErr)
        // Force empty results if category filter fails
        businessQuery = businessQuery.eq('id', 'non-existent-id')
      } else {
        const businessIds = businessCatData.map(bc => bc.business_id)
        businessQuery = businessQuery.in('id', businessIds)
      }
    } else {
      // No matching categories in this site, force empty results
      businessQuery = businessQuery.eq('id', 'non-existent-id')
    }
  }
      
  // Apply location filter (enhanced to include site businesses only)
  if (locationParam) {
    const locationQuery = `%${locationParam}%`
    
    // First get all business IDs for this site
    const { data: siteBusinesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('site_id', siteConfig.id)
      .eq('status', 'active')
    
    const siteBusinessIds = (siteBusinesses || []).map(b => b.id)
    
    if (siteBusinessIds.length > 0) {
      // Get business IDs that match location criteria AND are in this site
      const { data: locationBusinesses } = await supabase
        .from('locations')
        .select('business_id')
        .in('business_id', siteBusinessIds) // Only check locations for site businesses
        .or(`city.ilike.${locationQuery},state.ilike.${locationQuery},postal_code.ilike.${locationQuery}`)
      
      if (locationBusinesses && locationBusinesses.length > 0) {
        const locationBusinessIds = locationBusinesses.map(lb => lb.business_id)
        businessQuery = businessQuery.in('id', locationBusinessIds)
      } else {
        // No locations match in this site, return empty results
        businessQuery = businessQuery.eq('id', 'non-existent-id')
      }
    } else {
      // No businesses in this site, return empty results
      businessQuery = businessQuery.eq('id', 'non-existent-id')
    }
  }
  
  // Apply pagination
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  
  businessQuery = businessQuery.range(from, to).order('name')
  
  // Execute the query
  const { data: businesses, count: totalBusinesses, error } = await businessQuery
  
  if (error) {
    console.error('Search query error:', error)
  }
  
  // Calculate total pages
  const totalPages = Math.ceil((totalBusinesses || 0) / PAGE_SIZE)
  
  // **OPTIMIZED: Enhance results with location information**
  const enhancedBusinesses = await Promise.all((businesses || []).map(async (business) => {
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
      city: location?.city || undefined,
      state: location?.state || undefined
    }
  }))
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add search tracking component */}
      <SearchTracker 
        query={query} 
        resultCount={totalBusinesses || 0}
      />
      
      {/* Header Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">
              {query ? (
                <>
                  Search Results for "{query}"
                  {siteLocation && (
                    <span className="block text-2xl font-normal mt-2 text-red-100">
                      in {siteLocation.charAt(0).toUpperCase() + siteLocation.slice(1)}
                    </span>
                  )}
                </>
              ) : (
                <>
                  Search {niche.charAt(0).toUpperCase() + niche.slice(1)} Services
                  {siteLocation && (
                    <span className="block text-2xl font-normal mt-2 text-red-100">
                      in {siteLocation.charAt(0).toUpperCase() + siteLocation.slice(1)}
                    </span>
                  )}
                </>
              )}
            </h1>
            <p className="text-xl text-red-100 mb-8">
              {query 
                ? `Find ${niche} services matching your search`
                : `Discover verified ${niche} professionals in your area`}
            </p>
            
            {/* Search Input */}
            <div className="max-w-3xl mx-auto">
              <SearchInput className="w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Results Summary */}
          <div className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-gray-600">
                  {totalBusinesses === 0 
                    ? 'No services found'
                    : `Found ${totalBusinesses} service${totalBusinesses === 1 ? '' : 's'}`
                  }
                  {query && ` for "${query}"`}
                  {categoryParam && ` in ${categoryParam.replace(',', ', ')}`}
                  {locationParam && ` near ${locationParam}`}
                  {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {(query || categoryParam || locationParam) && (
                  <Link
                    href="/search"
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

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter Sidebar */}
            <div className="w-full lg:w-64 xl:w-72">
              <div className="sticky top-6">
                <FilterSidebar categories={categories || []} />
              </div>
            </div>
            
            {/* Search Results */}
            <div className="flex-1">
              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-700">
                    There was an error performing your search. Please try again.
                  </p>
                </div>
              ) : (
                <>
                  {enhancedBusinesses.length > 0 ? (
                    <>
                      <SearchResults 
                        businesses={enhancedBusinesses} 
                        query={query} 
                        total={totalBusinesses || 0} 
                      />
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-8 flex justify-center">
                          <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages}
                            baseUrl="/search"
                            searchParams={searchParams}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                      <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        {query || categoryParam || locationParam
                          ? 'No services match your search'
                          : `No ${niche} services listed yet`}
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {query || categoryParam || locationParam
                          ? 'Try adjusting your search criteria or browse all services.'
                          : `Be the first to list your ${niche} business in our directory.`}
                      </p>
                      <div className="space-x-4">
                        {(query || categoryParam || locationParam) && (
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
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Section (if no search query) */}
      {!query && categories && categories.length > 0 && (
        <section className="py-12 bg-white border-t">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">
              Browse by Category
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {categories.slice(0, 10).map((category) => (
                <Link
                  key={category.id}
                  href={`/search?category=${category.slug}`}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 transition-colors"
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
  )
}