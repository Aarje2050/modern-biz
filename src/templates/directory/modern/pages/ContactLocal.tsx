// templates/directory/modern/pages/ContactLocal.tsx (NEW FILE)
import { SiteConfig } from '@/lib/site-context'

export default function ContactLocal({ siteConfig }: { siteConfig: SiteConfig }) {
    const location = siteConfig.config?.location || 'your area'
    const siteName = siteConfig.name
  
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-br from-red-600 to-red-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Contact {siteName}</h1>
            <p className="text-xl text-red-100">Proudly serving {location}</p>
          </div>
        </section>
  
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
                <form className="space-y-6">
                  <input type="text" placeholder="Your name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                  <input type="email" placeholder="your@email.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                  <textarea rows={5} placeholder="Message" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"></textarea>
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold">Send Message</button>
                </form>
              </div>
  
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4">Service Area</h3>
                  <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-gray-500">Map of {location}</span>
                  </div>
                  <p className="text-gray-600">We serve {location} and surrounding areas.</p>
                </div>
  
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4">Contact Info</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        </svg>
                      </div>
                      <span>hello@{siteConfig.domain}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>{location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }
  