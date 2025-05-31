// src/app/(dashboard)/dashboard/page.tsx - ENTERPRISE FIXED VERSION
'use client'

import { useAuth, useSiteContext, useUnifiedAuth } from '@/providers/app-provider'
import { DashboardAccessGuard } from '@/components/auth/DashboardAccessGuard'
import dynamic from 'next/dynamic'

// Lazy load components to prevent SSR issues
const AdminDashboard = dynamic(() => import('@/components/crm/admin-dashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false
})

const BusinessOwnerDashboard = dynamic(() => import('@/components/crm/business-owner-dashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false
})

const UserDashboard = dynamic(() => import('@/components/crm/user-dashboard'), {
  loading: () => <DashboardSkeleton />
})



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

function DashboardContent() {
  const { 
    permissions, 
    loading, 
    error, 
    isAdmin, 
    isBusinessOwner 
  } = useUnifiedAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

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
                <h3 className="text-sm font-medium text-red-800">Dashboard Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ENTERPRISE: Simple, reliable dashboard routing
  const renderDashboard = () => {
    console.log('🎯 Dashboard routing:', { 
      isAdmin, 
      isBusinessOwner, 
      ownedBusinesses: permissions?.ownedBusinesses?.length || 0 
    })

    // Global or Site Admin
    if (isAdmin) {
      return <AdminDashboard />
    }

    // Business Owner (has businesses or site role)
    if (isBusinessOwner && permissions?.ownedBusinesses && permissions.ownedBusinesses.length > 0) {
      return <BusinessOwnerDashboard />
    }

    // Regular User
    return <UserDashboard />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Debug Info (remove in production) */}
        <div className="mb-4 p-2 bg-blue-50 rounded text-xs">
          <strong>Debug:</strong> Admin: {isAdmin ? 'Yes' : 'No'} | 
          Business Owner: {isBusinessOwner ? 'Yes' : 'No'} | 
          Businesses: {permissions?.ownedBusinesses?.length || 0}
        </div>
        
        {renderDashboard()}
      </div>
    </div>
  )
}

export default function EnhancedDashboard() {
  return (
    <DashboardAccessGuard>
      <DashboardContent />
    </DashboardAccessGuard>
  )
}