// src/components/reviews/review-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type ReviewFormProps = {
  businessId: string
  onReviewSubmitted?: () => void
}

export default function ReviewForm({ businessId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userHasReviewed, setUserHasReviewed] = useState(false)
  const [loading, setLoading] = useState(true)

  
  const supabase = createClient()
  // Add null check
  if (!supabase) {
    setError('Unable to connect to database')
    setLoading(false)
    return
  }
  
  // Check if user has already reviewed this business
  const checkExistingReview = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return
      
      const { data: existingReview } = await supabase
        .from('reviews') // Use the public view/table for reviews
        .select('id')
        .eq('business_id', businessId)
        .eq('profile_id', session.user.id)
        .maybeSingle()
      
      if (existingReview) {
        setUserHasReviewed(true)
      }
    } catch (error) {
      console.error('Error checking existing review:', error)
    }
  }
  
  // Call this when component mounts
  useEffect(() => {
    checkExistingReview()
  }, []) // Empty dependency array so it only runs once on mount
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Validate form
      if (rating === 0) {
        throw new Error('Please select a rating')
      }
      
      if (!content.trim()) {
        throw new Error('Please enter a review')
      }
      
      // Get user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = `/login?redirect_to=${encodeURIComponent(window.location.pathname)}`
        return
      }
      
      // Submit review to the public view/table
      const { error: reviewError } = await supabase
        .from('reviews') // Use the public view/table for reviews
        .insert({
          business_id: businessId,
          profile_id: session.user.id,
          rating,
          title: title.trim() || null,
          content: content.trim(),
          status: 'published', // Or 'pending' if you want moderation
        })
      
      if (reviewError) {
        console.error('Review submission error:', reviewError)
        throw new Error(reviewError.message || 'Failed to submit your review')
      }
      
      // Success
      setSuccess('Your review has been submitted successfully!')
      setUserHasReviewed(true)
      setRating(0)
      setTitle('')
      setContent('')
      
      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted()
      }
      
      // Refresh the page after a delay to show the new review
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error: any) {
      setError(error.message || 'Failed to submit your review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (userHasReviewed) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-4 mb-6">
        <p className="text-sm">You have already reviewed this business. Thank you for your feedback!</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 mb-4">
          <p className="text-sm">{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-full"
              >
                <svg 
                  className={`h-8 w-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
            </span>
          </div>
        </div>
        
        <div>
          <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-1">
            Title (Optional)
          </label>
          <input
            type="text"
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
            placeholder="Summarize your experience"
            maxLength={100}
          />
        </div>
        
        <div>
          <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-1">
            Review <span className="text-red-500">*</span>
          </label>
          <textarea
            id="review-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
            placeholder="Share your experience with this business"
            maxLength={1000}
          />
          <p className="mt-1 text-xs text-gray-500">
            {1000 - content.length} characters remaining
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Fields marked with <span className="text-red-500">*</span> are required
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  )
}