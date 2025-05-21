// src/components/businesses/save-business-button.tsx (updated with schema)
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
  const supabase = createClient()
  
  const handleToggleSave = async () => {
    setIsLoading(true)
    
    try {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error('Authentication error. Please try again.')
      }
      
      if (!session) {
        // Redirect to login if not authenticated
        window.location.href = `/login?redirect_to=${encodeURIComponent(window.location.pathname)}`
        return
      }
      
      if (saved) {
        // Unsave - delete the record
        if (savedId) {
          // If we have the saved_id, use it for a more precise delete
          const { error: deleteError } = await supabase
            .from('core.saved_businesses') // Specify schema here
            .delete()
            .eq('id', savedId)
          
          if (deleteError) {
            console.error('Delete error:', deleteError)
            throw new Error(deleteError.message || 'Failed to remove from saved businesses')
          }
        } else {
          // Otherwise delete based on profile_id and business_id
          const { error: deleteError } = await supabase
            .from('core.saved_businesses') // Specify schema here
            .delete()
            .eq('profile_id', session.user.id)
            .eq('business_id', businessId)
          
          if (deleteError) {
            console.error('Delete error:', deleteError)
            throw new Error(deleteError.message || 'Failed to remove from saved businesses')
          }
        }
        
        console.log('Successfully removed from saved businesses')
      } else {
        // Save - insert a new record
        console.log('Attempting to save business with ID:', businessId, 'for user:', session.user.id)
        
        const { error: insertError } = await supabase
          .from('core.saved_businesses') // Specify schema here
          .insert({
            profile_id: session.user.id,
            business_id: businessId
          })
        
        if (insertError) {
          console.error('Insert error:', insertError)
          throw new Error(insertError.message || 'Failed to save business')
        }
        
        console.log('Successfully saved business')
      }
      
      setSaved(!saved)
      
      // If on the saved page and unsaving, refresh to update the list
      if (saved && window.location.pathname === '/saved') {
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Error toggling save:', error)
      alert(error.message || 'Failed to save/unsave. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <button
      type="button"
      onClick={handleToggleSave}
      disabled={isLoading}
      className={`flex items-center justify-center h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title={saved ? 'Remove from saved' : 'Save business'}
    >
      {saved ? (
        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
      ) : (
        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )}
    </button>
  )
}