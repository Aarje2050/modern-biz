'use client'

// src/components/reviews/review-actions.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Review = {
  id: string
  rating: number
  title: string | null
  content: string
  created_at: string
  updated_at: string
  helpful_count: number
  profile_id: string
}

type ReviewActionsProps = {
  review: Review
  mode?: 'full' | 'helpful-only'
}

export default function ReviewActions({ 
  review, 
  mode = 'full' 
}: ReviewActionsProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editForm, setEditForm] = useState({
    rating: review.rating,
    title: review.title || '',
    content: review.content
  })
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [helpfulState, setHelpfulState] = useState({
    count: review.helpful_count,
    userVoted: false,
    loading: false
  })
  
  const supabase = createClient()
  if (!supabase) {

    return
  }
  const isOwner = currentUser === review.profile_id
  const canEdit = isOwner && new Date(review.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user?.id || null)
      
      // Check helpful vote status
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/reviews/${review.id}/helpful`)
          if (response.ok) {
            const data = await response.json()
            setHelpfulState(prev => ({
              ...prev,
              userVoted: data.user_voted,
              count: data.helpful_count
            }))
          }
        } catch (error) {
          console.error('Error checking helpful status:', error)
        }
      }
    }
    
    getUser()
  }, [review.id, supabase.auth])
  
  const handleEdit = async () => {
    if (!editForm.content.trim() || editForm.rating < 1 || editForm.rating > 5) {
      alert('Please provide valid rating and content')
      return
    }
    
    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      
      if (response.ok) {
        setIsEditing(false)
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update review')
      }
    } catch (error) {
      console.error('Error updating review:', error)
      alert('Failed to update review')
    }
  }
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete review')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const handleHelpful = async () => {
    if (!currentUser) {
      // Redirect to login
      window.location.href = `/login?redirect_to=${encodeURIComponent(window.location.pathname)}`
      return
    }
    
    setHelpfulState(prev => ({ ...prev, loading: true }))
    
    try {
      const response = await fetch(`/api/reviews/${review.id}/helpful`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setHelpfulState({
          count: data.helpful_count,
          userVoted: data.user_voted,
          loading: false
        })
      } else {
        throw new Error('Failed to update helpful vote')
      }
    } catch (error) {
      console.error('Error updating helpful vote:', error)
      setHelpfulState(prev => ({ ...prev, loading: false }))
    }
  }
  
  if (mode === 'helpful-only') {
    return (
      <button
        onClick={handleHelpful}
        disabled={helpfulState.loading}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-colors ${
          helpfulState.userVoted
            ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <svg 
          className={`w-4 h-4 ${helpfulState.userVoted ? 'text-blue-600' : 'text-gray-400'}`} 
          fill={helpfulState.userVoted ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" 
          />
        </svg>
        {helpfulState.userVoted ? 'Helpful' : 'Mark as helpful'} ({helpfulState.count})
      </button>
    )
  }
  
  if (!canEdit) return null
  
  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <div className="w-full space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEditForm(prev => ({ ...prev, rating: star }))}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <svg 
                    className={`w-6 h-6 ${star <= editForm.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title (Optional)</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Review title"
              maxLength={100}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
            <textarea
              value={editForm.content}
              onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Share your experience"
              maxLength={1000}
            />
            <p className="mt-1 text-xs text-gray-500">
              {1000 - editForm.content.length} characters remaining
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </>
      )}
    </div>
  )
}