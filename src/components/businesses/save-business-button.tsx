// src/components/businesses/save-business-button.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type SaveBusinessButtonProps = {
  businessId: string
  isSaved?: boolean
  savedId?: string | null
}

export default function SaveBusinessButton({ businessId, isSaved = false, savedId }: SaveBusinessButtonProps) {
  const [saved, setSaved] = useState(isSaved)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  
  const handleToggleSave = async () => {
    // Add null check
  if (!supabase) {
    setError('Unable to connect to database')
    
    return
  }
    setIsLoading(true)
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        window.location.href = `/login?redirect_to=${encodeURIComponent(window.location.pathname)}`
        return
      }
      
      if (saved) {
        const { error } = await supabase
          .from('saved_businesses')
          .delete()
          .eq('profile_id', session.user.id)
          .eq('business_id', businessId)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('saved_businesses')
          .insert({
            profile_id: session.user.id,
            business_id: businessId
          })
        
        if (error) throw error
      }
      
      setSaved(!saved)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Failed to save/unsave. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <button
      type="button"
      onClick={handleToggleSave}
      disabled={isLoading}
      className="flex items-center justify-center h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      title={saved ? 'Remove from saved' : 'Save business'}
    >
      {saved ? (
        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
      ) : (
        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )}
    </button>
  )
}