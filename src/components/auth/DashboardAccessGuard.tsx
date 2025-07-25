// src/components/auth/DashboardAccessGuard.tsx - DEBUG VERSION
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useDashboardAccess, useUnifiedAuth } from '@/providers/app-provider'

interface DashboardAccessGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectToLogin?: boolean
}

/**
 * ENTERPRISE: Dashboard access guard with enhanced debugging
 */
export function DashboardAccessGuard({ 
  children, 
  fallback, 
  redirectToLogin = true 
}: DashboardAccessGuardProps) {
  const router = useRouter()
  const { canAccess, loading, shouldRedirectToLogin, shouldShowAccessDenied } = useDashboardAccess()
  const { user, permissions, isAuthenticated } = useUnifiedAuth()

  // Enhanced logging for debugging
  useEffect(() => {
    console.log('🛡️ [DASHBOARD-GUARD] State:', {
      loading,
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      canAccess,
      shouldRedirectToLogin,
      shouldShowAccessDenied,
      permissions: permissions ? {
        canAccessDashboard: permissions.canAccessDashboard,
        isBusinessOwner: permissions.isBusinessOwner,
        isGlobalAdmin: permissions.isGlobalAdmin,
        isSiteAdmin: permissions.isSiteAdmin
      } : null
    })
  }, [loading, isAuthenticated, user, canAccess, shouldRedirectToLogin, shouldShowAccessDenied, permissions])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (shouldRedirectToLogin && redirectToLogin) {
      console.log('🛡️ [DASHBOARD-GUARD] Redirecting to login - not authenticated')
      const currentPath = window.location.pathname
      router.push(`/login?redirect_to=${encodeURIComponent(currentPath)}`)
    }
  }, [shouldRedirectToLogin, redirectToLogin, router])

  // Show loading state
  if (loading) {
    console.log('🛡️ [DASHBOARD-GUARD] Showing loading state')
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Checking access...</p>
        </div>
      </div>
    )
  }

  // Show access denied
  if (shouldShowAccessDenied) {
    console.log('🛡️ [DASHBOARD-GUARD] Showing access denied')
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access the dashboard. Please contact support if you believe this is an error.
          </p>
          
          
          
          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Allow access
  if (canAccess) {
    console.log('🛡️ [DASHBOARD-GUARD] Access granted - rendering dashboard')
    return <>{children}</>
  }

  // Fallback (shouldn't reach here)
  console.log('🛡️ [DASHBOARD-GUARD] Unexpected state - no access decision made')
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <p className="text-gray-600">Unexpected authentication state. Please refresh the page.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-blue-600 hover:text-blue-500 underline"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}

/**
 * CONVENIENCE: Higher-order component for dashboard pages
 */
export function withDashboardAccess<P extends object>(
  Component: React.ComponentType<P>
) {
  return function DashboardPage(props: P) {
    return (
      <DashboardAccessGuard>
        <Component {...props} />
      </DashboardAccessGuard>
    )
  }
}

/**
 * CONVENIENCE: Permission-based conditional rendering
 */
interface PermissionGateProps {
  permission: 'canAccessDashboard' | 'canAccessAnalytics' | 'canAccessCRM' | 'canManageBusinesses'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { permissions, loading } = useUnifiedAuth()
  
  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 rounded w-16"></div>
  }
  
  const hasPermission = permissions?.[permission] || false
  
  return hasPermission ? <>{children}</> : <>{fallback}</>
}