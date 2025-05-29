// src/app/page.tsx (ENTERPRISE FIX)
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSite } from '@/lib/site-context'
import SearchInput from '@/components/search/search-input'
import type { Metadata } from 'next'
import TemplatePageServer from '@/components/template/TemplatePageServer'

// CRITICAL: Force dynamic rendering to prevent build-time site context access
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Business {
  id: string
  name: string
  slug: string
  short_description?: string | null
  logo_url?: string | null
  site_id?: string | null
}

interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
}

// ENTERPRISE: Simplified metadata generation (no site context during build)
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Business Directory - Find Local Businesses & Services',
    description: 'Discover and connect with local businesses in your area.',
    keywords: 'business directory, local services, reviews, business listings',
    openGraph: {
      title: 'Business Directory - Find Local Businesses & Services',
      description: 'Discover and connect with local businesses in your area.',
      type: 'website',
    },
  }
}

function getNicheContent(niche: string, location: string) {
  const content: Record<string, any> = {
    'duct-cleaning': {
      title: 'Find Professional Duct Cleaning Services',
      subtitle: 'Get quotes from certified HVAC professionals for air duct and dryer vent cleaning',
      placeholder: 'Search for duct cleaning services...',
      popular: ['Air Duct Cleaning', 'Dryer Vent Cleaning', 'HVAC Maintenance', 'Indoor Air Quality Testing']
    },
    'pet-stores': {
      title: 'Find Pet Stores & Services',
      subtitle: 'Everything your pets need in one place',
      placeholder: 'Search for pet stores and services...',
      popular: ['Pet Grooming', 'Veterinary Care', 'Pet Supplies', 'Dog Training']
    },
    'ivf-centers': {
      title: 'Find Fertility Centers',
      subtitle: 'Connect with trusted fertility specialists',
      placeholder: 'Search for fertility centers...',
      popular: ['IVF Treatment', 'Fertility Testing', 'Egg Freezing', 'Genetic Counseling']
    }
  }

  return content[niche] || {
    title: 'Find Local Businesses',
    subtitle: 'Discover and connect with businesses near you',
    placeholder: 'Search for businesses...',
    popular: ['Restaurants', 'Shopping', 'Services', 'Healthcare']
  }
}

// ENTERPRISE: Separate server component for directory homepage
async function DirectoryHomePage() {
  // CRITICAL: Get site context at runtime, not build time
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Site Not Found</h1>
          <p className="text-gray-600">This domain is not configured in our system. Contact Rajesh</p>
        </div>
      </div>
    )
  }
  
  const niche = siteConfig.config?.niche || 'business'
  const location = siteConfig.config?.location || ''
  const content = getNicheContent(niche, location)
  
  const supabase = createClient()
  
  // ENTERPRISE: Proper error handling for database queries
  let topCategories: Category[] = []
  let recentBusinesses: Business[] = []
  let totalBusinesses = 0
  
  try {
    // Get categories for this site only
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug, icon')
      .eq('site_id', siteConfig.id)
      .limit(8)
    
    if (!categoriesError && categoriesData) {
      topCategories = categoriesData
    }
    
    // Get recent businesses for this site only
    const { data: businessesData, error: businessesError } = await supabase
      .from('businesses')
      .select('id, name, slug, short_description, logo_url, site_id')
      .eq('site_id', siteConfig.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(4)
    
    if (!businessesError && businessesData) {
      recentBusinesses = businessesData
    }
    
    // Get total count for this site only
    const { count, error: countError } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteConfig.id)
      .eq('status', 'active')
    
    if (!countError && count !== null) {
      totalBusinesses = count
    }
  } catch (error) {
    console.error('Database query error:', error)
    // Continue with empty data - graceful degradation
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile App-Style Hero Section */}
      <section className="bg-gradient-to-br from-red-600 via-red-600 to-red-700 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black bg-opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-8 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl md:text-5xl font-bold mb-3 md:mb-6 leading-tight">
              {content.title}
              {location && (
                <span className="block text-lg md:text-3xl font-normal mt-1 md:mt-2 text-red-100 opacity-90">
                  in {location.charAt(0).toUpperCase() + location.slice(1)}
                </span>
              )}
            </h1>
            
            <p className="text-sm md:text-xl mb-6 md:mb-8 text-red-100 leading-relaxed px-2">
              {content.subtitle}
            </p>
            
            <div className="mb-6 md:mb-8 px-2">
              <SearchInput 
                placeholder={content.placeholder}
                className="w-full max-w-2xl mx-auto"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2 md:gap-3 px-2">
              {content.popular.map((service: string, index: number) => (
                <Link
                  key={index}
                  href={`/search?q=${encodeURIComponent(service)}`}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all backdrop-blur-sm"
                >
                  {service}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-4 md:py-6 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center space-x-6 md:space-x-8 text-center">
            <div className="flex flex-col">
              <div className="text-lg md:text-2xl font-bold text-gray-900">{totalBusinesses}</div>
              <div className="text-xs md:text-sm text-gray-600">Local Services</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div className="flex flex-col">
              <div className="text-lg md:text-2xl font-bold text-gray-900">100%</div>
              <div className="text-xs md:text-sm text-gray-600">Verified</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div className="flex flex-col">
              <div className="text-lg md:text-2xl font-bold text-gray-900">24/7</div>
              <div className="text-xs md:text-sm text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-6 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">
              Browse Categories
            </h2>
            <Link
              href="/categories"
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              View All
            </Link>
          </div>
          
          {topCategories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {topCategories.map((category: Category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group bg-gray-50 hover:bg-red-50 rounded-xl p-4 md:p-6 text-center transition-all duration-200 border border-transparent hover:border-red-100"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white group-hover:bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 shadow-sm transition-colors">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-600 group-hover:text-red-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 group-hover:text-red-600 transition-colors leading-tight">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
              <p className="text-gray-600 mb-4">Add the first business to create categories</p>
              <Link
                href="/businesses/add"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Add Business
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recent Businesses */}
      {recentBusinesses.length > 0 && (
        <section className="py-6 md:py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4 md:mb-8">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">
                Recent Services
              </h2>
              <Link
                href="/businesses"
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:space-y-0">
              {recentBusinesses.map((business: Business) => (
                <Link
                  key={business.id}
                  href={`/businesses/${business.slug}`}
                  className="block bg-white rounded-lg border hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="flex md:block">
                    <div className="w-16 h-16 md:w-full md:h-32 bg-gray-200 relative flex-shrink-0">
                      {business.logo_url ? (
                        <Image
                          src={business.logo_url}
                          alt={business.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm md:text-lg font-bold">
                          {business.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 p-3 md:p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base line-clamp-1">
                        {business.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                        {business.short_description || 'Professional service provider'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-6 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-lg md:text-2xl font-bold text-center mb-6 md:mb-8 text-gray-900">
            Why Choose {siteConfig.name}?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: '🔍', title: 'Easy Search', desc: 'Find services quickly' },
              { icon: '⭐', title: 'Verified Reviews', desc: 'Real customer feedback' },
              { icon: '📞', title: 'Direct Contact', desc: 'Connect instantly' },
              { icon: '🚀', title: 'Fast Service', desc: 'Quick responses' }
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl mb-2 md:mb-3">{benefit.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">
                  {benefit.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-600">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 md:py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-4">
            List Your {niche.charAt(0).toUpperCase() + niche.slice(1)} Business
          </h2>
          <p className="text-sm md:text-lg text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto">
            Join {siteConfig.name} and connect with customers{location ? ` in ${location}` : ''}
          </p>
          <Link
            href="/businesses/add"
            className="inline-flex items-center px-6 py-3 md:px-8 md:py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm md:text-base"
          >
            Get Started Today
            <svg className="w-4 h-4 md:w-5 md:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}

// ENTERPRISE: Template-aware homepage with proper error boundaries
export default async function HomePage() {
  try {
    const siteConfig = getCurrentSite()
    
    // For directory sites or no site config, use the directory homepage
    if (!siteConfig || siteConfig.site_type === 'directory' || siteConfig.template === 'directory-modern') {
      return <DirectoryHomePage />
    }
    
    // For other site types, use the template system
    return <TemplatePageServer siteConfig={siteConfig} fallback={<DirectoryHomePage />} />
  } catch (error) {
    console.error('HomePage error:', error)
    // Graceful fallback
    return <DirectoryHomePage />
  }
}