// Shared Contact Page Template
'use client'
import { useState } from 'react'
import { useSiteContext } from '@/hooks/useSiteContext'
import { hasFeature } from '@/lib/template/middleware'

export default function Contact() {
  const { siteConfig } = useSiteContext()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const siteName = siteConfig?.name || 'Our Company'
  const niche = siteConfig?.config?.niche || 'business'
  const location = siteConfig?.config?.location || 'our area'
  const primaryColor = siteConfig?.config?.theme?.primaryColor || '#2563eb'
  const siteType = siteConfig?.site_type || 'directory'
  const hasContactForm = hasFeature('contact_form')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // TODO: Integrate with your messaging system
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          site_id: siteConfig?.id,
          type: 'contact_form'
        })
      })
      
      if (response.ok) {
        setSubmitted(true)
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const getContactInfo = () => {
    switch (siteType) {
      case 'service':
        return {
          phone: '(555) 123-4567',
          email: 'info@example.com',
          address: `123 Main St, ${location}`,
          hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-4PM',
          emergency: '24/7 Emergency Service Available'
        }
      case 'landing':
        return {
          phone: '(555) 123-4567',
          email: 'hello@example.com',
          address: 'Online Services Available',
          hours: 'Mon-Fri: 9AM-5PM',
          emergency: null
        }
      default: // directory
        return {
          phone: '(555) 123-4567',
          email: 'support@example.com',
          address: `Serving ${location}`,
          hours: 'Mon-Fri: 9AM-6PM',
          emergency: null
        }
    }
  }
  
  const contactInfo = getContactInfo()
  
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
            Contact {siteName}
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
            {siteType === 'service' 
              ? `Get in touch for professional ${niche} services in ${location}`
              : siteType === 'landing'
              ? `Ready to get started? Let's talk about your ${niche} needs`
              : `Have questions? We're here to help you find the best ${niche} in ${location}`
            }
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Get In Touch
              </h2>
              
              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-xl">📞</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Phone</h3>
                    <p className="text-gray-600">{contactInfo.phone}</p>
                    {contactInfo.emergency && (
                      <p className="text-sm text-red-600 font-medium">{contactInfo.emergency}</p>
                    )}
                  </div>
                </div>
                
                {/* Email */}
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-xl">✉️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Email</h3>
                    <p className="text-gray-600">{contactInfo.email}</p>
                  </div>
                </div>
                
                {/* Address */}
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-xl">📍</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {siteType === 'service' ? 'Service Area' : 'Location'}
                    </h3>
                    <p className="text-gray-600">{contactInfo.address}</p>
                  </div>
                </div>
                
                {/* Hours */}
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-xl">🕒</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Hours</h3>
                    <p className="text-gray-600">{contactInfo.hours}</p>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-8 space-y-4">
                <button 
                  className="w-full text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  📞 Call Now: {contactInfo.phone}
                </button>
                
                {siteType === 'service' && (
                  <button className="w-full bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors">
                    🆘 Emergency Service
                  </button>
                )}
              </div>
            </div>
            
            {/* Contact Form */}
            <div>
              <div className="bg-gray-50 p-8 rounded-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Send Us a Message
                </h2>
                
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-green-600 mb-2">Message Sent!</h3>
                    <p className="text-gray-600">
                      Thank you for contacting us. We'll get back to you within 24 hours.
                    </p>
                    <button 
                      onClick={() => setSubmitted(false)}
                      className="mt-4 text-sm underline hover:no-underline"
                      style={{ color: primaryColor }}
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your phone number"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={
                          siteType === 'service' 
                            ? `${niche} inquiry`
                            : siteType === 'landing'
                            ? 'Interest in services'
                            : 'General inquiry'
                        }
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message *
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={
                          siteType === 'service'
                            ? `Tell us about your ${niche} needs...`
                            : 'How can we help you?'
                        }
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Common questions about our {niche} {siteType === 'directory' ? 'directory' : 'services'}
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: siteType === 'service' 
                  ? `Do you offer emergency ${niche} services?`
                  : `How do I list my ${niche} business?`,
                a: siteType === 'service'
                  ? `Yes, we provide 24/7 emergency services for urgent ${niche} needs.`
                  : `You can easily add your business through our simple registration process.`
              },
              {
                q: siteType === 'service'
                  ? 'Are you licensed and insured?'
                  : 'How do you verify businesses?',
                a: siteType === 'service'
                  ? 'Yes, we are fully licensed, bonded, and insured for your protection.'
                  : 'We verify all business information and require proper licensing documentation.'
              },
              {
                q: siteType === 'service'
                  ? 'Do you provide free estimates?'
                  : 'Is the directory free to use?',
                a: siteType === 'service'
                  ? 'Yes, we provide free estimates for all services with no obligation.'
                  : 'Yes, searching and browsing our directory is completely free.'
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-3">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}