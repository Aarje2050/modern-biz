// src/app/search/page.tsx
import { createClient } from '@/lib/supabase/server'
import SearchInput from '@/components/search/search-input'
import FilterSidebar from '@/components/search/filter-sidebar'
import SearchResults from '@/components/search/search-results'
import Pagination from '@/components/ui/pagination'

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

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const query = searchParams.q
  const title = query 
    ? `Search results for "${query}" - Business Directory`
    : 'Search Businesses - Business Directory'
  
  return {
    title,
    description: 'Find businesses in our directory',
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = await createClient()
  const query = searchParams.q || null
  const categoryParam = searchParams.category
  const locationParam = searchParams.location
  const currentPage = searchParams.page ? parseInt(searchParams.page, 10) : 1
  
  // Get all categories for filter sidebar
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')
  
  // Build the search query
  let businessQuery = supabase
    .from('businesses')
    .select('id, name, slug, short_description, logo_url', { count: 'exact' })
    .eq('status', 'active')
  
  // Apply search filters
  if (query) {
    businessQuery = businessQuery.or(`name.ilike.%${query}%,short_description.ilike.%${query}%,description.ilike.%${query}%`)
  }
  
  // Apply category filter
  
    
    if (categoryParam) {
        const categorySlugs = categoryParam.split(',')
      
        // Step 1: Get category IDs from slugs
        const { data: categoriesData, error: catErr } = await supabase
          .from('categories')
          .select('id')
          .in('slug', categorySlugs)
      
        if (catErr || !categoriesData?.length) {
          console.error('Failed to fetch categories for filters', catErr)
        } else {
          const categoryIds = categoriesData.map(cat => cat.id)
      
          // Step 2: Get business IDs from business_categories
          const { data: businessCatData, error: bcErr } = await supabase
            .from('business_categories')
            .select('business_id')
            .in('category_id', categoryIds)
      
          if (bcErr || !businessCatData?.length) {
            console.error('Failed to fetch business_ids for category filter', bcErr)
          } else {
            const businessIds = businessCatData.map(bc => bc.business_id)
      
            // Step 3: Filter businesses using these IDs
            businessQuery = businessQuery.in('id', businessIds)
          }
        }
    }
      
  
  // Apply location filter
  if (locationParam) {
    const locationQuery = `%${locationParam}%`
    
    // Join with locations table
    businessQuery = businessQuery.or(
      `id.in.${
        supabase
          .from('locations')
          .select('business_id')
          .or(`city.ilike.${locationQuery},state.ilike.${locationQuery},postal_code.ilike.${locationQuery}`)
      }`
    )
  }
  
  // Apply pagination
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  
  businessQuery = businessQuery.range(from, to)
  
  // Execute the query
  const { data: businesses, count: totalBusinesses, error } = await businessQuery
    .order('name')
  
  // Calculate total pages
  const totalPages = Math.ceil((totalBusinesses || 0) / PAGE_SIZE)
  
  // Enhance results with location information
  const enhancedBusinesses = await Promise.all((businesses || []).map(async (business) => {
    // Get primary location for each business
    const { data: location } = await supabase
      .from('locations')
      .select('city, state')
      .eq('business_id', business.id)
      .eq('is_primary', true)
      .limit(1)
      .single()
    
    return {
      ...business,
      city: location?.city || undefined,
      state: location?.state || undefined
    }
  }))
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {query ? `Search Results for "${query}"` : 'Search Businesses'}
      </h1>
      
      <div className="mb-8">
        <SearchInput className="max-w-3xl mx-auto" />
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 lg:w-72">
          <div className="sticky top-6">
            <FilterSidebar categories={categories || []} />
          </div>
        </div>
        
        <div className="flex-1">
          <SearchResults 
            businesses={enhancedBusinesses} 
            query={query} 
            total={totalBusinesses || 0} 
          />
          
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      </div>
    </div>
  )
}