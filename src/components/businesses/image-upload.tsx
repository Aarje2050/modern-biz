'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type ImageUploadProps = {
  businessId: string
  type: 'logo' | 'cover'
  existingUrl?: string | null
  onUploadComplete: (url: string) => void
}

export default function ImageUpload({ 
  businessId, 
  type, 
  existingUrl,
  onUploadComplete 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(existingUrl || null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  
  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null)
      setUploading(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }
      
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${businessId}-${type}-${Date.now()}.${fileExt}`
      const filePath = `businesses/${businessId}/${fileName}`
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type must be JPEG, PNG, or WebP')
      }
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(filePath, file)
        
      if (uploadError) {
        throw uploadError
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(filePath)
        
      // Update the business with the new image URL
      const updateField = type === 'logo' ? 'logo_url' : 'cover_url'
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ [updateField]: publicUrl })
        .eq('id', businessId)
        
      if (updateError) {
        throw updateError
      }
      
      setImageUrl(publicUrl)
      onUploadComplete(publicUrl)
      
    } catch (error: any) {
      console.error('Upload error:', error)
      setError(error.message || 'An error occurred during upload')
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
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
      
      {imageUrl ? (
        <div className="relative">
          <div className={`relative ${type === 'logo' ? 'h-32 w-32' : 'h-48 w-full'}`}>
            <Image 
              src={imageUrl} 
              alt={type === 'logo' ? 'Business Logo' : 'Business Cover'}
              fill
              className={`
                object-cover border border-gray-200 
                ${type === 'logo' ? 'rounded-full' : 'rounded-md'}
              `}
            />
          </div>
          <button
            onClick={() => document.getElementById(`${type}-upload`)?.click()}
            className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Change'}
          </button>
        </div>
      ) : (
        <div
          className={`
            flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md 
            ${type === 'logo' ? 'h-32 w-32' : 'h-48 w-full'}
          `}
        >
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <label
                htmlFor={`${type}-upload`}
                className="relative cursor-pointer rounded-md font-medium text-gray-600 hover:text-gray-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-500"
              >
                <span>{type === 'logo' ? 'Upload logo' : 'Upload cover image'}</span>
                <input
                  id={`${type}-upload`}
                  name={`${type}-upload`}
                  type="file"
                  className="sr-only"
                  onChange={uploadImage}
                  disabled={uploading}
                  accept="image/jpeg,image/png,image/webp"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
          </div>
        </div>
      )}
    </div>
  )
}