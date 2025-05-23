// src/components/payments/payment-form-wrapper.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PaymentForm from './payment-form'

interface PaymentFormWrapperProps {
  planId: string
  businessId: string | null
  onSuccess: (subscriptionId: string) => void
  onCancel: () => void
  userCountry?: string
}

export default function PaymentFormWrapper({
  planId,
  businessId,
  onSuccess,
  onCancel,
  userCountry = 'US'
}: PaymentFormWrapperProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Add null check
  if (!supabase) {
    
    setLoading(false)
    return
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
      setLoading(false)
    }
    
    getUser()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">You must be logged in to continue with payment.</p>
        <button
          onClick={onCancel}
          className="mt-4 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <PaymentForm
      planId={planId}
      userId={userId}
      businessId={businessId}
      onSuccess={onSuccess}
      onCancel={onCancel}
      userCountry={userCountry}
    />
  )
}