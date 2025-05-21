// src/app/businesses/page.tsx (modified version)
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import BusinessCard from '@/components/businesses/business-card'
import Pagination from '@/components/ui/pagination'
import BusinessFilters from '@/components/businesses/business-filters'

// Number of businesses per page
const PAGE_SIZE = 12

export const metadata = {
  title: 'Businesses - Business Directory',
  description: 'Browse businesses in our directory. Find local businesses, services, and more.',
  alternates: {
    canonical: '/businesses'
  },
  openGraph: {
    title: 'Business Directory - Browse All Businesses',
    description: 'Discover and connect with local businesses in our comprehensive directory.',
    url: '/businesses',
    siteName: 'Business Directory',
    type: 'website'
  }
}

type SortOption = 'name_asc' | 'name_desc' | 'newest' | 'oldest'

type BusinessWithLocation = {
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

export default async function BusinessesPage({
  searchParams
}: {
  searchParams: { page?: string; sort?: SortOption; category?: string }
}) {
  const supabase = await createClient()
  const currentPage = searchParams.page ? parseInt(searchParams.page, 10) : 1
  const sortOption = searchParams.sort || 'name_asc'
  const categorySlug = searchParams.category
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  // Get category if filter is applied
  let categoryFilter = null
  if (categorySlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('slug', categorySlug)
      .single()
      
    categoryFilter = category
  }
  
  // Get all categories for the filter
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')
  
  // Calculate pagination offsets
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  
  // Build the base query for businesses
  let businessQuery = supabase
    .from('businesses')
    .select('id, name, slug, short_description, logo_url', { count: 'exact' })
    .eq('status', 'active')
  
  // Apply category filter if selected
  if (categoryFilter) {
    // Use a subquery to filter by category
    businessQuery = businessQuery.filter('id', 'in', 
      supabase
        .from('business_categories')
        .select('business_id')
        .eq('category_id', categoryFilter.id)
    )
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
        .from('core.saved_businesses')
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Browse Businesses</h1>
      
      {/* Client-side filters component */}
      <BusinessFilters 
        categories={categories || []} 
        currentCategorySlug={categorySlug}
        currentSort={sortOption}
      />
      
      {/* Results summary */}
      <div className="mb-6">
        <p className="text-gray-600 text-sm">
          {totalBusinesses} {totalBusinesses === 1 ? 'business' : 'businesses'} found
          {categoryFilter ? ` in ${categoryFilter.name}` : ''}
        </p>
      </div>
      
      {/* Business Listings */}
      {enhancedBusinesses && enhancedBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enhancedBusinesses.map(business => (
            <BusinessCard 
              key={business.id} 
              business={business} 
              isSaved={business.isSaved} 
              savedId={business.savedId} 
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No businesses found</h3>
          <p className="mt-2 text-gray-500">
            {categoryFilter 
              ? `There are no businesses in the ${categoryFilter.name} category.`
              : 'There are no businesses in the directory yet.'}
          </p>
          <div className="mt-6">
            <Link 
              href="/businesses/add" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Add Your Business
            </Link>
          </div>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}
    </div>
  )
}