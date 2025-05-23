// src/components/auth/sign-out-button.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'


export default function SignOutButton() {
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)


  // Add null check
  if (!supabase) {
    setError('Unable to connect to database')
    setLoading(false)
    return
  }
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }
  
  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full flex items-center text-gray-700 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50"
    >
      <svg className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Sign Out
    </button>
  )
}