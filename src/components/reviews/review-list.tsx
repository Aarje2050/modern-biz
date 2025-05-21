// src/components/reviews/review-list.tsx
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { format } from 'date-fns'

type ReviewListProps = {
  businessId: string
  limit?: number
}

type Profile = {
  id: string
  full_name: string | null
  display_name: string | null
  avatar_url: string | null
}

type Review = {
  id: string
  rating: number
  title: string | null
  content: string
  created_at: string
  helpful_count: number
  profile_id: string
  profile?: Profile
}

export default async function ReviewList({ businessId, limit }: ReviewListProps) {
  const supabase = await createClient()
  
  // Fetch reviews for the business
  let reviewQuery = supabase
    .from('reviews') // This should reference a view or table in the public schema
    .select('id, rating, title, content, created_at, helpful_count, profile_id')
    .eq('business_id', businessId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  
  // Apply limit if provided
  if (limit) {
    reviewQuery = reviewQuery.limit(limit)
  }
  
  const { data: reviewsData, error } = await reviewQuery
  
  if (error) {
    console.error('Error fetching reviews:', error)
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
        <p className="text-sm">Failed to load reviews. Please try again later.</p>
      </div>
    )
  }
  
  // Fetch profiles separately for each review
  const reviews: Review[] = reviewsData || []
  
  // Get unique profile IDs
  const profileIds = [...new Set(reviews.map(review => review.profile_id))]
  
  if (profileIds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <h3 className="mt-2 text-base font-medium text-gray-900">No reviews yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Be the first to review this business!
        </p>
      </div>
    )
  }
  
  // Fetch all profiles in a single query
  const { data: profilesData } = await supabase
    .from('profiles') // This should reference a view or table in the public schema
    .select('id, full_name, display_name, avatar_url')
    .in('id', profileIds)
  
  // Create a map of profiles
  const profileMap: Record<string, Profile> = {}
  if (profilesData) {
    profilesData.forEach(profile => {
      profileMap[profile.id] = profile
    })
  }
  
  // Add profile data to each review
  reviews.forEach(review => {
    review.profile = profileMap[review.profile_id]
  })
  
  // Calculate overall rating
  const totalReviews = reviews.length
  let averageRating = 0
  
  if (totalReviews > 0) {
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    averageRating = sum / totalReviews
  }
  
  // Rating distribution
  const ratingCounts = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  }
  
  return (
    <div>
      {/* Overall rating summary */}
      {totalReviews > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-medium mb-1">Customer Reviews</h3>
              <div className="flex items-center">
                <div className="flex text-yellow-400 mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star} 
                      className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-lg font-medium">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-500 ml-2">
                  Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            {/* Rating distribution */}
            <div className="flex flex-col space-y-1 w-full md:w-64">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center">
                  <span className="text-xs w-3 mr-2">{rating}</span>
                  <div className="flex items-center">
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="w-full bg-gray-200 h-2 ml-2 rounded-full">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ width: `${totalReviews > 0 ? (ratingCounts[rating as keyof typeof ratingCounts] / totalReviews) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs w-8 ml-2 text-gray-500">
                    {ratingCounts[rating as keyof typeof ratingCounts]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Review list */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between">
                <div className="flex items-start">
                  <div className="relative h-10 w-10 mr-4 bg-gray-200 rounded-full overflow-hidden">
                    {review.profile?.avatar_url ? (
                      <Image
                        src={review.profile.avatar_url}
                        alt={review.profile.display_name || review.profile.full_name || 'User'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold">
                        {(review.profile?.display_name || review.profile?.full_name || 'U').substring(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {review.profile?.display_name || review.profile?.full_name || 'Anonymous User'}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg 
                            key={star} 
                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {review.title && (
                <h4 className="font-medium mt-4">{review.title}</h4>
              )}
              
              <p className="text-gray-600 mt-2">{review.content}</p>
              
              {/* Helpful button */}
              <div className="mt-4 flex items-center">
                <button
                  type="button"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  Helpful ({review.helpful_count || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="mt-2 text-base font-medium text-gray-900">No reviews yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Be the first to review this business!
          </p>
        </div>
      )}
    </div>
  )
}