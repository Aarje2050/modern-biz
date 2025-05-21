// src/app/(dashboard)/dashboard/analytics/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import AnalyticsDateRangePicker from '@/components/analytics/date-range-picker'
import StatsCards from '@/components/analytics/stats-cards'
import { 
  useUserBusinesses, 
  useBusinessMetrics,
  useSafeAnalytics,
  useAnalyticsAvailability
} from '@/hooks/useAnalytics'

// Import with error fallbacks
const BusinessViewsChart = dynamic(() => 
  import('@/components/analytics/business-views-chart'), {
    loading: () => <div className="h-80 bg-white p-6 rounded-lg shadow flex items-center justify-center">Loading chart...</div>,
    ssr: false
  }
)

const BusinessInteractionsChart = dynamic(() => 
  import('@/components/analytics/business-interactions-chart'), {
    loading: () => <div className="h-80 bg-white p-6 rounded-lg shadow flex items-center justify-center">Loading chart...</div>,
    ssr: false
  }
)

const ReviewsAnalytics = dynamic(() => 
  import('@/components/analytics/reviews-analytics'), {
    loading: () => <div className="p-6 bg-white rounded-lg shadow flex items-center justify-center">Loading reviews...</div>,
    ssr: false
  }
)

import dynamic from 'next/dynamic'

// Default time ranges
const TIME_RANGES = {
  '7d': { name: 'Last 7 Days', days: 7 },
  '30d': { name: 'Last 30 Days', days: 30 },
  '90d': { name: 'Last 90 Days', days: 90 },
}

type TimeRangeKey = keyof typeof TIME_RANGES

export default function BusinessAnalyticsPage() {
  // Check if analytics system is available
  const { available: analyticsAvailable, isLoading: checkingAnalytics } = useAnalyticsAvailability()
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  // Get time range from URL or default to 30 days
  const rangeParam = searchParams.get('range') as TimeRangeKey | null
  const range = rangeParam && TIME_RANGES[rangeParam] ? rangeParam : '30d'
  const days = TIME_RANGES[range].days
  
  // Get user's businesses
  const { businesses, isLoading: loadingBusinesses } = useUserBusinesses()
  
  // Calculate date range for display purposes
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // Get selected business ID
  const businessParam = searchParams.get('business')
  const businessId = businessParam || (businesses && businesses.length > 0 ? businesses[0]?.id : '')
  
  // Get business metrics
  const { metrics, isLoading: loadingMetrics } = useBusinessMetrics(businessId || '', days)
  
  // Handlers
  const handleRangeChange = (newRange: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', newRange)
    router.push(`${pathname}?${params.toString()}`)
  }
  
  const handleBusinessChange = (newBusinessId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('business', newBusinessId)
    router.push(`${pathname}?${params.toString()}`)
  }
  
  // Show loading state
  if (checkingAnalytics || loadingBusinesses) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Business Analytics</h1>
        </div>
        <div className="h-32 flex items-center justify-center">
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }
  
  // If analytics system is not available
  if (!analyticsAvailable) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Business Analytics</h1>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">
            Analytics system is currently unavailable. Please try again later.
          </p>
        </div>
      </div>
    )
  }
  
  // If user has no businesses
  if (!loadingBusinesses && (!businesses || businesses.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Business Analytics</h1>
        </div>
        <p>You don't have any businesses to analyze. <a href="/businesses/add" className="text-blue-600 hover:underline">Add a business</a> to see analytics.</p>
      </div>
    )
  }
  
  // Find selected business
  const selectedBusiness = businesses?.find(b => b.id === businessId) || businesses?.[0]
  
  // Stats for display
  const stats = [
    { 
      title: 'Profile Views', 
      value: metrics?.views || 0, 
      icon: 'eye' 
    },
    { 
      title: 'User Interactions', 
      value: metrics?.interactions || 0, 
      icon: 'mouse-pointer' 
    },
    { 
        title: 'New Reviews', 
        value: metrics?.reviews || 0, 
        // Fix the TypeScript error with proper nullish checks
        secondaryValue: metrics && metrics.avgRating > 0 
          ? `${metrics.avgRating} ★` 
          : 'No ratings',
        icon: 'message-square' 
    },
    { 
      title: 'Search Appearances', 
      value: 0, // Placeholder
      icon: 'search' 
    }
  ]
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold">
          {selectedBusiness ? `Business Analytics: ${selectedBusiness.name}` : 'Business Analytics'}
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {businesses && businesses.length > 1 && (
            <select 
              className="p-2 border rounded-md"
              value={businessId || ''}
              onChange={(e) => handleBusinessChange(e.target.value)}
            >
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          )}
          <AnalyticsDateRangePicker 
            currentRange={range} 
            ranges={TIME_RANGES} 
            onRangeChange={handleRangeChange}
          />
        </div>
      </div>
      
      <div className="mb-8">
        {loadingMetrics ? (
          <div className="h-32 flex items-center justify-center">
            <p>Loading statistics...</p>
          </div>
        ) : (
          <StatsCards stats={stats} />
        )}
      </div>
      
      {businessId && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <ErrorBoundary fallback={<div className="h-80 bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Profile Views</h2>
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">Unable to load chart</p>
              </div>
            </div>}>
              <BusinessViewsChart 
                businessId={businessId}
                days={days}
              />
            </ErrorBoundary>
            
            <ErrorBoundary fallback={<div className="h-80 bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">User Interactions</h2>
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">Unable to load chart</p>
              </div>
            </div>}>
              <BusinessInteractionsChart 
                businessId={businessId}
                days={days}
              />
            </ErrorBoundary>
          </div>
          
          <div className="mt-8">
            <ErrorBoundary fallback={<div className="p-6 bg-white rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Reviews Analysis</h2>
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">Unable to load reviews</p>
              </div>
            </div>}>
              <ReviewsAnalytics 
                businessId={businessId}
                days={days}
              />
            </ErrorBoundary>
          </div>
        </>
      )}
    </div>
  )
}

// Simple error boundary component
function ErrorBoundary({ children, fallback }: { children: React.ReactNode, fallback: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error('Error caught by boundary:', event.error)
      setHasError(true)
      // Prevent the error from bubbling up
      event.preventDefault()
    }
    
    window.addEventListener('error', errorHandler)
    
    return () => {
      window.removeEventListener('error', errorHandler)
    }
  }, [])
  
  if (hasError) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}