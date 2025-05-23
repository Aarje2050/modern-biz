// src/components/client-only.tsx (NEW FILE - WRAPPER FOR CLIENT-SIDE COMPONENTS)
'use client'

import { useState, useEffect } from 'react'

interface ClientOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Wrapper component that only renders children on the client side.
 * Prevents SSR issues with components that use browser-only APIs.
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Loading fallback for components
export function ClientOnlyWithLoading({ 
  children, 
  loading 
}: { 
  children: React.ReactNode
  loading?: React.ReactNode 
}) {
  return (
    <ClientOnly
      fallback={
        loading || (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        )
      }
    >
      {children}
    </ClientOnly>
  )
}

// Specific wrapper for Supabase components
export function SupabaseClientOnly({ 
  children, 
  fallback 
}: ClientOnlyProps) {
  return (
    <ClientOnly
      fallback={
        fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )
      }
    >
      {children}
    </ClientOnly>
  )
}