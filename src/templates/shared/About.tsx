// Shared About Page Template
'use client'
import { useSiteContext } from '@/hooks/useSiteContext'

export default function About() {
  const { siteConfig } = useSiteContext()
  
  const siteName = siteConfig?.name || 'Our Company'
  const niche = siteConfig?.config?.niche || 'business'
  const location = siteConfig?.config?.location || 'our area'
  const primaryColor = siteConfig?.config?.theme?.primaryColor || '#2563eb'
  const siteType = siteConfig?.site_type || 'directory'
  
  // Content varies by site type
  const getContent = () => {
    switch (siteType) {
      case 'landing':
        return {
          title: `About ${siteName}`,
          subtitle: `Leading provider of ${niche} solutions`,
          story: `${siteName} was founded with a simple mission: to provide exceptional ${niche} that help businesses grow and succeed. Our team of experts brings years of experience and a commitment to excellence in everything we do.`,
          values: [
            { icon: '🎯', title: 'Results-Driven', desc: 'We focus on delivering measurable results for our clients.' },
            { icon: '🤝', title: 'Customer First', desc: 'Your success is our success. We put customers at the center of everything.' },
            { icon: '💡', title: 'Innovation', desc: 'We stay ahead of trends to provide cutting-edge solutions.' }
          ]
        }
        
      case 'service':
        return {
          title: `About ${siteName}`,
          subtitle: `Trusted ${niche} experts serving ${location}`,
          story: `With over 10 years of experience, ${siteName} has been the go-to choice for ${niche} services in ${location}. We're a locally owned business that takes pride in delivering quality workmanship and exceptional customer service.`,
          values: [
            { icon: '🏆', title: 'Quality Work', desc: 'We use only the best materials and techniques for lasting results.' },
            { icon: '⚡', title: 'Fast Service', desc: 'Quick response times and efficient service to minimize disruption.' },
            { icon: '🛡️', title: 'Fully Insured', desc: 'Licensed, bonded, and insured for your peace of mind.' }
          ]
        }
        
      default: // directory
        return {
          title: `About ${siteName}`,
          subtitle: `Your trusted ${niche} directory for ${location}`,
          story: `${siteName} is the premier online directory connecting customers with top-rated ${niche} businesses in ${location}. We help you find reliable, verified businesses with real customer reviews and ratings.`,
          values: [
            { icon: '✅', title: 'Verified Listings', desc: 'All businesses are verified for authenticity and quality.' },
            { icon: '⭐', title: 'Real Reviews', desc: 'Genuine customer reviews to help you make informed decisions.' },
            { icon: '🔍', title: 'Easy Search', desc: 'Find exactly what you need with our powerful search features.' }
          ]
        }
    }
  }
  
  const content = getContent()
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="py-20 text-white"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` 
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {content.title}
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
            {content.subtitle}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Our Story
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  {content.story}
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Today, we continue to grow and evolve, always keeping our core values 
                  at the heart of everything we do. We're not just a business – we're 
                  your partners in success.
                </p>
              </div>
              
              <div className="bg-gray-50 p-8 rounded-2xl">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                  <p className="text-gray-600 leading-relaxed">
                    To provide exceptional {niche} solutions that exceed expectations 
                    and help our customers achieve their goals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {content.values.map((value, i) => (
              <div key={i} className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The dedicated professionals behind {siteName}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Sarah Johnson",
                role: "Founder & CEO",
                image: "👩‍💼",
                bio: "10+ years experience in {niche} with a passion for excellence."
              },
              {
                name: "Mike Chen", 
                role: "Operations Manager",
                image: "👨‍💼",
                bio: "Expert in streamlining processes and ensuring customer satisfaction."
              },
              {
                name: "Emily Davis",
                role: "Customer Success",
                image: "👩‍💻", 
                bio: "Dedicated to helping customers achieve their goals and exceed expectations."
              }
            ].map((member, i) => (
              <div key={i} className="text-center">
                <div className="text-6xl mb-4">{member.image}</div>
                <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                <p className="text-sm font-medium mb-3" style={{ color: primaryColor }}>
                  {member.role}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {member.bio.replace('{niche}', niche)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20 text-white text-center"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Work Together?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Let's discuss how we can help you achieve your goals
          </p>
          <button className="bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
            Get In Touch
          </button>
        </div>
      </section>
    </div>
  )
}