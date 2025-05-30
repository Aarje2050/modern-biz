// templates/directory/modern/pages/AboutSEOOptimized.tsx
// ENTERPRISE SEO-OPTIMIZED ABOUT TEMPLATE WITH CMS INTEGRATION

import { SiteConfig } from '@/lib/site-context'
import { createClient } from '@/lib/supabase/server'

interface AboutPageContent {
  hero_title?: string
  hero_subtitle?: string
  mission_title?: string
  mission_content?: string
  story_title?: string
  story_content?: string
  values_title?: string
  values_list?: Array<{title: string, description: string}>
  team_title?: string
  team_content?: string
  cta_title?: string
  cta_content?: string
  seo_keywords?: string[]
  local_areas?: string[]
}

interface AboutSEOOptimizedProps {
  siteConfig: SiteConfig
  cmsContent?: AboutPageContent
}

export default async function AboutSEOOptimized({ siteConfig }: { siteConfig: SiteConfig }) {
  // Get unique CMS content for this site
  const cmsContent = await getAboutPageContent(siteConfig.id)
  
  // SEO Data
  const niche = siteConfig.config?.niche || 'business'
  const location = siteConfig.config?.location || ''
  const siteName = siteConfig.name
  const domain = siteConfig.domain
  
  // Semantic SEO data
  const nicheData = getNicheSemanticData(niche)
  const businessType = nicheData.businessType
  const serviceKeywords = nicheData.keywords
  
  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": siteName,
            "description": cmsContent?.hero_subtitle || `Professional ${niche} directory serving ${location}`,
            "url": `https://${domain}`,
            "areaServed": location ? [location, ...cmsContent?.local_areas || []] : cmsContent?.local_areas || [],
            "serviceType": businessType,
            "keywords": [...serviceKeywords, ...cmsContent?.seo_keywords || []].join(', '),
            "knowsAbout": serviceKeywords,
            "sameAs": [
              `https://${domain}/about`,
              `https://${domain}/contact`,
              `https://${domain}/businesses`
            ],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": `${niche} Services`,
              "itemListElement": serviceKeywords.map((keyword, index) => ({
                "@type": "Offer",
                "name": keyword,
                "position": index + 1
              }))
            }
          })
        }}
      />

      <div className="min-h-screen bg-white">
        {/* Hero Section - Semantic HTML */}
        <header className="bg-gradient-to-br from-red-600 to-red-700 text-white py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              {/* H1 - Primary SEO Signal */}
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {cmsContent?.hero_title || `About ${siteName} - Your Trusted ${niche} Directory`}
                {location && (
                  <span className="block text-2xl md:text-3xl font-normal mt-2 text-red-100">
                    Serving {location}
                  </span>
                )}
              </h1>
              
              {/* Hero Description - Rich Semantic Content */}
              <p className="text-xl md:text-2xl text-red-100 leading-relaxed">
                {cmsContent?.hero_subtitle || 
                  `Connecting customers with verified ${niche} professionals${location ? ` in ${location}` : ''}. Find trusted services, read authentic reviews, and make informed decisions.`
                }
              </p>
            </div>
          </div>
        </header>

        {/* Main Content - Semantic Article Structure */}
        <main className="py-16">
          
          {/* Mission Section */}
          <section className="py-16" aria-labelledby="mission-heading">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 id="mission-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                      {cmsContent?.mission_title || `Our Mission`}
                    </h2>
                    
                    {/* Rich, unique content from CMS */}
                    <div className="prose prose-lg text-gray-700">
                      {cmsContent?.mission_content ? (
                        <div dangerouslySetInnerHTML={{ __html: cmsContent.mission_content }} />
                      ) : (
                        <div>
                          <p className="mb-4">
                            At {siteName}, we're dedicated to creating the most comprehensive and trustworthy 
                            {' '}{niche} directory{location ? ` in ${location}` : ''}. Our platform connects 
                            customers with verified professionals who meet our strict quality standards.
                          </p>
                          <p>
                            We believe everyone deserves access to reliable, professional {niche} services. 
                            That's why we've built a platform that prioritizes transparency, authenticity, 
                            and customer satisfaction above all else.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Trust Signals - SEO Value */}
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600" itemProp="numberOfEmployees">100+</div>
                        <div className="text-sm text-gray-600">Verified Businesses</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">5,000+</div>
                        <div className="text-sm text-gray-600">Happy Customers</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Image with proper SEO attributes */}
                  <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
                    <img 
                      src="/images/about-mission.jpg" 
                      alt={`${siteName} mission - connecting customers with professional ${niche} services${location ? ` in ${location}` : ''}`}
                      className="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                      width="500"
                      height="400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Story Section - Unique CMS Content */}
          {cmsContent?.story_content && (
            <section className="py-16 bg-gray-50" aria-labelledby="story-heading">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <h2 id="story-heading" className="text-3xl font-bold text-center text-gray-900 mb-12">
                    {cmsContent.story_title || 'Our Story'}
                  </h2>
                  
                  <div className="prose prose-lg mx-auto text-gray-700">
                    <div dangerouslySetInnerHTML={{ __html: cmsContent.story_content }} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Values Section - Structured for Rich Snippets */}
          <section className="py-16" aria-labelledby="values-heading">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 id="values-heading" className="text-3xl font-bold text-center text-gray-900 mb-12">
                  {cmsContent?.values_title || `Why Choose ${siteName}?`}
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {(cmsContent?.values_list || getDefaultValues(niche)).map((value, index) => (
                    <article key={index} className="text-center" itemScope itemType="https://schema.org/Service">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2" itemProp="name">{value.title}</h3>
                      <p className="text-sm text-gray-600" itemProp="description">{value.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Team Section - If CMS content exists */}
          {cmsContent?.team_content && (
            <section className="py-16 bg-gray-50" aria-labelledby="team-heading">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <h2 id="team-heading" className="text-3xl font-bold text-center text-gray-900 mb-12">
                    {cmsContent.team_title || 'Our Team'}
                  </h2>
                  
                  <div className="prose prose-lg mx-auto text-gray-700">
                    <div dangerouslySetInnerHTML={{ __html: cmsContent.team_content }} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Local SEO Section */}
          {location && (
            <section className="py-16" aria-labelledby="location-heading">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center">
                  <h2 id="location-heading" className="text-3xl font-bold text-gray-900 mb-6">
                    Proudly Serving {location}
                  </h2>
                  <p className="text-lg text-gray-700 mb-8">
                    {siteName} is committed to supporting the {location} community by connecting 
                    residents with local {niche} professionals who understand the unique needs 
                    of our area.
                  </p>
                  
                  {/* Service Areas for Local SEO */}
                  {cmsContent?.local_areas && cmsContent.local_areas.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Service Areas Include:</h3>
                      <div className="flex flex-wrap justify-center gap-2">
                        {cmsContent.local_areas.map((area, index) => (
                          <span 
                            key={index}
                            className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border"
                            itemProp="areaServed"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Call to Action - Conversion Optimized */}
        <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              {cmsContent?.cta_title || `Ready to Find Professional ${niche} Services?`}
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              {cmsContent?.cta_content || 
                `Browse our directory of verified ${niche} professionals${location ? ` in ${location}` : ''} and find the perfect service for your needs.`
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/businesses"
                className="inline-flex items-center px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                aria-label={`Browse ${niche} businesses directory`}
              >
                Browse Directory
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <a 
                href="/businesses/add"
                className="inline-flex items-center px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                aria-label="List your business in our directory"
              >
                List Your Business
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

// ============================================================================
// HELPER FUNCTIONS FOR SEO OPTIMIZATION
// ============================================================================

// Get CMS content for this specific site
async function getAboutPageContent(siteId: string): Promise<AboutPageContent | null> {
  try {
    const supabase = createClient()
    
    // Get the about page content from CMS
    const { data, error } = await supabase
      .from('site_posts')
      .select('content, metadata')
      .eq('site_id', siteId)
      .eq('post_type', 'page')
      .eq('slug', 'about-content')
      .eq('post_status', 'published')
      .single()

    if (error || !data) {
      return null
    }

    // Parse structured content from CMS
    return {
      hero_title: data.metadata?.hero_title,
      hero_subtitle: data.metadata?.hero_subtitle,
      mission_title: data.metadata?.mission_title,
      mission_content: data.content?.mission,
      story_title: data.metadata?.story_title,
      story_content: data.content?.story,
      values_title: data.metadata?.values_title,
      values_list: data.metadata?.values_list,
      team_title: data.metadata?.team_title,
      team_content: data.content?.team,
      cta_title: data.metadata?.cta_title,
      cta_content: data.metadata?.cta_content,
      seo_keywords: data.metadata?.seo_keywords || [],
      local_areas: data.metadata?.local_areas || []
    }
  } catch (error) {
    console.error('Error fetching CMS content:', error)
    return null
  }
}

// Semantic SEO data for different niches
function getNicheSemanticData(niche: string) {
  const nicheMap: Record<string, { businessType: string, keywords: string[] }> = {
    'duct-cleaning': {
      businessType: 'HVAC Cleaning Service',
      keywords: [
        'air duct cleaning', 'HVAC maintenance', 'dryer vent cleaning', 
        'indoor air quality', 'ductwork cleaning', 'air purification',
        'ventilation cleaning', 'allergen removal'
      ]
    },
    'pet-stores': {
      businessType: 'Pet Store',
      keywords: [
        'pet supplies', 'pet food', 'pet grooming', 'veterinary care',
        'pet accessories', 'dog training', 'pet health', 'animal care'
      ]
    },
    'ivf-centers': {
      businessType: 'Fertility Clinic',
      keywords: [
        'fertility treatment', 'IVF', 'reproductive health', 'fertility testing',
        'egg freezing', 'embryo transfer', 'fertility specialist', 'pregnancy support'
      ]
    }
  }

  return nicheMap[niche] || {
    businessType: 'Professional Service',
    keywords: ['professional services', 'local business', 'service provider']
  }
}

// Default values if no CMS content
function getDefaultValues(niche: string) {
  return [
    {
      title: 'Verified Professionals',
      description: `All ${niche} providers are thoroughly vetted and verified`
    },
    {
      title: 'Authentic Reviews',
      description: 'Real reviews from verified customers you can trust'
    },
    {
      title: 'Easy Comparison',
      description: 'Compare services, prices, and reviews side by side'
    },
    {
      title: 'Local Focus',
      description: 'Find professionals who understand your local area'
    }
  ]
}