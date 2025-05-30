// src/components/businesses/enhanced-business-form.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import CategorySelect from '@/components/forms/category-select'
import PlanSelector from '@/components/plans/plan-selector'
import PaymentFormWrapper from '@/components/payments/payment-form-wrapper'
import RichTextEditor from '@/components/forms/rich-text-editor'

type FormData = {
  name: string
  description: string
  shortDescription: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  website: string
  email: string
  phone: string
  establishedYear: string
}

type ValidationError = {
  field: string
  message: string
}

const DRAFT_KEY = 'business_form_draft'

export default function EnhancedBusinessForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    shortDescription: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    website: '',
    email: '',
    phone: '',
    establishedYear: '',
  })
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('free')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [step, setStep] = useState(1)
  const [showPayment, setShowPayment] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [isDraftSaving, setIsDraftSaving] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()
  const totalSteps = 6

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        setFormData(draft.formData || formData)
        setSelectedCategories(draft.selectedCategories || [])
        setSelectedPlan(draft.selectedPlan || 'free')
        setStep(draft.step || 1)
      } catch (error) {
        console.error('Error loading draft:', error)
      }
    }
  }, [])

  // Auto-save draft
  useEffect(() => {
    const saveDraft = () => {
      const draft = {
        formData,
        selectedCategories,
        selectedPlan,
        step,
        timestamp: Date.now()
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    }

    const interval = setInterval(saveDraft, 30000)
    return () => clearInterval(interval)
  }, [formData, selectedCategories, selectedPlan, step])

  const handleSaveDraft = useCallback(async () => {
    setIsDraftSaving(true)
    try {
      const draft = {
        formData,
        selectedCategories,
        selectedPlan,
        step,
        timestamp: Date.now()
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2000)
    } finally {
      setIsDraftSaving(false)
    }
  }, [formData, selectedCategories, selectedPlan, step])

  const validateStep = useCallback((stepNumber: number): ValidationError[] => {
    const errors: ValidationError[] = []

    switch (stepNumber) {
      case 1:
        if (!formData.name.trim()) {
          errors.push({ field: 'name', message: 'Business name is required' })
        }
        if (!formData.shortDescription.trim()) {
          errors.push({ field: 'shortDescription', message: 'Short description is required' })
        }
        if (!formData.description.trim()) {
          errors.push({ field: 'description', message: 'Full description is required' })
        }
        break
      
      case 2:
        if (!formData.address.trim()) {
          errors.push({ field: 'address', message: 'Street address is required' })
        }
        if (!formData.city.trim()) {
          errors.push({ field: 'city', message: 'City is required' })
        }
        if (!formData.state.trim()) {
          errors.push({ field: 'state', message: 'State/Province is required' })
        }
        if (!formData.postalCode.trim()) {
          errors.push({ field: 'postalCode', message: 'Postal code is required' })
        }
        if (!formData.country.trim()) {
          errors.push({ field: 'country', message: 'Country is required' })
        }
        break
      
      case 3:
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.push({ field: 'email', message: 'Please enter a valid email address' })
        }
        if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
          errors.push({ field: 'website', message: 'Website must start with http:// or https://' })
        }
        break
      
      case 4:
        if (selectedCategories.length === 0) {
          errors.push({ field: 'categories', message: 'Please select at least one category' })
        }
        break
    }

    return errors
  }, [formData, selectedCategories])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
    setValidationErrors(prev => prev.filter(err => err.field !== name))
  }, [])

  const handleDescriptionChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, description: value }))
    setError(null)
    setValidationErrors(prev => prev.filter(err => err.field !== 'description'))
  }, [])

  const handleStepNavigation = useCallback((nextStep: number) => {
    const errors = validateStep(step)
    
    if (errors.length > 0) {
      setValidationErrors(errors)
      setTimeout(() => {
        const firstErrorElement = document.querySelector(`[name="${errors[0].field}"]`)
        firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return
    }
    
    setValidationErrors([])
    setStep(nextStep)
  }, [step, validateStep])

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [])
  
  const handleCoverChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
  
  const uploadImage = useCallback(async (file: File, businessId: string, type: 'logo' | 'cover') => {
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
  }, [supabase])

  const handleBusinessSubmit = async () => {
    const allErrors: ValidationError[] = []
    for (let i = 1; i <= 4; i++) {
      allErrors.push(...validateStep(i))
    }
    
    if (allErrors.length > 0) {
      setValidationErrors(allErrors)
      setError('Please fix the errors below before submitting')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      if (!supabase) {
        throw new Error('Database connection failed')
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to submit a business')
      }

      const usageResponse = await fetch('/api/plans/check-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limitKey: 'max_businesses', increment: 1 })
      })
      
      const usageData = await usageResponse.json()
      
      if (!usageData.allowed && selectedPlan === 'free') {
        throw new Error('You have reached the maximum number of businesses for your current plan. Please upgrade to add more businesses.')
      }
      
      const slug = generateSlug(formData.name)
      
      const { data: existingBusiness } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
        
      if (existingBusiness) {
        throw new Error('A business with this name already exists')
      }
      
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          profile_id: user.id,
          name: formData.name,
          slug,
          description: formData.description,
          short_description: formData.shortDescription,
          status: 'pending',
          verification_level: 'none',
          established_year: formData.establishedYear ? parseInt(formData.establishedYear) : null,
        })
        .select('id')
        .single()
        
      if (businessError) {
        throw businessError
      }

      setBusinessId(business.id)

      await Promise.all([
        selectedCategories.length > 0 && supabase
          .from('business_categories')
          .insert(selectedCategories.map(categoryId => ({
            business_id: business.id,
            category_id: categoryId,
          }))),
        
        supabase.from('locations').insert({
          business_id: business.id,
          name: 'Primary Location',
          address_line1: formData.address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: formData.country,
          is_primary: true,
        }),
        
        formData.website && supabase.from('business_contacts').insert({
          business_id: business.id,
          type: 'website',
          value: formData.website,
          is_primary: true,
        }),
        
        formData.email && supabase.from('business_contacts').insert({
          business_id: business.id,
          type: 'email',
          value: formData.email,
          is_primary: true,
        }),
        
        formData.phone && supabase.from('business_contacts').insert({
          business_id: business.id,
          type: 'phone',
          value: formData.phone,
          is_primary: true,
        })
      ])
      
      if (logoFile) {
        const logoUrl = await uploadImage(logoFile, business.id, 'logo')
        if (logoUrl) {
          await supabase.from('businesses').update({ logo_url: logoUrl }).eq('id', business.id)
        }
      }
      
      if (coverFile) {
        const coverUrl = await uploadImage(coverFile, business.id, 'cover')
        if (coverUrl) {
          await supabase.from('businesses').update({ cover_url: coverUrl }).eq('id', business.id)
        }
      }

      if (selectedPlan === 'free') {
        await supabase.from('subscriptions').insert({
          profile_id: user.id,
          business_id: business.id,
          plan_id: 'free',
          status: 'active',
          amount: 0,
          currency: 'USD',
          billing_period: 'month'
        })

        localStorage.removeItem(DRAFT_KEY)
        router.push(`/dashboard/businesses/${business.id}/edit?success=true`)
      } else {
        setShowPayment(true)
      }
      
    } catch (err: any) {
      console.error('Error submitting business:', err)
      setError(err.message || 'An error occurred while submitting your business')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = useCallback((subscriptionId: string) => {
    if (businessId) {
      localStorage.removeItem(DRAFT_KEY)
      router.push(`/dashboard/businesses/${businessId}/edit?payment=success`)
    }
  }, [businessId, router])

  const handlePaymentCancel = useCallback(() => {
    setShowPayment(false)
    setStep(6)
  }, [])

  const getFieldError = (fieldName: string) => {
    return validationErrors.find(err => err.field === fieldName)
  }

  if (showPayment && businessId) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Complete Your Subscription</h2>
          <p className="mt-1 text-sm text-gray-600">
            Your business has been created. Complete your payment to activate premium features.
          </p>
        </div>
        
        <PaymentFormWrapper
          planId={selectedPlan}
          businessId={businessId}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
          userCountry="IN"
        />
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        {/* Error Display */}
        {error && (
          <div className="m-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
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
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add Your Business</h1>
              <p className="mt-2 text-gray-600">
                Create your business listing and connect with customers
              </p>
            </div>
            
            {/* Save Draft Button */}
            <button
              onClick={handleSaveDraft}
              disabled={isDraftSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {isDraftSaving ? 'Saving...' : draftSaved ? 'Saved!' : 'Save Draft'}
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex items-center">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div 
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all
                      ${index + 1 < step ? 'bg-green-600 border-green-600 text-white' : 
                        index + 1 === step ? 'bg-blue-600 border-blue-600 text-white' : 
                        'bg-white border-gray-300 text-gray-400'}
                    `}
                  >
                    {index + 1 < step ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < totalSteps - 1 && (
                    <div 
                      className={`flex-1 h-1 mx-4 rounded-full transition-all ${
                        index + 1 < step ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 text-sm font-medium">
              <span className={step >= 1 ? 'text-gray-900' : 'text-gray-400'}>Business Info</span>
              <span className={step >= 2 ? 'text-gray-900' : 'text-gray-400'}>Location</span>
              <span className={step >= 3 ? 'text-gray-900' : 'text-gray-400'}>Contact</span>
              <span className={step >= 4 ? 'text-gray-900' : 'text-gray-400'}>Categories</span>
              <span className={step >= 5 ? 'text-gray-900' : 'text-gray-400'}>Media</span>
              <span className={step >= 6 ? 'text-gray-900' : 'text-gray-400'}>Plan</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); if (step === 6) handleBusinessSubmit(); }} className="px-8 py-6">
          {/* Step 1: Business Information */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Tell us about your business</h2>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
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
                    <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description *
                    </label>
                    <input
                      type="text"
                      id="shortDescription"
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleChange}
                      maxLength={160}
                      className={`
                        block w-full px-4 py-3 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                        ${getFieldError('shortDescription') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                      `}
                      placeholder="Brief description for search results"
                    />
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {160 - formData.shortDescription.length} characters remaining
                      </span>
                      {getFieldError('shortDescription') && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('shortDescription')?.message}
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
                  
                  <div>
                    <label htmlFor="establishedYear" className="block text-sm font-medium text-gray-700 mb-2">
                      Year Established
                    </label>
                    <input
                      type="number"
                      id="establishedYear"
                      name="establishedYear"
                      value={formData.establishedYear}
                      onChange={handleChange}
                      min="1800"
                      max={new Date().getFullYear()}
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. 2015"
                    />
                    <p className="mt-2 text-sm text-gray-500">Optional: When was your business established?</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => handleStepNavigation(2)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-medium"
                >
                  Continue to Location
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Where is your business located?</h2>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`
                        block w-full px-4 py-3 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                        ${getFieldError('address') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                      `}
                      placeholder="123 Main Street"
                    />
                    {getFieldError('address') && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {getFieldError('address')?.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`
                          block w-full px-4 py-3 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                          ${getFieldError('city') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="New York"
                      />
                      {getFieldError('city') && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('city')?.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                        State/Province *
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={`
                          block w-full px-4 py-3 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                          ${getFieldError('state') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="NY"
                      />
                      {getFieldError('state') && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('state')?.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className={`
                          block w-full px-4 py-3 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                          ${getFieldError('postalCode') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                        `}
                        placeholder="10001"
                      />
                      {getFieldError('postalCode') && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('postalCode')?.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className={`
                          block w-full px-4 py-3 rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                          ${getFieldError('country') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                        `}
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                        <option value="India">India</option>
                        <option value="Other">Other</option>
                      </select>
                      {getFieldError('country') && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('country')?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleStepNavigation(3)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-medium"
                >
                  Continue to Contact
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Information */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">How can customers contact you?</h2>
                <p className="text-gray-600 mb-6">Add your contact information to help customers reach you easily.</p>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
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
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
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
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleStepNavigation(4)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-medium"
                >
                  Continue to Categories
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Categories */}
          {step === 4 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">What categories describe your business?</h2>
                <p className="text-gray-600 mb-6">Select categories to help customers find your business more easily.</p>
                
                <div>
                  <CategorySelect
                    selectedCategories={selectedCategories}
                    onChange={setSelectedCategories}
                    maxCategories={5}
                  />
                  {getFieldError('categories') && (
                    <p className="mt-4 text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {getFieldError('categories')?.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleStepNavigation(5)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-medium"
                >
                  Continue to Media
                </button>
              </div>
            </div>
          )}
          
          {/* Step 5: Media Upload */}
          {step === 5 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Add photos to showcase your business</h2>
                <p className="text-gray-600 mb-6">Upload your business logo and cover image to make your listing stand out.</p>
                
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {/* Logo Upload */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-4">Business Logo</h3>
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
                    </div>
                  </div>
                  
                  {/* Cover Image Upload */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-4">Cover Image</h3>
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
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-medium"
                >
                  Continue to Plan
                </button>
              </div>
            </div>
          )}
          
          {/* Step 6: Plan Selection */}
          {step === 6 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Choose your plan</h2>
                <p className="text-gray-600 mb-6">Select a plan that fits your business needs.</p>
                
                <PlanSelector
                  selectedPlan={selectedPlan}
                  onPlanSelect={setSelectedPlan}
                  showTrialInfo={true}
                />
              </div>
              
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m100 50l20 0 0 20-20 0z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    selectedPlan === 'free' ? 'Create Business' : 'Continue to Payment'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}