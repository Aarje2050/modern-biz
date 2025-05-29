// Directory template home - wraps existing homepage functionality
import { useSiteContext } from '@/hooks/useSiteContext'
import SearchInput from '@/components/search/search-input'
import BusinessCard from '@/components/businesses/business-card'

export default function DirectoryTemplateHome() {
  const { siteConfig } = useSiteContext()
  
  // Use site-specific branding and content
  const siteName = siteConfig?.name || 'Business Directory'
  const niche = siteConfig?.config?.niche || 'businesses'
  const location = siteConfig?.config?.location || 'your area'
  
  return (
    <div className="min-h-screen">
      {/* Hero Section - Customized per site */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find the Best {niche} in {location}
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Discover top-rated {niche} services with reviews from real customers
          </p>
          
          {/* Search - Reuse existing component */}
          <div className="max-w-2xl mx-auto">
            <SearchInput placeholder={`Search for ${niche} services...`} />
          </div>
        </div>
      </section>

      {/* Featured Businesses - Reuse existing logic */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Featured {niche} Services
          </h2>
          
          {/* This would fetch site-specific businesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* BusinessCard components - reuse existing */}
            {/* Data fetched with site_id filter */}
          </div>
        </div>
      </section>

      {/* Categories Section - Reuse existing */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Browse by Category
          </h2>
          {/* Category grid - reuse existing components */}
        </div>
      </section>
    </div>
  )
}