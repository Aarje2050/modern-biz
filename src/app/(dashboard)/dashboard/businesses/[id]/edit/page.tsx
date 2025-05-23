// src/app/(dashboard)/dashboard/businesses/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ImageUpload from '@/components/businesses/image-upload'
import { Business } from '@/types/business' // Import your types

export default function EditBusinessPage() {
  const params = useParams()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  
  useEffect(() => {
    async function loadBusiness() {
// Add null check
if (!supabase) {
  setError('Unable to connect to database')
  setLoading(false)
  return
}
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          window.location.href = '/login'
          return
        }
        
        // Get the business
        const { data, error } = await supabase
          .from('businesses')
          .select(`
            *,
            locations(*),
            business_contacts(*)
          `)
          .eq('id', params.id)
          .eq('profile_id', session.user.id)
          .single()
          
        if (error) throw error
        
        if (!data) {
          window.location.href = '/404'
          return
        }
        
        setBusiness(data as unknown as Business)
      } catch (err: any) {
        console.error('Error loading business:', err)
        setError(err.message || 'Failed to load business')
      } finally {
        setLoading(false)
      }
    }
    
    loadBusiness()
  }, [params.id, supabase])
  
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
  
  if (error || !business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error || 'Business not found'}</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Business: {business.name}</h1>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              business.status === 'active' ? 'bg-green-100 text-green-800' :
              business.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
            </span>
            {business.status === 'active' && (
              <Link
                href={`/businesses/${business.slug}`}
                className="text-sm text-gray-600 hover:text-gray-900"
                target="_blank"
              >
                View Listing
              </Link>
            )}
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
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
          
          <div className="p-6">
            <p className="text-center text-gray-500 mb-8">
              Business edit form will be implemented here.
            </p>
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Business Information</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{business.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">{business.status}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{business.description}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Established Year</dt>
                  <dd className="mt-1 text-sm text-gray-900">{business.established_year || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{new Date(business.created_at).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Contact Information</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                {business.business_contacts.map((contact) => (
                  <div key={contact.id}>
                    <dt className="text-sm font-medium text-gray-500">{contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{contact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Locations</h3>
              {business.locations.length > 0 ? (
                <div className="space-y-4">
                  {business.locations.map((location) => (
                    <div key={location.id} className="border rounded-md p-4">
                      <h4 className="font-medium">{location.name || 'Primary Location'}</h4>
                      <p className="text-sm text-gray-600">
                        {location.address_line1}<br />
                        {location.address_line2 && <>{location.address_line2}<br /></>}
                        {location.city}, {location.state} {location.postal_code}<br />
                        {location.country}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No locations added yet.</p>
              )}
            </div>
            
            {/* Image upload section */}
            <div className="mt-8">
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
          </div>
        </div>
      </div>
    </div>
  )
}