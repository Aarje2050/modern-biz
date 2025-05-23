// src/components/profile/profile-form.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ProfileFormProps = {
  profile: any
  userId: string
}

export default function ProfileForm({ profile, userId }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    display_name: profile?.display_name || '',
    settings: profile?.settings || {}
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error'} | null>(null)
  const supabase = createClient()

  // Add null check
  if (!supabase) {
    
    return
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          display_name: formData.display_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        
      if (error) throw error
      
      setMessage({
        text: 'Profile updated successfully',
        type: 'success'
      })
      
      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage({
        text: error.message || 'An error occurred while updating your profile',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div 
          className={`p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}
      
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
          Display Name (Public)
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="display_name"
            name="display_name"
            value={formData.display_name}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            This is the name that will be displayed publicly. If left empty, your full name will be used.
          </p>
        </div>
      </div>
      
      {/* Avatar upload functionality could be added here */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Profile Picture
        </label>
        <div className="mt-1 flex items-center">
          <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </span>
          <button
            type="button"
            className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            onClick={() => alert('Avatar upload not implemented in this version')}
          >
            Change
          </button>
        </div>
      </div>
      
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}