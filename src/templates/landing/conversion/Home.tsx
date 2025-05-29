// Landing Page Template - Conversion Focused
'use client'
import { useSiteContext } from '@/hooks/useSiteContext'
import { hasFeature } from '@/lib/template/middleware'

export default function LandingHome() {
  const { siteConfig } = useSiteContext()
  
  const siteName = siteConfig?.name || 'Landing Page'
  const niche = siteConfig?.config?.niche || 'services'
  const primaryColor = siteConfig?.config?.theme?.primaryColor || '#2563eb'
  const hasContactForm = hasFeature('contact_form')
  const hasAnalytics = hasFeature('analytics')
  
  return (
    <div className="min-h-screen">
      {/* Hero Section - Above the fold conversion */}
      <section 
        className="min-h-screen flex items-center justify-center text-white relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` 
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Transform Your<br />
            <span className="text-yellow-300">Business Today</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
            Get premium {niche} that deliver real results. 
            Join thousands of satisfied customers who trust {siteName}.
          </p>
          
          {/* Social proof */}
          <div className="mb-8 opacity-80">
            <p className="text-sm mb-2">Trusted by 5,000+ customers</p>
            <div className="flex justify-center items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-300 text-lg">★</span>
              ))}
              <span className="ml-2 text-sm">4.9/5 average rating</span>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
            <button 
              className="block w-full md:w-auto bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🚀 Get Started Free
            </button>
            <button 
              className="block w-full md:w-auto border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300"
            >
              📞 Talk to Expert
            </button>
          </div>
          
          {/* Risk-free messaging */}
          <p className="mt-4 text-sm opacity-75">
            💳 No credit card required • 🔒 Cancel anytime • ⚡ Setup in 5 minutes
          </p>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose {siteName}?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We deliver results that matter to your business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-center mb-4">Lightning Fast</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Get results in just 24 hours with our proven system. No waiting, no delays.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-center mb-4">Targeted Results</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Custom solutions designed specifically for your {niche} needs and goals.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💯</span>
              </div>
              <h3 className="text-2xl font-bold text-center mb-4">100% Guaranteed</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Complete satisfaction guaranteed or your money back. Zero risk to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Johnson",
                company: "TechCorp Inc.",
                rating: 5,
                text: "Absolutely incredible results! Our {niche} improved by 300% in just 2 months. The team is professional and delivers on every promise."
              },
              {
                name: "Mike Chen",
                company: "Growth Solutions",
                rating: 5,
                text: "Best investment we've made for our {niche}. ROI was positive within the first month. Highly recommend to anyone serious about results."
              },
              {
                name: "Emily Davis",
                company: "Startup Success",
                rating: 5,
                text: "Game-changer for our business! The support team is amazing and the results speak for themselves. Couldn't be happier."
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-8 rounded-xl shadow-lg border-l-4" style={{ borderLeftColor: primaryColor }}>
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <span key={j} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic leading-relaxed">
                  "{testimonial.text.replace('{niche}', niche)}"
                </p>
                <div className="border-t pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section 
        className="py-20 text-white text-center"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your {niche}?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of satisfied customers and start seeing results today
          </p>
          
          <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center mb-8">
            <button className="block w-full md:w-auto bg-white text-gray-900 px-12 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
              🚀 Start Free Trial
            </button>
            <button className="block w-full md:w-auto border-2 border-white text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300">
              💬 Schedule Demo
            </button>
          </div>
          
          <p className="text-sm opacity-75">
            Still not sure? Try our free consultation - no strings attached!
          </p>
        </div>
      </section>
      
      {/* Analytics tracking if enabled */}
      {hasAnalytics && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Analytics event tracking
              console.log('Landing page loaded for: ${siteName}');
            `
          }}
        />
      )}
    </div>
  )
}