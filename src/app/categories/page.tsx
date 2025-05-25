// src/app/categories/page.tsx (SEO-Optimized with Pagination)
import { createClient } from '@/lib/supabase/server'
import { getCurrentSite } from '@/lib/site-context'
import Link from 'next/link'
import Image from 'next/image'
import Pagination from '@/components/ui/pagination'
import type { Metadata } from 'next'

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  businessCount: number
}

// SEO-friendly pagination
const PAGE_SIZE = 20 // Good for SEO - not too many, not too few

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
      title: 'Categories - Business Directory',
      description: 'Browse businesses by category',
    }
  }

  const niche = siteConfig.config?.niche || 'business'
  const location = siteConfig.config?.location || ''
  
  // SEO-optimized titles for pagination
  let title = `${niche.charAt(0).toUpperCase() + niche.slice(1)} Categories${location ? ` in ${location.charAt(0).toUpperCase() + location.slice(1)}` : ''}`
  if (currentPage > 1) {
    title += ` - Page ${currentPage}`
  }
  if (searchQuery) {
    title = `"${searchQuery}" Categories - ${title}`
  }
  title += ` - ${siteConfig.name}`
  
  const description = `Browse ${niche} services by category${location ? ` in ${location}` : ''}${searchQuery ? ` matching "${searchQuery}"` : ''}. Find the exact type of service you need.${currentPage > 1 ? ` Page ${currentPage}.` : ''}`

  return {
    title,
    description,
    keywords: `${niche} categories, ${location}, services, directory${searchQuery ? `, ${searchQuery}` : ''}`,
    openGraph: {
      title,
      description,
      url: `/categories${currentPage > 1 ? `?page=${currentPage}` : ''}`,
      siteName: siteConfig.name,
      type: 'website',
    },
    alternates: {
      canonical: `/categories${currentPage > 1 ? `?page=${currentPage}` : ''}`,
    },
    other: {
      // SEO pagination signals
      ...(currentPage > 1 && { 'robots': 'index, follow' }),
    }
  }
}

export const revalidate = 3600 // Cache for 1 hour - good for SEO

export default async function CategoriesPage({
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
  const location = siteConfig.config?.location || ''
  
  // Calculate pagination
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  
  // **OPTIMIZED QUERY 1: Get categories with pagination**
  let categoriesQuery = supabase
    .from('categories')
    .select('id, name, slug, description, icon', { count: 'exact' })
    .eq('site_id', siteConfig.id)
    .order('name')
    .range(from, to)
  
  // Apply search filter if provided
  if (searchQuery) {
    categoriesQuery = categoriesQuery.ilike('name', `%${searchQuery}%`)
  }
  
  const { data: categories, count: totalCategories } = await categoriesQuery
  
  // **OPTIMIZED QUERY 2: Bulk business count calculation (fixes N+1 problem)**
  let businessCounts: Record<string, number> = {}
  
  if (categories && categories.length > 0) {
    // Get all active business IDs for this site (single query)
    const { data: siteBusinesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('site_id', siteConfig.id)
      .eq('status', 'active')
    
    const siteBusinessIds = (siteBusinesses || []).map(b => b.id)
    
    if (siteBusinessIds.length > 0) {
      // Get business counts for all categories at once (single query)
      const categoryIds = categories.map(c => c.id)
      
      const { data: businessCategoryData } = await supabase
        .from('business_categories')
        .select('category_id')
        .in('category_id', categoryIds)
        .in('business_id', siteBusinessIds)
      
      // Count businesses per category
      businessCounts = (businessCategoryData || []).reduce((acc, item) => {
        acc[item.category_id] = (acc[item.category_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }
  
  // Combine categories with business counts
  const categoriesWithCount: Category[] = (categories || []).map(category => ({
    ...category,
    businessCount: businessCounts[category.id] || 0
  }))
  
  // Calculate total pages
  const totalPages = Math.ceil((totalCategories || 0) / PAGE_SIZE)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">
              Browse {niche.charAt(0).toUpperCase() + niche.slice(1)} Categories
              {location && (
                <span className="block text-2xl font-normal mt-2 text-red-100">
                  in {location.charAt(0).toUpperCase() + location.slice(1)}
                </span>
              )}
            </h1>
            <p className="text-xl text-red-100 mb-8">
              Find the exact type of {niche} service you need
            </p>
            
            {/* Search Categories */}
            <div className="max-w-2xl mx-auto">
              <form method="GET" action="/categories">
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    defaultValue={searchQuery}
                    placeholder={`Search ${niche} categories...`}
                    className="w-full px-6 py-4 text-gray-900 placeholder-gray-500 focus:outline-none text-lg rounded-lg"
                  />
                  {/* Preserve page on search (reset to 1) */}
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
                  {totalCategories} {totalCategories === 1 ? 'category' : 'categories'} found
                  {searchQuery && ` for "${searchQuery}"`}
                  {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {searchQuery && (
                  <Link
                    href="/categories"
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

          {/* Categories Grid */}
          {categoriesWithCount.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
                {categoriesWithCount.map((category) => (
                  <Link 
                    key={category.id} 
                    href={`/categories/${category.slug}`}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden group"
                  >
                    <div className="p-6 text-center">
                      {/* Icon */}
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 mb-4 mx-auto group-hover:bg-red-50 transition-colors">
                        {category.icon ? (
                          <Image 
                            src={category.icon}
                            alt={`${category.name} icon`}
                            width={32}
                            height={32}
                            className="object-contain"
                            loading="lazy" // SEO optimization
                          />
                        ) : (
                          <svg className="w-8 h-8 group-hover:text-red-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Category Name */}
                      <h2 className="text-lg font-semibold mb-2 group-hover:text-red-600 transition-colors">
                        {category.name}
                      </h2>
                      
                      {/* Business Count
                      <div className="text-sm text-gray-500 mb-3">
                        {category.businessCount} {category.businessCount === 1 ? 'service' : 'services'}
                      </div> */}
                      
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
                    baseUrl="/categories"
                    searchParams={searchParams}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchQuery ? `No categories found for "${searchQuery}"` : 'No categories available'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? 'Try searching with different keywords or browse all categories.'
                  : `Be the first to add a ${niche} service to create categories.`}
              </p>
              <div className="space-x-4">
                {searchQuery && (
                  <Link
                    href="/categories"
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

      {/* Pagination Preview Section (SEO benefit) */}
      {totalPages > 1 && (
        <section className="py-8 bg-white border-t">
          <div className="container mx-auto px-4">
            <div className="text-center text-sm text-gray-600">
              <p>
                Showing page {currentPage} of {totalPages} • 
                Total {totalCategories} categories • 
                {PAGE_SIZE} categories per page
              </p>
              
              {/* SEO breadcrumb-style navigation */}
              <div className="flex justify-center items-center space-x-2 mt-2">
                <Link href="/categories" className="text-red-600 hover:underline">
                  All Categories
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
}