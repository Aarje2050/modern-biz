// src/app/(dashboard)/dashboard/page.tsx (Enhanced with CRM)
'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/providers/auth-provider'
import { useSupabase } from '@/hooks/useSupabase'

// Lazy load dashboard components for performance
const AdminDashboard = dynamic(() => import('@/components/crm/admin-dashboard'), {
  loading: () => <DashboardSkeleton />
})

const BusinessOwnerDashboard = dynamic(() => import('@/components/crm/business-owner-dashboard'), {
  loading: () => <DashboardSkeleton />
})

const UserDashboard = dynamic(() => import('@/components/crm/user-dashboard'), {
  loading: () => <DashboardSkeleton />
})

// Fallback to existing dashboard if CRM not ready
const LegacyDashboard = dynamic(() => import('@/components/dashboard/dashboard-content'), {
  loading: () => <DashboardSkeleton />
})

interface UserRole {
  account_type: string
  is_admin: boolean
  has_businesses: boolean
  crm_enabled: boolean
}

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function EnhancedDashboard() {
  const { user } = useAuth()
  const supabase = useSupabase()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function determineUserRole() {
      if (!supabase || !user) {
        setIsLoading(false)
        return
      }

      try {
        // Get user profile and determine role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('account_type, metadata')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError

        // Check if user has businesses
        const { count: businessCount, error: businessError } = await supabase
          .from('businesses')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', user.id)

        if (businessError) throw businessError

        // Check admin status (you can customize this logic)
        const isAdmin = profile?.account_type === 'admin' || 
                       profile?.metadata?.role === 'admin'

        // Check if CRM features are enabled for this user/business
        const crmEnabled = profile?.metadata?.crm_enabled !== false // Default to true

        setUserRole({
          account_type: profile?.account_type || 'standard',
          is_admin: isAdmin,
          has_businesses: (businessCount || 0) > 0,
          crm_enabled: crmEnabled
        })

      } catch (err: any) {
        console.error('Error determining user role:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    determineUserRole()
  }, [supabase, user])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    if (!userRole) {
      return <LegacyDashboard />
    }

    // Admin Dashboard (Platform Management CRM)
    if (userRole.is_admin) {
      return userRole.crm_enabled ? (
        <AdminDashboard />
      ) : (
        <LegacyDashboard />
      )
    }

    // Business Owner Dashboard (Customer CRM)
    if (userRole.has_businesses) {
      return userRole.crm_enabled ? (
        <BusinessOwnerDashboard />
      ) : (
        <LegacyDashboard />
      )
    }

    // Regular User Dashboard
    return userRole.crm_enabled ? (
      <UserDashboard />
    ) : (
      <LegacyDashboard />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<DashboardSkeleton />}>
          {renderDashboard()}
        </Suspense>
      </div>
    </div>
  )
}