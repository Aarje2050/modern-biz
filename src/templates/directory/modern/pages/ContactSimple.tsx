// templates/directory/modern/pages/ContactSimple.tsx (NEW FILE)
import { SiteConfig } from '@/lib/site-context'

export default function ContactSimple({ siteConfig }: { siteConfig: SiteConfig }) {
    const niche = siteConfig.config?.niche || 'business'
    const siteName = siteConfig.name
  
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-br from-red-600 to-red-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Contact {siteName}</h1>
            <p className="text-xl text-red-100">Need help finding {niche} services?</p>
          </div>
        </section>
  
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Your name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                  <input type="email" placeholder="your@email.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                  <option>General Inquiry</option>
                  <option>Business Listing</option>
                  <option>Technical Support</option>
                </select>
                <textarea rows={5} placeholder="How can we help?" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"></textarea>
                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold">Send Message</button>
              </form>
            </div>
          </div>
        </section>
      </div>
    )
  }