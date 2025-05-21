// src/app/(dashboard)/dashboard/businesses/[id]/media/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from '@/components/businesses/image-upload'
import MediaGallery from '@/components/businesses/media-gallery'
import { Business } from '@/types/business'

export default function BusinessMediaPage() {
  const params = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  
  useEffect(() => {
    async function loadBusiness() {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login')
          return
        }
        
        // Get the business
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', params.id)
          .eq('profile_id', session.user.id)
          .single()
          
        if (error) throw error
        
        if (!data) {
          router.push('/404')
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
  }, [params.id, supabase, router])
  
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
          <h1 className="text-2xl font-bold">Business Media: {business.name}</h1>
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
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm"
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
                className="border-gray-900 text-gray-900 w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm"
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
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">Business Logo & Cover</h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Logo</h3>
                  <ImageUpload
                    businessId={business.id}
                    type="logo"
                    existingUrl={business.logo_url}
                    onUploadComplete={(url) => {
                      setBusiness(prev => prev ? { ...prev, logo_url: url } : null)
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Cover Image</h3>
                  <ImageUpload
                    businessId={business.id}
                    type="cover"
                    existingUrl={business.cover_url}
                    onUploadComplete={(url) => {
                      setBusiness(prev => prev ? { ...prev, cover_url: url } : null)
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-12">
              <h2 className="text-lg font-medium mb-4">Photo Gallery</h2>
              <p className="text-sm text-gray-500 mb-4">
                Add photos showcasing your business. Photos will be displayed in your business listing.
              </p>
              <MediaGallery businessId={business.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}