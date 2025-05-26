// src/components/businesses/photo-preview.tsx
'use client'

import Image from 'next/image'

interface BusinessMedia {
  id: string
  url: string
  thumbnail_url?: string
  title?: string
  is_featured: boolean
}

interface PhotoPreviewProps {
  images: BusinessMedia[]
  businessName: string
}

export default function PhotoPreview({ images, businessName }: PhotoPreviewProps) {
  const scrollToGallery = () => {
    const gallerySection = document.getElementById('gallery')
    if (gallerySection) {
      const offset = window.innerWidth >= 768 ? 140 : 180
      const top = gallerySection.offsetTop - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {images.slice(0, 5).map((item, index) => (
          <div key={item.id} className="relative flex-shrink-0">
            <button 
              onClick={scrollToGallery}
              className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden hover:opacity-90 transition-opacity mobile-touch-feedback"
            >
              <Image
                src={item.url}
                alt={item.title || `${businessName} photo ${index + 1}`}
                fill
                className="object-cover"
                loading="lazy"
              />
              {index === 4 && images.length > 5 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    +{images.length - 4}
                  </span>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <button 
          onClick={scrollToGallery}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 text-xs text-red-600 font-medium hover:text-red-700 mobile-touch-feedback"
        >
          {images.length} Photos
        </button>
      )}
    </div>
  )
}