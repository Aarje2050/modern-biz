// src/components/businesses/rating-display.tsx
'use client'

interface RatingDisplayProps {
  rating: string
  reviewCount: number
}

export default function RatingDisplay({ rating, reviewCount }: RatingDisplayProps) {
  const scrollToReviews = () => {
    const reviewsSection = document.getElementById('reviews')
    if (reviewsSection) {
      const offset = window.innerWidth >= 768 ? 140 : 180
      const top = reviewsSection.offsetTop - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <button 
      onClick={scrollToReviews}
      className="flex items-center gap-2 mb-2 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors cursor-pointer mobile-touch-feedback group"
    >
      <div className="flex items-center">
        <span className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
          {rating}
        </span>
        <div className="flex items-center ml-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-4 h-4 ${
                star <= parseFloat(rating) ? 'text-yellow-400' : 'text-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-sm text-gray-600 ml-1 group-hover:text-red-600 transition-colors">
          ({reviewCount})
        </span>
      </div>
      <svg className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}