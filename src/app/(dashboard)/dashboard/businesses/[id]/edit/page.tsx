// src/app/(dashboard)/dashboard/businesses/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ImageUpload from '@/components/businesses/image-upload'

type BusinessContact = {
  id: string
  type: string
  value: string
}

type BusinessLocation = {
  id: string
  name: string | null
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  postal_code: string | null
  country: string
}

type Business = {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  logo_url: string | null
  cover_url: string | null
  status: string
  established_year: number | null
  created_at: string
  business_contacts: BusinessContact[]
  locations: BusinessLocation[]
}

type PaymentStatus = {
  plan_id: string
  status: string
  amount: number
  currency: string
  current_period_end: string | null
}

export default function EditBusinessPage() {
  const params = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    established_year: '',
    website: '',
    phone: '',
    email: '',
    address_line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: ''
  })

  const supabase = createClient()
  
  useEffect(() => {
    async function loadBusinessData() {
      if (!supabase) {
        setError('Unable to connect to database')
        setLoading(false)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          window.location.href = '/login'
          return
        }
        
        // Get business data
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select(`
            *,
            locations(*),
            business_contacts(*)
          `)
          .eq('id', params.id)
          .eq('profile_id', session.user.id)
          .single()
          
        if (businessError) throw businessError
        
        if (!businessData) {
          window.location.href = '/404'
          return
        }
        
        setBusiness(businessData as Business)
        
        // Set form data
        const contacts = businessData.business_contacts || []
        const location = businessData.locations?.[0]
        
        setFormData({
          name: businessData.name || '',
          description: businessData.description || '',
          short_description: businessData.short_description || '',
          established_year: businessData.established_year?.toString() || '',
          website: contacts.find((c: BusinessContact) => c.type === 'website')?.value || '',
phone: contacts.find((c: BusinessContact) => c.type === 'phone')?.value || '',
email: contacts.find((c: BusinessContact) => c.type === 'email')?.value || '',
          address_line1: location?.address_line1 || '',
          city: location?.city || '',
          state: location?.state || '',
          postal_code: location?.postal_code || '',
          country: location?.country || ''
        })

        // Get payment status
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan_id, status, amount, currency, current_period_end')
          .eq('business_id', params.id)
          .eq('status', 'active')
          .single()

        if (subscription) {
          setPaymentStatus(subscription)
        }
        
      } catch (err: any) {
        console.error('Error loading business:', err)
        setError(err.message || 'Failed to load business')
      } finally {
        setLoading(false)
      }
    }
    
    loadBusinessData()
  }, [params.id, supabase])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business || !supabase) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }

      // Update business - always set to pending for review
      const { error: businessError } = await supabase
        .from('businesses')
        .update({
          name: formData.name,
          description: formData.description,
          short_description: formData.short_description,
          established_year: formData.established_year ? parseInt(formData.established_year) : null,
          status: 'pending' // Always set to pending on edit
        })
        .eq('id', business.id)

      if (businessError) throw businessError

      // Update contacts
      const contactUpdates = [
        { type: 'website', value: formData.website },
        { type: 'phone', value: formData.phone },
        { type: 'email', value: formData.email }
      ]

      for (const contact of contactUpdates) {
        if (contact.value) {
          await supabase
            .from('business_contacts')
            .upsert({
              business_id: business.id,
              type: contact.type,
              value: contact.value,
              is_primary: true
            })
        } else {
          // Delete if empty
          await supabase
            .from('business_contacts')
            .delete()
            .eq('business_id', business.id)
            .eq('type', contact.type)
        }
      }

      // Update location
      if (business.locations.length > 0) {
        await supabase
          .from('locations')
          .update({
            address_line1: formData.address_line1,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country
          })
          .eq('id', business.locations[0].id)
      }

      setBusiness(prev => prev ? { ...prev, status: 'pending' } : null)
      setSuccessMessage('Business updated successfully! Your changes are now under review.')
      
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }
  
  if (error && !business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!business) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Business: {business.name}</h1>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              business.status === 'active' ? 'bg-green-100 text-green-800' :
              business.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
            </span>
            {business.status === 'active' && (
              <Link
                href={`/businesses/${business.slug}`}
                className="text-sm text-blue-600 hover:text-blue-800"
                target="_blank"
              >
                View Live →
              </Link>
            )}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Listing Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium mb-3">Listing Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Status:</span>
                <span className={`font-medium ${
                  business.status === 'active' ? 'text-green-600' :
                  business.status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{new Date(business.created_at).toLocaleDateString()}</span>
              </div>
              {business.status === 'pending' && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Your listing is under review. Changes typically take 24-48 hours to approve.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium mb-3">Plan Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Plan:</span>
                <span className="font-medium capitalize">
                  {paymentStatus?.plan_id || 'Free'}
                </span>
              </div>
              {paymentStatus && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span>${paymentStatus.amount} {paymentStatus.currency}</span>
                  </div>
                  {paymentStatus.current_period_end && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span>{new Date(paymentStatus.current_period_end).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              )}
              <div className="mt-3">
                <Link 
                  href={`/businesses/add?upgrade=${business.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {paymentStatus?.plan_id === 'premium' ? 'Manage Plan' : 'Upgrade to Premium'} →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSave} className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <Link
                href={`/dashboard/businesses/${business.id}/edit`}
                className="border-gray-900 text-gray-900 w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm"
              >
                Details
              </Link>
              <Link
                href={`/dashboard/businesses/${business.id}/locations`}
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm"
              >
                Locations
              </Link>
              <Link
                href={`/dashboard/businesses/${business.id}/media`}
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm"
              >
                Photos & Media
              </Link>
              <Link
                href={`/dashboard/businesses/${business.id}/reviews`}
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm"
              >
                Reviews
              </Link>
            </nav>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description
                  </label>
                  <input
                    type="text"
                    name="short_description"
                    maxLength={160}
                    value={formData.short_description}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">Brief description (max 160 characters)</p>
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Description
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Established Year
                  </label>
                  <input
                    type="number"
                    name="established_year"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={formData.established_year}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    placeholder="https://"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-medium mb-4">Location</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <h3 className="text-lg font-medium mb-4">Business Images</h3>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Logo</h4>
                  <ImageUpload
                    businessId={business.id}
                    type="logo"
                    existingUrl={business.logo_url}
                    onUploadComplete={(url) => {
                      setBusiness(prev => prev ? { ...prev, logo_url: url } : null)
                    }}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Recommended: Square image, at least 400x400 pixels
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Cover Image</h4>
                  <ImageUpload
                    businessId={business.id}
                    type="cover"
                    existingUrl={business.cover_url}
                    onUploadComplete={(url) => {
                      setBusiness(prev => prev ? { ...prev, cover_url: url } : null)
                    }}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Recommended: Wide format, at least 1200x600 pixels
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> Changes will be reviewed before going live (24-48 hours).
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}