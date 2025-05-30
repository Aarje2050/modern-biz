// src/components/reviews/review-list.tsx
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { format } from 'date-fns'
import ReviewActions from './review-actions'

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
  updated_at: string
  helpful_count: number
  profile_id: string
  profile?: Profile
}

export default async function ReviewList({ businessId, limit }: ReviewListProps) {
  const supabase = await createClient()
  
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id
  
  // Fetch reviews for the business
  let reviewQuery = supabase
    .from('reviews')
    .select('id, rating, title, content, created_at, updated_at, helpful_count, profile_id')
    .eq('business_id', businessId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  
  if (limit) {
    reviewQuery = reviewQuery.limit(limit)
  }
  
  const { data: reviewsData, error } = await reviewQuery
  
  if (error) {
    console.error('Error fetching reviews:', error)
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <p className="text-sm">Failed to load reviews. Please try again later.</p>
      </div>
    )
  }
  
  const reviews: Review[] = reviewsData || []
  
  // Get unique profile IDs
  const profileIds = [...new Set(reviews.map(review => review.profile_id))]
  
  if (profileIds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
        <p className="text-gray-600">
          Be the first to share your experience with this business!
        </p>
      </div>
    )
  }
  
  // Fetch all profiles in a single query
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, avatar_url')
    .in('id', profileIds)
  
  // Create profile map
  const profileMap: Record<string, Profile> = {}
  if (profilesData) {
    profilesData.forEach(profile => {
      profileMap[profile.id] = profile
    })
  }
  
  // Add profile data to reviews
  reviews.forEach(review => {
    review.profile = profileMap[review.profile_id]
  })
  
  // Calculate statistics
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews 
    : 0
  
  const ratingCounts = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  }
  
  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {totalReviews > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Overall rating */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Reviews</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl font-bold text-gray-900">
                  {averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex text-yellow-400 mb-1">
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
                  <div className="text-sm text-gray-600">
                    Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Rating distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{rating}</span>
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-yellow-400 h-full transition-all duration-300" 
                      style={{ 
                        width: `${totalReviews > 0 ? (ratingCounts[rating as keyof typeof ratingCounts] / totalReviews) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <div className="text-sm text-gray-600 w-8 text-right">
                    {ratingCounts[rating as keyof typeof ratingCounts]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => {
          const isOwner = currentUserId === review.profile_id
          const canEdit = isOwner && new Date(review.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          const isEdited = review.updated_at !== review.created_at
          
          return (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                    {review.profile?.avatar_url ? (
                      <Image
                        src={review.profile.avatar_url}
                        alt={review.profile.display_name || review.profile.full_name || 'User'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-semibold text-lg">
                        {(review.profile?.display_name || review.profile?.full_name || 'U').substring(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* User info and rating */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {review.profile?.display_name || review.profile?.full_name || 'Anonymous User'}
                      </h4>
                      {isEdited && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Edited
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
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
                      <span className="text-sm text-gray-600">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Edit/Delete buttons for review owner */}
                {canEdit && (
                  <ReviewActions 
                    review={review} 
                  />
                )}
              </div>
              
              {/* Review content */}
              {review.title && (
                <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
              )}
              
              <p className="text-gray-700 leading-relaxed mb-4">{review.content}</p>
              
              {/* Review actions */}
              <div className="flex items-center pt-4 border-t border-gray-100">
                <ReviewActions 
                  review={review} 
                  mode="helpful-only"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}