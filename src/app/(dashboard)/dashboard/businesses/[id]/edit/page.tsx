// src/app/(dashboard)/dashboard/businesses/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import RichTextEditor from '@/components/forms/rich-text-editor'

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

type ValidationError = {
  field: string
  message: string
}

export default function EnhancedEditBusinessPage() {
  const params = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [activeTab, setActiveTab] = useState('details')
  
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  
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

        setLogoPreview(businessData.logo_url)
        setCoverPreview(businessData.cover_url)

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

  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = []

    if (!formData.name.trim()) {
      errors.push({ field: 'name', message: 'Business name is required' })
    }
    if (!formData.short_description.trim()) {
      errors.push({ field: 'short_description', message: 'Short description is required' })
    }
    if (!formData.description.trim()) {
      errors.push({ field: 'description', message: 'Full description is required' })
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' })
    }
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      errors.push({ field: 'website', message: 'Website must start with http:// or https://' })
    }

    return errors
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setValidationErrors(prev => prev.filter(err => err.field !== name))
  }

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }))
    setValidationErrors(prev => prev.filter(err => err.field !== 'description'))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo file size must be less than 5MB')
      return
    }
    
    setLogoFile(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    
    if (file.size > 10 * 1024 * 1024) {
      setError('Cover image file size must be less than 10MB')
      return
    }
    
    setCoverFile(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (file: File, businessId: string, type: 'logo' | 'cover') => {
    if (!file || !supabase) return null
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${businessId}-${type}-${Date.now()}.${fileExt}`
    const filePath = `businesses/${businessId}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('business-images')
      .upload(filePath, file)
      
    if (uploadError) {
      console.error(`Error uploading ${type}:`, uploadError)
      return null
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('business-images')
      .getPublicUrl(filePath)
      
    return publicUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business || !supabase) return

    const errors = validateForm()
    if (errors.length > 0) {
      setValidationErrors(errors)
      setError('Please fix the errors below before saving')
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }

      // Upload images first
      let logoUrl = business.logo_url
      let coverUrl = business.cover_url
      
      if (logoFile) {
        const newLogoUrl = await uploadImage(logoFile, business.id, 'logo')
        if (newLogoUrl) logoUrl = newLogoUrl
      }
      
      if (coverFile) {
        const newCoverUrl = await uploadImage(coverFile, business.id, 'cover')
        if (newCoverUrl) coverUrl = newCoverUrl
      }

      // Update business
      const { error: businessError } = await supabase
        .from('businesses')
        .update({
          name: formData.name,
          description: formData.description,
          short_description: formData.short_description,
          established_year: formData.established_year ? parseInt(formData.established_year) : null,
          logo_url: logoUrl,
          cover_url: coverUrl,
          status: 'pending'
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

      setBusiness(prev => prev ? { 
        ...prev, 
        status: 'pending',
        logo_url: logoUrl,
        cover_url: coverUrl
      } : null)
      setSuccessMessage('Business updated successfully! Your changes are now under review.')
      
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const getFieldError = (fieldName: string) => {
    return validationErrors.find(err => err.field === fieldName)
  }

  const tabs = [
    { id: 'details', name: 'Business Details', icon: 'info' },
    { id: 'media', name: 'Photos & Media', icon: 'photo' },
    { id: 'settings', name: 'Settings', icon: 'cog' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (error && !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Business</h3>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <div className="mt-6">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-500">
                ← Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!business) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
              <p className="mt-1 text-gray-600">Manage your business listing</p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                business.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' :
                business.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
              </span>
              {business.status === 'active' && (
                <Link
                  href={`/businesses/${business.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Live
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Listing Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium ${
                  business.status === 'active' ? 'text-green-600' :
                  business.status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Created</span>
                <span className="text-gray-900">{new Date(business.created_at).toLocaleDateString()}</span>
              </div>
              {business.status === 'pending' && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Under Review:</strong> Changes typically take 24-48 hours to approve.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Plan Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Plan</span>
                <span className="font-medium text-gray-900 capitalize">
                  {paymentStatus?.plan_id || 'Free'}
                </span>
              </div>
              {paymentStatus && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount</span>
                    <span className="text-gray-900">${paymentStatus.amount} {paymentStatus.currency}</span>
                  </div>
                  {paymentStatus.current_period_end && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Expires</span>
                      <span className="text-gray-900">{new Date(paymentStatus.current_period_end).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              )}
              <div className="mt-4">
                <Link 
                  href={`/businesses/add?upgrade=${business.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {paymentStatus?.plan_id === 'premium' ? 'Manage Plan' : 'Upgrade to Premium'} →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
          
          <form onSubmit={handleSave} className="p-8">
            {/* Business Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Business Information</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`
                          block w-full px-4 py-3 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                          ${getFieldError('name') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="Enter your business name"
                      />
                      {getFieldError('name') && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('name')?.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-2">
                        Short Description *
                      </label>
                      <input
                        type="text"
                        id="short_description"
                        name="short_description"
                        maxLength={160}
                        value={formData.short_description}
                        onChange={handleInputChange}
                        className={`
                          block w-full px-4 py-3 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                          ${getFieldError('short_description') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="Brief description for search results"
                      />
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {160 - formData.short_description.length} characters remaining
                        </span>
                        {getFieldError('short_description') && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {getFieldError('short_description')?.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Description *
                      </label>
                      <RichTextEditor
                        value={formData.description}
                        onChange={handleDescriptionChange}
                        placeholder="Describe your business, services, and what makes you unique..."
                        maxLength={2000}
                        required
                      />
                      {getFieldError('description') && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('description')?.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="established_year" className="block text-sm font-medium text-gray-700 mb-2">
                          Year Established
                        </label>
                        <input
                          type="number"
                          id="established_year"
                          name="established_year"
                          min="1800"
                          max={new Date().getFullYear()}
                          value={formData.established_year}
                          onChange={handleInputChange}
                          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g. 2015"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className={`
                          block w-full px-4 py-3 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                          ${getFieldError('website') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="https://www.yourwebsite.com"
                      />
                      {getFieldError('website') && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('website')?.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Business Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`
                          block w-full px-4 py-3 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                          ${getFieldError('email') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="info@yourbusiness.com"
                      />
                      {getFieldError('email') && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('email')?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Business Location</h3>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        id="address_line1"
                        name="address_line1"
                        value={formData.address_line1}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="123 Main Street"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="New York"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                          State/Province
                        </label>
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="NY"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-2">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          id="postal_code"
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleInputChange}
                          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="10001"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <select
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Australia">Australia</option>
                          <option value="India">India</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Business Images</h3>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Logo Upload */}
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-4">Business Logo</h4>
                      <div className="space-y-4">
                        {logoPreview ? (
                          <div className="relative w-40 h-40 mx-auto">
                            <Image 
                              src={logoPreview} 
                              alt="Logo preview" 
                              fill
                              className="object-cover rounded-2xl border-4 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setLogoFile(null)
                                setLogoPreview(null)
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl h-40 w-40 mx-auto hover:border-blue-400 transition-colors">
                            <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                            </svg>
                            <label
                              htmlFor="logo-upload"
                              className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              Upload logo
                              <input
                                id="logo-upload"
                                name="logo-upload"
                                type="file"
                                className="sr-only"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleLogoChange}
                              />
                            </label>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP</p>
                          </div>
                        )}
                        <p className="text-sm text-gray-600 text-center">
                          Recommended: Square image, at least 400x400 pixels
                        </p>
                      </div>
                    </div>
                    
                    {/* Cover Image Upload */}
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-4">Cover Image</h4>
                      <div className="space-y-4">
                        {coverPreview ? (
                          <div className="relative w-full h-40">
                            <Image 
                              src={coverPreview} 
                              alt="Cover preview" 
                              fill
                              className="object-cover rounded-xl border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCoverFile(null)
                                setCoverPreview(null)
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl h-40 hover:border-blue-400 transition-colors">
                            <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                            </svg>
                            <label
                              htmlFor="cover-upload"
                              className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              Upload cover image
                              <input
                                id="cover-upload"
                                name="cover-upload"
                                type="file"
                                className="sr-only"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleCoverChange}
                              />
                            </label>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP</p>
                          </div>
                        )}
                        <p className="text-sm text-gray-600 text-center">
                          Recommended: Wide format, at least 1200x600 pixels
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Business Settings</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-600">
                      Additional settings and advanced options will be available here in future updates.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="border-t border-gray-200 pt-8 mt-8">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <p className="mb-1">
                    <strong>Important:</strong> Changes will be reviewed before going live.
                  </p>
                  <p className="text-xs">Review typically takes 24-48 hours.</p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m100 50l20 0 0 20-20 0z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}