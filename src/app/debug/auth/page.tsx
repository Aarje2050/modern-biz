// src/app/debug/auth/page.tsx - TEMPORARY DEBUG PAGE
'use client'

import { useUnifiedAuth } from '@/hooks/useUnifiedAuth'
import { useSiteContext } from '@/hooks/useSiteContext'

export default function AuthDebugPage() {
  const { 
    user, 
    permissions, 
    loading, 
    error,
    canAccessDashboard,
    isBusinessOwner,
    isAdmin,
    refreshPermissions 
  } = useUnifiedAuth()
  
  const { siteConfig } = useSiteContext()

  if (loading) {
    return <div className="p-8">Loading auth state...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔐 Auth Debug Dashboard</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}
      
      <div className="grid gap-6">
        {/* Basic Auth Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Basic Auth</h2>
          <div className="space-y-2">
            <p><strong>User ID:</strong> {user?.id || 'Not authenticated'}</p>
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            <p><strong>Authenticated:</strong> {user ? '✅' : '❌'}</p>
          </div>
        </div>

        {/* Site Context */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Site Context</h2>
          <div className="space-y-2">
            <p><strong>Site ID:</strong> {siteConfig?.id || 'None'}</p>
            <p><strong>Site Name:</strong> {siteConfig?.name || 'None'}</p>
            <p><strong>Site Type:</strong> {siteConfig?.site_type || 'None'}</p>
          </div>
        </div>

        {/* Permissions Overview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">🔑 Permissions Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded ${canAccessDashboard ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`font-medium ${canAccessDashboard ? 'text-green-700' : 'text-red-700'}`}>
                Dashboard Access: {canAccessDashboard ? '✅ YES' : '❌ NO'}
              </p>
            </div>
            <div className={`p-3 rounded ${isBusinessOwner ? 'bg-green-50' : 'bg-gray-50'}`}>
              <p className={`font-medium ${isBusinessOwner ? 'text-green-700' : 'text-gray-700'}`}>
                Business Owner: {isBusinessOwner ? '✅ YES' : '❌ NO'}
              </p>
            </div>
            <div className={`p-3 rounded ${isAdmin ? 'bg-green-50' : 'bg-gray-50'}`}>
              <p className={`font-medium ${isAdmin ? 'text-green-700' : 'text-gray-700'}`}>
                Admin: {isAdmin ? '✅ YES' : '❌ NO'}
              </p>
            </div>
            <div className={`p-3 rounded ${permissions?.canAccessAnalytics ? 'bg-green-50' : 'bg-gray-50'}`}>
              <p className={`font-medium ${permissions?.canAccessAnalytics ? 'text-green-700' : 'text-gray-700'}`}>
                Analytics: {permissions?.canAccessAnalytics ? '✅ YES' : '❌ NO'}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Permissions */}
        {permissions && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">📋 Detailed Permissions</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Site Role:</strong> {permissions.siteRole || 'None'}</p>
              <p><strong>Global Admin:</strong> {permissions.isGlobalAdmin ? '✅' : '❌'}</p>
              <p><strong>Site Admin:</strong> {permissions.isSiteAdmin ? '✅' : '❌'}</p>
              <p><strong>Business Owner:</strong> {permissions.isBusinessOwner ? '✅' : '❌'}</p>
              <p><strong>Owned Businesses:</strong> {permissions.ownedBusinesses.length}</p>
              <p><strong>Plan Type:</strong> {permissions.planType}</p>
            </div>
          </div>
        )}

        {/* Raw Data */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">🔧 Raw Data</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Permissions Object:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(permissions, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">Site Config:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(siteConfig, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">🎯 Actions</h2>
          <div className="space-x-4">
            <button
              onClick={refreshPermissions}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Permissions
            </button>
            {canAccessDashboard && (
              <a
                href="/dashboard"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Go to Dashboard
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}