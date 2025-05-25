// src/app/page.tsx (Simple Working Version)
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSite } from '@/lib/site-context'
import { headers } from 'next/headers'
import type { Metadata } from 'next'

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


  

import SearchInput from '@/components/search/search-input'

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    return {
      title: 'Business Directory - Find Local Businesses & Services',
      description: 'Discover and connect with local businesses in your area.',
    }
  }

  const { config } = siteConfig
  const niche = config?.niche || 'business'
  const location = config?.location || ''
  
  const title = `${siteConfig.name} - Find Top ${niche.charAt(0).toUpperCase() + niche.slice(1)} Services${location ? ` in ${location.charAt(0).toUpperCase() + location.slice(1)}` : ''}`
  const description = `Discover top-rated ${niche} services${location ? ` in ${location}` : ''}. Read reviews, compare prices, and book online.`

  return {
    title,
    description,
    keywords: `${niche}, ${location}, directory, reviews, services, local business`,
    openGraph: {
      title,
      description,
      url: '/',
      siteName: siteConfig.name,
      type: 'website',
    },
    alternates: {
      canonical: '/',
    }
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

export default async function Home() {
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
  
  const niche = siteConfig.config?.niche || 'business'
  const location = siteConfig.config?.location || ''
  const content = getNicheContent(niche, location)
  
 
  
  // Use standard Supabase client with explicit site filtering
  const supabase = createClient()
  
  // Get categories for this site only
  const { data: topCategories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .eq('site_id', siteConfig.id)
    .limit(8)
  

  
  // Get recent businesses for this site only
  const { data: recentBusinesses, error: businessesError } = await supabase
    .from('businesses')
    .select('id, name, slug, short_description, logo_url, site_id')
    .eq('site_id', siteConfig.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(4)
  
  
  // Get total count for this site only
  const { count: totalBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteConfig.id)
    .eq('status', 'active')


  return (
    <div className="min-h-screen bg-white">

      {/* Clean Hero Section */}
      <section className="bg-gradient-to-b from-red-600 to-red-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">
              {content.title}
              {location && (
                <span className="block text-3xl font-normal mt-2 text-red-100">
                  in {location.charAt(0).toUpperCase() + location.slice(1)}
                </span>
              )}
            </h1>
            <p className="text-xl mb-8 text-red-100">{content.subtitle}</p>
            
            <div className="max-w-2xl mx-auto mb-8">
              <SearchInput placeholder={content.placeholder} />
            </div>

            {/* Popular Services */}
            <div className="flex flex-wrap justify-center gap-3">
              {content.popular.map((service: string, index: number) => (
                <Link
                  key={index}
                  href={`/search?q=${encodeURIComponent(service)}`}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-full text-sm font-medium transition-all"
                >
                  {service}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-50 py-6 border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center space-x-8 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalBusinesses || 0}</div>
              <div className="text-sm text-gray-600">Local {niche} services</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">100%</div>
              <div className="text-sm text-gray-600">Verified listings</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">24/7</div>
              <div className="text-sm text-gray-600">Customer support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Browse {niche.charAt(0).toUpperCase() + niche.slice(1)} Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {topCategories && topCategories.length > 0 ? (
              topCategories.map((category: Category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group p-6 bg-white border rounded-lg hover:shadow-md transition-shadow text-center"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-red-50">
                    <svg className="w-6 h-6 text-gray-600 group-hover:text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-red-600">{category.name}</h3>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No categories found for this site.</p>
                <Link href="/businesses/add" className="text-blue-600 hover:underline mt-2 inline-block">
                  Add the first business
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recent Businesses */}
      {recentBusinesses && recentBusinesses.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Recently Added {niche.charAt(0).toUpperCase() + niche.slice(1)} Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {recentBusinesses.map((business: Business) => (
                <Link
                  key={business.id}
                  href={`/businesses/${business.slug}`}
                  className="bg-white rounded-lg border hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="h-32 bg-gray-200 relative">
                    {business.logo_url ? (
                      <Image
                        src={business.logo_url}
                        alt={business.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg font-bold">
                        {business.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{business.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {business.short_description || 'Professional service provider'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Simple CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">List Your {niche.charAt(0).toUpperCase() + niche.slice(1)} Business</h2>
          <p className="text-gray-300 mb-8">Join {siteConfig.name} and connect with customers</p>
          <Link
            href="/businesses/add"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  )
}