// src/app/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SearchInput from '@/components/search/search-input'

export const metadata = {
  title: 'Business Directory - Find Local Businesses & Services',
  description: 'Discover and connect with local businesses in your area. Find services, read reviews, and get in touch with businesses near you.',
  openGraph: {
    title: 'Business Directory - Find Local Businesses & Services',
    description: 'Discover and connect with local businesses in your area.',
    url: '/',
    siteName: 'Business Directory',
    type: 'website'
  }
}

export default async function Home() {
  const supabase = await createClient()
  
  // Get featured categories
  const { data: featuredCategories } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .eq('is_featured', true)
    .order('name')
    .limit(6)
  
  // Get business counts for featured categories
  const categoriesWithCount = await Promise.all((featuredCategories || []).map(async (category) => {
    const { count } = await supabase
      .from('business_categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id)
    
    return {
      ...category,
      businessCount: count || 0
    }
  }))
  
  // Get featured/popular businesses (those with logos, for better display)
  const { data: popularBusinesses } = await supabase
    .from('businesses')
    .select('id, name, slug, short_description, logo_url')
    .eq('status', 'active')
    .not('logo_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3)
  
  // Get recently added businesses
  const { data: recentBusinesses } = await supabase
    .from('businesses')
    .select('id, name, slug, short_description, logo_url')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(3)
  
  // Get total business count
  const { count: totalBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
  
  // Get total category count
  const { count: totalCategories } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
  
  // Enhance businesses with location information
  const enhanceBusinessWithLocation = async (business: any) => {
    // Get primary location for the business
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
  }
  
  const enhancedPopularBusinesses = await Promise.all(
    (popularBusinesses || []).map(enhanceBusinessWithLocation)
  )
  
  const enhancedRecentBusinesses = await Promise.all(
    (recentBusinesses || []).map(enhanceBusinessWithLocation)
  )
  
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Find the Best Local Businesses
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Discover, connect, and engage with businesses in your community.
          </p>
          <div className="max-w-3xl mx-auto">
            <SearchInput />
          </div>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/search" className="btn btn-primary bg-white text-gray-800 hover:bg-gray-100">
              Search Businesses
            </Link>
            <Link href="/businesses/add" className="btn btn-secondary bg-transparent border-white text-white hover:bg-white/10">
              List Your Business
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-4xl font-bold text-gray-800">{totalBusinesses || 0}</p>
              <p className="text-gray-600">Businesses</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-4xl font-bold text-gray-800">{totalCategories || 0}</p>
              <p className="text-gray-600">Categories</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-4xl font-bold text-gray-800">24/7</p>
              <p className="text-gray-600">Availability</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-4xl font-bold text-gray-800">100%</p>
              <p className="text-gray-600">Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoriesWithCount.length > 0 ? (
              categoriesWithCount.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="bg-white shadow rounded-lg p-6 text-center hover:shadow-md transition-shadow"
                >
                  <div className="text-gray-600 mb-2">
                    {category.icon ? (
                      <Image
                        src={category.icon}
                        alt={category.name}
                        width={40}
                        height={40}
                        className="mx-auto"
                      />
                    ) : (
                      <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{category.businessCount} listings</p>
                </Link>
              ))
            ) : (
              // Sample categories as fallback
              ['Restaurants', 'Shopping', 'Services', 'Health', 'Entertainment', 'Education'].map((category) => (
                <div
                  key={category}
                  className="bg-white shadow rounded-lg p-6 text-center hover:shadow-md transition-shadow"
                >
                  <div className="text-gray-600 mb-2">
                    <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-medium">{category}</h3>
                </div>
              ))
            )}
          </div>
          <div className="text-center mt-8">
            <Link href="/categories" className="inline-flex items-center text-gray-700 hover:text-gray-900">
              View all categories
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Businesses */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Popular Businesses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {enhancedPopularBusinesses.length > 0 ? (
              enhancedPopularBusinesses.map((business) => (
                <div key={business.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="h-48 bg-gray-200 relative">
                    {business.logo_url ? (
                      <Image
                        src={business.logo_url}
                        alt={business.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-2xl font-bold">
                        {business.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{business.name}</h3>
                    {(business.city || business.state) && (
                      <div className="text-sm text-gray-600 mb-2">
                        {business.city}{business.city && business.state ? ', ' : ''}{business.state}
                      </div>
                    )}
                    <div className="text-yellow-400 flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4">
                      {business.short_description || "No description available."}
                    </p>
                    <Link href={`/businesses/${business.slug}`} className="text-gray-800 font-medium hover:text-gray-900">
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Fallback sample businesses
              [1, 2, 3].map((index) => (
                <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">Business Name {index}</h3>
                    <div className="text-yellow-400 flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4">Short description of the business goes here. This is a placeholder for the actual description.</p>
                    <a href="#" className="text-gray-800 font-medium hover:text-gray-900">
                      View Details
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="text-center mt-8">
            <Link href="/businesses" className="btn btn-primary">
              View All Businesses
            </Link>
          </div>
        </div>
      </section>

      {/* Recently Added */}
      {enhancedRecentBusinesses.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Recently Added</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {enhancedRecentBusinesses.map((business) => (
                <Link 
                  key={business.id}
                  href={`/businesses/${business.slug}`}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    <div className="relative h-16 w-16 mr-4 bg-gray-200 rounded-full overflow-hidden">
                      {business.logo_url ? (
                        <Image
                          src={business.logo_url}
                          alt={business.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold">
                          {business.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{business.name}</h3>
                      {(business.city || business.state) && (
                        <p className="text-sm text-gray-600">
                          {business.city}{business.city && business.state ? ', ' : ''}{business.state}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 line-clamp-2">
                    {business.short_description || "No description available."}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gray-100 text-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Search</h3>
              <p className="text-gray-600">Find businesses based on category, location, or keyword</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 text-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Discover</h3>
              <p className="text-gray-600">Read reviews, browse photos, and learn more about businesses</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 text-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect</h3>
              <p className="text-gray-600">Contact businesses, write reviews, and engage with the community</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to List Your Business?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join our growing directory of businesses and connect with potential customers.
          </p>
          <Link 
            href="/businesses/add"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-100"
          >
            Add Your Business
            <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}