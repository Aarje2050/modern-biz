// templates/directory/modern/pages/AboutStory.tsx (NEW FILE)
import { SiteConfig } from '@/lib/site-context'
export default function AboutStory({ siteConfig }: { siteConfig: SiteConfig }) {
    const niche = siteConfig.config?.niche || 'business'
    const siteName = siteConfig.name
  
    return (
      <div className="min-h-screen bg-white">
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-8">Our Story</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              It started when we couldn't find reliable {niche} services in our own neighborhood. 
              That frustration led us to create {siteName}.
            </p>
          </div>
        </section>
  
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Founder Photo</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">"We built this for people like us"</h2>
                <p className="text-gray-700 mb-6">
                  After multiple bad experiences with {niche} services, we knew there had to be a better way. 
                  We wanted a platform where customers could find trustworthy professionals.
                </p>
                <p className="text-gray-600">
                  Today, {siteName} serves thousands of customers and continues to grow our network.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }