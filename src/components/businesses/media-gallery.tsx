'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type MediaGalleryProps = {
  businessId: string
}

type MediaItem = {
  id: string
  url: string
  thumbnailUrl: string
  title: string | null
  description: string | null
}

export default function MediaGallery({ businessId }: MediaGalleryProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  
  // Load existing media
  useEffect(() => {
    async function loadMedia() {
      try {
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .eq('business_id', businessId)
          .order('display_order', { ascending: true })
          
        if (error) throw error
        
        setMediaItems(data || [])
      } catch (error: any) {
        console.error('Error loading media:', error)
      }
    }
    
    loadMedia()
  }, [businessId, supabase])
  
  const uploadMedia = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null)
      setUploading(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }
      
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${businessId}-media-${Date.now()}.${fileExt}`
      const filePath = `businesses/${businessId}/media/${fileName}`
      
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
        
      // Create a thumbnail path (same image for now)
      const thumbnailUrl = publicUrl
      
      // Insert media record
      const { data, error: insertError } = await supabase
        .from('media')
        .insert({
          business_id: businessId,
          type: 'image',
          url: publicUrl,
          thumbnail_url: thumbnailUrl,
          title: file.name.split('.')[0], // Use filename without extension as title
          display_order: mediaItems.length + 1
        })
        .select()
        
      if (insertError) {
        throw insertError
      }
      
      // Add the new item to the list
      if (data && data.length > 0) {
        setMediaItems(prev => [...prev, data[0]])
      }
      
    } catch (error: any) {
      console.error('Upload error:', error)
      setError(error.message || 'An error occurred during upload')
    } finally {
      setUploading(false)
    }
  }
  
  const deleteMedia = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      // Get the media item to delete
      const itemToDelete = mediaItems.find(item => item.id === id)
      if (!itemToDelete) return
      
      // Extract the file path from the URL
      const urlParts = itemToDelete.url.split('/')
      const filePath = urlParts.slice(urlParts.indexOf('business-images') + 1).join('/')
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('business-images')
        .remove([filePath])
        
      if (storageError) {
        throw storageError
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('media')
        .delete()
        .eq('id', id)
        
      if (dbError) {
        throw dbError
      }
      
      // Update state
      setMediaItems(prev => prev.filter(item => item.id !== id))
      
    } catch (error: any) {
      console.error('Delete error:', error)
      setError(error.message || 'An error occurred while deleting')
    }
  }
  
  return (
    <div className="space-y-6">
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
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {mediaItems.map((item) => (
          <div key={item.id} className="relative group">
            <div className="relative h-40 w-full rounded-md overflow-hidden">
              <Image 
                src={item.url} 
                alt={item.title || 'Business media'} 
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
              <button
                onClick={() => deleteMedia(item.id)}
                className="hidden group-hover:flex p-2 bg-red-500 text-white rounded-full"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 truncate">{item.title || 'Untitled'}</p>
          </div>
        ))}
        
        {/* Upload button */}
        <div className="relative h-40 w-full">
          <label
            htmlFor="media-upload"
            className="flex flex-col h-full items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
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
              <span className="text-sm text-gray-600">Add Image</span>
            </div>
            <input
              id="media-upload"
              type="file"
              className="sr-only"
              onChange={uploadMedia}
              disabled={uploading}
              accept="image/jpeg,image/png,image/webp"
            />
          </label>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
              <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}