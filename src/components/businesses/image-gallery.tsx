// src/components/businesses/image-gallery.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface BusinessMedia {
  id: string
  url: string
  thumbnail_url?: string
  title?: string
  is_featured: boolean
}

interface ImageGalleryProps {
  images: BusinessMedia[]
  businessName: string
}

export default function ImageGallery({ images, businessName }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<BusinessMedia | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openModal = (image: BusinessMedia, index: number) => {
    setSelectedImage(image)
    setCurrentIndex(index)
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  const nextImage = () => {
    const nextIndex = (currentIndex + 1) % images.length
    setCurrentIndex(nextIndex)
    setSelectedImage(images[nextIndex])
  }

  const prevImage = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length
    setCurrentIndex(prevIndex)
    setSelectedImage(images[prevIndex])
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeModal()
    if (e.key === 'ArrowRight') nextImage()
    if (e.key === 'ArrowLeft') prevImage()
  }

  // Add keyboard event listeners
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }

    if (selectedImage) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = 'unset'
    }
  }, [selectedImage, currentIndex])

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.slice(0, 9).map((item, index) => (
          <button
            key={item.id}
            onClick={() => openModal(item, index)}
            className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer mobile-touch-feedback hover-effect"
          >
            <Image
              src={item.url}
              alt={item.title || `${businessName} photo ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
            
            {/* Overlay for last image if more exist */}
            {index === 8 && images.length > 9 && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  +{images.length - 8}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {images.length > 9 && (
        <button 
          onClick={() => openModal(images[9], 9)}
          className="mt-4 text-red-600 hover:text-red-700 font-medium text-sm"
        >
          View all {images.length} photos
        </button>
      )}

      {/* Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-60 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-60 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-60 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div className="relative max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src={selectedImage.url}
                alt={selectedImage.title || `${businessName} photo`}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Image Info */}
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2 text-white">
              {selectedImage.title && (
                <p className="font-medium mb-1">{selectedImage.title}</p>
              )}
              <p className="text-sm opacity-75">
                {currentIndex + 1} of {images.length}
              </p>
            </div>
          </div>

          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10"
            onClick={closeModal}
          />
        </div>
      )}
    </>
  )
}