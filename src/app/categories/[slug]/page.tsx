// src/app/categories/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BusinessCard from '@/components/businesses/business-card'
import Pagination from '@/components/ui/pagination'

// Number of results per page
const PAGE_SIZE = 12

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  
  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', params.slug)
    .single()
    
  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The category you are looking for could not be found.'
    }
  }
  
  return {
    title: `${category.name} - Business Directory`,
    description: category.description || `Browse ${category.name} businesses in our directory`,
  }
}
export const revalidate = 600;
export default async function CategoryPage({ 
  params,
  searchParams
}: { 
  params: { slug: string }
  searchParams: { page?: string }
}) {
  const supabase = await createClient()
  const currentPage = searchParams.page ? parseInt(searchParams.page, 10) : 1
  
  // Get the category
  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .single()
  
  if (error || !category) {
    notFound()
  }
  
  // Calculate pagination
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  
  // Get businesses in this category
  const { data: businessIds, count: totalBusinesses } = await supabase
    .from('business_categories')
    .select('business_id', { count: 'exact' })
    .eq('category_id', category.id)
    .range(from, to)
  
  // Get business details
  const businesses = []
  
  if (businessIds && businessIds.length > 0) {
    for (const { business_id } of businessIds) {
      // Get business details
      const { data: business } = await supabase
        .from('businesses')
        .select('id, name, slug, short_description, logo_url')
        .eq('id', business_id)
        .eq('status', 'active')
        .single()
      
      if (business) {
        // Get primary location for each business
        const { data: location } = await supabase
          .from('locations')
          .select('city, state')
          .eq('business_id', business_id)
          .eq('is_primary', true)
          .limit(1)
          .single()
        
        businesses.push({
          ...business,
          city: location?.city || undefined,
          state: location?.state || undefined
        })
      }
    }
  }
  
  // Calculate total pages
  const totalPages = Math.ceil((totalBusinesses || 0) / PAGE_SIZE)
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/categories" className="text-blue-600 hover:underline text-sm">
          &larr; All Categories
        </Link>
        <h1 className="text-2xl font-bold mt-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600 mt-2">{category.description}</p>
        )}
      </div>
      
      {businesses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map(business => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
          
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No businesses found</h3>
          <p className="mt-2 text-gray-500">
            There are no active businesses in this category.
          </p>
        </div>
      )}
    </div>
  )
}