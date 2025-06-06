// src/app/categories/[slug]/page.tsx - ENHANCED WITH SEO CONTENT
import { createClient } from '@/lib/supabase/server'
import { getCurrentSite } from '@/lib/site-context'
import { categoryMetadata } from '@/lib/seo/helpers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BusinessCard from '@/components/businesses/business-card'
import Pagination from '@/components/ui/pagination'

// Number of results per page
const PAGE_SIZE = 12

// Helper function to generate SEO-optimized category content
function generateCategoryContent(categoryName: string, niche: string, businessCount: number, siteLocation?: string) {
  const categoryEntities = {
    'air-duct-cleaning': {
      services: ['air duct cleaning', 'ductwork inspection', 'HVAC system cleaning', 'ventilation maintenance'],
      related: ['indoor air quality', 'allergen removal', 'energy efficiency', 'HVAC performance'],
      problems: ['dust accumulation', 'poor air circulation', 'increased energy costs', 'respiratory issues'],
      frequency: 'every 3-5 years or as recommended by HVAC professionals'
    },
    'dryer-vent-cleaning': {
      services: ['dryer vent cleaning', 'lint removal', 'exhaust system maintenance', 'fire prevention services'],
      related: ['fire safety', 'energy efficiency', 'appliance longevity', 'home safety'],
      problems: ['lint buildup', 'reduced drying efficiency', 'fire hazards', 'increased utility bills'],
      frequency: 'annually or when drying times increase significantly'
    },
    'hvac-maintenance': {
      services: ['HVAC maintenance', 'system tune-ups', 'filter replacement', 'preventive care'],
      related: ['system reliability', 'energy savings', 'comfort optimization', 'equipment longevity'],
      problems: ['system breakdowns', 'high energy bills', 'poor temperature control', 'costly repairs'],
      frequency: 'twice yearly - before heating and cooling seasons'
    },
    'pet-grooming': {
      services: ['pet grooming', 'nail trimming', 'bathing services', 'coat styling'],
      related: ['pet health', 'hygiene maintenance', 'professional care', 'animal comfort'],
      problems: ['matted fur', 'overgrown nails', 'skin issues', 'stress from home grooming'],
      frequency: 'every 4-8 weeks depending on breed and coat type'
    },
    'business': {
      services: ['professional services', 'expert consultation', 'quality solutions', 'reliable support'],
      related: ['customer satisfaction', 'professional standards', 'service excellence', 'trusted expertise'],
      problems: ['service quality concerns', 'unreliable providers', 'pricing transparency', 'scheduling difficulties'],
      frequency: 'as needed for your specific requirements'
    }
  }
  
  const categoryKey = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const info = categoryEntities[categoryKey as keyof typeof categoryEntities] || categoryEntities.business
  const locationText = siteLocation ? ` in ${siteLocation}` : ''
  
  // Generate varied content to avoid duplication
  const contentVariations = [
    {
      para1: `${categoryName} services${locationText} require specialized expertise and professional equipment to deliver optimal results. Our directory features ${businessCount} verified providers specializing in ${info.services.join(', ')}, ensuring you receive quality service that addresses ${info.problems.join(', ')}. These professionals understand the importance of ${info.related.join(' and ')} for your specific needs.`,
      para2: `When selecting ${categoryName.toLowerCase()} services${locationText}, it's essential to choose experienced professionals who prioritize ${info.related.join(', ')}. Our listed providers offer comprehensive solutions including ${info.services.join(', ')}, with most experts recommending service ${info.frequency}. Each business in our directory maintains high standards and transparent pricing to ensure customer satisfaction.`
    },
    {
      para1: `Professional ${categoryName.toLowerCase()} services${locationText} play a crucial role in maintaining ${info.related.join(', ')}. With ${businessCount} trusted local providers, you can find specialists who offer ${info.services.join(', ')} using industry-leading techniques. These experts help prevent common issues such as ${info.problems.join(', ')} through regular maintenance and professional care.`,
      para2: `Our ${categoryName.toLowerCase()} directory${locationText} connects you with qualified professionals who understand the unique challenges of ${info.problems.join(', ')}. These service providers offer comprehensive solutions including ${info.services.join(', ')}, with recommendations for service ${info.frequency}. Each listed business is committed to delivering exceptional results and maintaining the highest industry standards.`
    },
    {
      para1: `Quality ${categoryName.toLowerCase()} services${locationText} ensure optimal ${info.related.join(', ')} through professional expertise and proven methods. Our curated directory of ${businessCount} local businesses specializes in ${info.services.join(', ')}, helping customers avoid costly problems like ${info.problems.join(', ')}. These professionals bring years of experience and specialized knowledge to every project.`,
      para2: `Finding reliable ${categoryName.toLowerCase()} services${locationText} is essential for maintaining ${info.related.join(' and ')}. Our directory features experienced providers offering ${info.services.join(', ')}, with most professionals recommending service ${info.frequency}. Each business maintains rigorous quality standards and provides transparent communication throughout the service process.`
    }
  ]
  
  // Use category name to consistently pick the same variation
  const hash = categoryKey.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const variationIndex = Math.abs(hash) % contentVariations.length
  return contentVariations[variationIndex]
}

// Enhanced generateMetadata
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const siteConfig = getCurrentSite()
  const supabase = createClient()
  
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, description')
    .eq('slug', params.slug)
    .eq('site_id', siteConfig?.id)
    .single()
    
  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The category you are looking for could not be found.'
    }
  }
  
  // Get business count for this category
  const { count: businessCount } = await supabase
    .from('business_categories')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', category.id)
  
  // Use your existing categoryMetadata function
  return categoryMetadata({
    name: category.name,
    slug: params.slug,
    description: category.description,
    businessCount: businessCount || 0
  })
}

export const revalidate = 600

export default async function CategoryPage({ 
  params,
  searchParams
}: { 
  params: { slug: string }
  searchParams: { page?: string }
}) {
  const siteConfig = getCurrentSite()
  const supabase = createClient()
  const currentPage = searchParams.page ? parseInt(searchParams.page, 10) : 1
  const niche = siteConfig?.config?.niche || 'business'
  
  // Get the category
  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .eq('site_id', siteConfig?.id)
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
        .eq('site_id', siteConfig?.id)
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
  
  // Generate SEO content
  const siteLocation = siteConfig?.config?.location
  const categoryContent = generateCategoryContent(category.name, niche, totalBusinesses || 0, siteLocation)
  
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
              <Link href="/categories" className="hover:text-white">Categories</Link>
              <span>›</span>
              <span className="text-white font-medium">{category.name}</span>
            </nav>
            
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">
                {category.name} Services{siteLocation && (
                  <span className="block text-2xl font-normal mt-2 text-red-100">
                    in {siteLocation.charAt(0).toUpperCase() + siteLocation.slice(1)}
                  </span>
                )}
              </h1>
              {/* {category.description && (
                <p className="text-xl text-red-100 mb-6">
                  {category.description}
                </p>
              )} */}
              <div className="flex items-center justify-center space-x-6 text-red-100">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {totalBusinesses || 0} Verified Providers
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Top Rated Services
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Listings */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {businesses.length > 0 ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Browse {category.name} Providers{siteLocation && ` in ${siteLocation}`}
                </h2>
                <p className="text-gray-600">
                  {totalBusinesses} professional {category.name.toLowerCase()} {totalBusinesses === 1 ? 'service' : 'services'} available
                  {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {businesses.map(business => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages}
                    baseUrl={`/categories/${params.slug}`}
                    searchParams={searchParams}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No {category.name.toLowerCase()} services found</h3>
              <p className="text-gray-500 mb-6">
                Be the first to list your {category.name.toLowerCase()} business in our directory.
              </p>
              <Link 
                href="/businesses/add" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                Add Your Business
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Category Information Section - SEO Content */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              About {category.name} Services{siteLocation && ` in ${siteLocation}`}
            </h2>
            
            <div className="prose max-w-none text-gray-700 space-y-4">
              <p className="text-lg leading-relaxed">
                {categoryContent.para1}
              </p>
              <p className="text-lg leading-relaxed">
                {categoryContent.para2}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Why Choose Our {category.name} Directory?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Verified Providers</h3>
                <p className="text-sm text-gray-600">All {category.name.toLowerCase()} businesses are thoroughly verified for quality and reliability</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Customer Reviews</h3>
                <p className="text-sm text-gray-600">Real customer feedback helps you choose the best {category.name.toLowerCase()} service provider</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Quick Response</h3>
                <p className="text-sm text-gray-600">Get fast quotes and scheduling for your {category.name.toLowerCase()} service needs</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Local Expertise</h3>
                <p className="text-sm text-gray-600">Connect with {category.name.toLowerCase()} professionals who understand your local needs</p>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Link
                href="/businesses/add"
                className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                List Your {category.name} Business
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}