// src/components/businesses/business-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import CategorySelect from '@/components/forms/category-select'


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

export default function BusinessForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    shortDescription: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    website: '',
    email: '',
    phone: '',
    establishedYear: '',
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  
  // Add state for images
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const router = useRouter()
  const supabase = createClient()
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    setLogoFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    setCoverFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
  
  const uploadImage = async (file: File, businessId: string, type: 'logo' | 'cover') => {
    if (!file) return null
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${businessId}-${type}-${Date.now()}.${fileExt}`
    const filePath = `businesses/${businessId}/${fileName}`
    
    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('business-images')
      .upload(filePath, file)
      
    if (uploadError) {
      console.error(`Error uploading ${type}:`, uploadError)
      return null
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('business-images')
      .getPublicUrl(filePath)
      
    return publicUrl
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to submit a business')
        setIsLoading(false)
        return
      }
      
      // Create a slug from business name
      const slug = generateSlug(formData.name)
      
      // Check if slug already exists
      const { data: existingBusiness } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
        
      if (existingBusiness) {
        setError('A business with this name already exists')
        setIsLoading(false)
        return
      }
      
      // Insert business
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
// Insert business_categories relations

      if (selectedCategories.length > 0) {
        const categoryRelations = selectedCategories.map(categoryId => ({
          business_id: business.id,
          category_id: categoryId,
        }))
        
        await supabase
          .from('business_categories')
          .insert(categoryRelations)
      }
      
      // Upload images if they exist
      if (logoFile) {
        const logoUrl = await uploadImage(logoFile, business.id, 'logo')
        if (logoUrl) {
          // Update business with logo URL
          await supabase
            .from('businesses')
            .update({ logo_url: logoUrl })
            .eq('id', business.id)
        }
      }
      
      if (coverFile) {
        const coverUrl = await uploadImage(coverFile, business.id, 'cover')
        if (coverUrl) {
          // Update business with cover URL
          await supabase
            .from('businesses')
            .update({ cover_url: coverUrl })
            .eq('id', business.id)
        }
      }
      
      // Insert primary location
      const { error: locationError } = await supabase
        .from('locations')
        .insert({
          business_id: business.id,
          name: 'Primary Location',
          address_line1: formData.address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: formData.country,
          is_primary: true,
        })
        
      if (locationError) {
        throw locationError
      }
      
      // Insert contact information
      if (formData.website) {
        await supabase
          .from('business_contacts')
          .insert({
            business_id: business.id,
            type: 'website',
            value: formData.website,
            is_primary: true,
          })
      }
      
      if (formData.email) {
        await supabase
          .from('business_contacts')
          .insert({
            business_id: business.id,
            type: 'email',
            value: formData.email,
            is_primary: true,
          })
      }
      
      if (formData.phone) {
        await supabase
          .from('business_contacts')
          .insert({
            business_id: business.id,
            type: 'phone',
            value: formData.phone,
            is_primary: true,
          })
      }
      
      // Redirect to business dashboard
      router.push(`/dashboard/businesses/${business.id}/edit`)
      router.refresh()
    } catch (err: any) {
      console.error('Error submitting business:', err)
      setError(err.message || 'An error occurred while submitting your business')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Add a new step for images
  const totalSteps = 5;
  
  return (
    <div className="bg-white shadow-sm rounded-lg">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-medium">Add Your Business</h2>
        <p className="mt-1 text-sm text-gray-500">
          Fill out the form below to submit your business listing.
        </p>
        
        {/* Progress indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div 
                key={index}
                className={`flex-1 ${index < totalSteps - 1 ? 'border-t-2' : ''} ${
                  index < step ? 'border-gray-800' : 'border-gray-300'
                }`}
              >
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    index < step ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'
                  } ${index === step - 1 ? 'ring-2 ring-offset-2 ring-gray-800' : ''}`}
                >
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs">Business Info</span>
            <span className="text-xs">Location</span>
            <span className="text-xs">Contact Info</span>
            <span className="text-xs">Category</span>
            <span className="text-xs">Media</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {step === 1 && (
          <>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Business Name *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700">
                Short Description *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="shortDescription"
                  name="shortDescription"
                  required
                  maxLength={160}
                  value={formData.shortDescription}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  A brief description of your business (max 160 characters)
                </p>
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Full Description *
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="establishedYear" className="block text-sm font-medium text-gray-700">
                Year Established
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="establishedYear"
                  name="establishedYear"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.establishedYear}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Continue to Location
              </button>
            </div>
          </>
        )}
        
        {step === 2 && (
          <>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Street Address *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State/Province *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="state"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                  Postal Code *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    required
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="country"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Continue to Contact
              </button>
            </div>
          </>
        )}
        
        {step === 3 && (
          <>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  id="website"
                  name="website"
                  placeholder="https://"
                  value={formData.website}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <div className="mt-1">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                />
              </div>
            </div>
            
            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Continue to Categories
              </button>
            </div>
          </>
        )}

{step === 4 && (
  <>
    <div>
      <h3 className="text-lg font-medium">Business Categories</h3>
      <p className="mt-1 text-sm text-gray-500">
        Select categories that best describe your business to help customers find you.
      </p>
    </div>
    
    <div className="mt-4">
      <CategorySelect
        selectedCategories={selectedCategories}
        onChange={setSelectedCategories}
        maxCategories={5}
      />
    </div>
    
    <div className="pt-4 flex justify-between">
      <button
        type="button"
        onClick={() => setStep(3)}
        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        Back
      </button>
      <button
        type="button"
        onClick={() => setStep(5)}
        className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        Continue to Media
      </button>
    </div>
  </>
)}
        
        {step === 5 && (
          <>
            <div>
              <h3 className="text-lg font-medium">Business Images</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload your business logo and cover image to make your listing stand out.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Business Logo</h4>
                <div className="mt-1">
                  {logoPreview ? (
                    <div className="relative w-32 h-32 mx-auto">
                      <Image 
                        src={logoPreview} 
                        alt="Logo preview" 
                        fill
                        className="object-cover rounded-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null)
                          setLogoPreview(null)
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-full h-32 w-32 mx-auto">
                      <label
                        htmlFor="logo-upload"
                        className="relative cursor-pointer rounded-md font-medium text-gray-600 hover:text-gray-500 focus-within:outline-none"
                      >
                        <span>Upload logo</span>
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
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Recommended: Square image, at least 400x400 pixels
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Cover Image</h4>
                <div className="mt-1">
                  {coverPreview ? (
                    <div className="relative w-full h-40">
                      <Image 
                        src={coverPreview} 
                        alt="Cover preview" 
                        fill
                        className="object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverFile(null)
                          setCoverPreview(null)
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md h-40">
                      <label
                        htmlFor="cover-upload"
                        className="relative cursor-pointer rounded-md font-medium text-gray-600 hover:text-gray-500 focus-within:outline-none"
                      >
                        <span>Upload cover image</span>
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
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Recommended: Wide format, at least 1200x600 pixels
                </p>
              </div>
            </div>
            
            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {isLoading ? 'Submitting...' : 'Submit Business'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}