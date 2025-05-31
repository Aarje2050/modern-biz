// Service Business Template - Local SEO Focused
'use client'
import { useAuth, useSiteContext, useUnifiedAuth } from '@/providers/app-provider'
import { hasFeature } from '@/lib/template/middleware'

export default function ServiceHome() {
  const { siteConfig } = useSiteContext()
  
  const siteName = siteConfig?.name || 'Service Business'
  const niche = siteConfig?.config?.niche || 'service'
  const location = siteConfig?.config?.location || 'your area'
  const primaryColor = siteConfig?.config?.theme?.primaryColor || '#2563eb'
  const hasBooking = hasFeature('booking')
  const hasReviews = hasFeature('reviews')
  
  return (
    <div className="min-h-screen">
      {/* Hero Section - Local Service Focus */}
      <section 
        className="relative py-20 md:py-32 text-white overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` 
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20z'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <div className="mb-6">
                <span className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-full text-sm font-medium">
                  📍 Serving {location}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Professional<br />
                <span className="text-yellow-300">{niche}</span><br />
                Services
              </h1>
              
              <p className="text-xl mb-8 opacity-90 leading-relaxed">
                Trusted {niche} experts in {location}. Licensed, insured, and committed 
                to delivering exceptional results for your home or business.
              </p>
              
              {/* Trust signals */}
              <div className="flex flex-wrap items-center gap-6 mb-8 text-sm">
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  Licensed & Insured
                </div>
                <div className="flex items-center">
                  <span className="mr-2">⭐</span>
                  5-Star Rated
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🛡️</span>
                  100% Guaranteed
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex">
                <button className="block w-full md:w-auto bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg text-lg font-bold hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  📞 Call Now: (555) 123-4567
                </button>
                {hasBooking && (
                  <button className="block w-full md:w-auto border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300">
                    📅 Book Appointment
                  </button>
                )}
              </div>
              
              <p className="mt-4 text-sm opacity-75">
                🕒 Available 24/7 for emergencies • 🚚 Same-day service available
              </p>
            </div>
            
            {/* Image/Visual */}
            <div className="lg:text-center">
              <div className="bg-white bg-opacity-10 p-8 rounded-2xl backdrop-blur-sm">
                <div className="text-6xl mb-4">🔧</div>
                <h3 className="text-2xl font-bold mb-4">Expert {niche} Solutions</h3>
                <div className="space-y-2 text-left">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                    Emergency repairs available
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                    Free estimates & consultations
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                    Warranty on all work
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our {niche} Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive {niche} solutions for residential and commercial clients in {location}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🔧",
                title: "Emergency Repairs",
                description: "24/7 emergency service for urgent repairs. Fast response times guaranteed."
              },
              {
                icon: "🛠️", 
                title: "Installation Services",
                description: "Professional installation of new systems with manufacturer warranties."
              },
              {
                icon: "🔍",
                title: "Inspections",
                description: "Thorough inspections to identify issues before they become problems."
              },
              {
                icon: "🏠",
                title: "Residential Services",
                description: "Complete residential solutions for homeowners throughout {location}."
              },
              {
                icon: "🏢",
                title: "Commercial Services", 
                description: "Reliable commercial services for businesses of all sizes."
              },
              {
                icon: "💡",
                title: "Consultations",
                description: "Expert advice and free consultations for all your {niche} needs."
              }
            ].map((service, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description.replace('{location}', location).replace('{niche}', niche)}
                </p>
                <button 
                  className="mt-4 text-sm font-semibold hover:underline"
                  style={{ color: primaryColor }}
                >
                  Learn More →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Choose {siteName}?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                We're the trusted {niche} experts in {location} with years of experience 
                and thousands of satisfied customers.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Fast Response</h3>
                    <p className="text-gray-600">Same-day service available with 2-hour response times for emergencies.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-xl">🏆</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Expert Technicians</h3>
                    <p className="text-gray-600">Licensed professionals with years of experience and ongoing training.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-xl">💯</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Satisfaction Guaranteed</h3>
                    <p className="text-gray-600">100% satisfaction guarantee on all work with comprehensive warranties.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>10+</div>
                <div className="text-sm text-gray-600">Years Experience</div>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>5000+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>24/7</div>
                <div className="text-sm text-gray-600">Emergency Service</div>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>100%</div>
                <div className="text-sm text-gray-600">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {hasReviews && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                What Our Customers Say
              </h2>
              <p className="text-xl text-gray-600">
                Real reviews from real customers in {location}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "John Smith",
                  location: location,
                  rating: 5,
                  text: "Excellent service! Fast, professional, and fair pricing. They fixed our {niche} issue quickly and explained everything clearly."
                },
                {
                  name: "Maria Garcia", 
                  location: location,
                  rating: 5,
                  text: "Best {niche} service in {location}! Arrived on time, worked efficiently, and cleaned up after themselves. Highly recommend!"
                },
                {
                  name: "Robert Johnson",
                  location: location, 
                  rating: 5,
                  text: "Professional team that goes above and beyond. Great communication and quality work at a reasonable price."
                }
              ].map((review, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center mb-4">
                    {[...Array(review.rating)].map((_, j) => (
                      <span key={j} className="text-yellow-400 text-lg">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">
                    "{review.text.replace('{niche}', niche).replace('{location}', location)}"
                  </p>
                  <div className="border-t pt-4">
                    <div className="font-semibold">{review.name}</div>
                    <div className="text-sm text-gray-500">{review.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section 
        className="py-20 text-white text-center"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Contact {siteName} today for fast, professional {niche} services in {location}
          </p>
          
          <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center mb-8">
            <button className="block w-full md:w-auto bg-yellow-400 text-gray-900 px-12 py-4 rounded-lg text-lg font-bold hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg">
              📞 Call (555) 123-4567
            </button>
            <button className="block w-full md:w-auto border-2 border-white text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300">
              💬 Get Free Quote
            </button>
          </div>
          
          <p className="text-sm opacity-75">
            🕒 Available 24/7 for emergencies • 📍 Serving all of {location}
          </p>
        </div>
      </section>
    </div>
  )
}