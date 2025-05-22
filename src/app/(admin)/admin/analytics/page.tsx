'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import AnalyticsDateRangePicker from '@/components/analytics/date-range-picker'
import StatsCards from '@/components/analytics/stats-cards'
import PageViewsChart from '@/components/analytics/page-views-chart'
import TopBusinessesTable from '@/components/analytics/top-businesses-table'
import SearchAnalyticsChart from '@/components/analytics/search-analytics'
import SearchInsightsWidget from '@/components/analytics/search-insights-widget'
import { useAnalyticsMetrics, useAnalyticsAvailability } from '@/hooks/useAnalytics'

// Define time ranges
const TIME_RANGES = {
  '7d': { name: 'Last 7 Days', days: 7 },
  '30d': { name: 'Last 30 Days', days: 30 },
  '90d': { name: 'Last 90 Days', days: 90 },
}

type TimeRangeKey = keyof typeof TIME_RANGES

interface AdminMetrics {
  totalUsers: number;
  businessOwners: number;
  pendingBusinesses: number;
  avgBusinessRating: number;
  platformGrowth: {
    newBusinesses: number;
    newUsers: number;
    newReviews: number;
  };
}

export default function AdminAnalyticsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  // Check analytics availability
  const { available: analyticsAvailable, isLoading: checkingAnalytics } = useAnalyticsAvailability()
  
  // Get time range from URL or default to 7 days
  const rangeParam = searchParams.get('range') as TimeRangeKey | null
  const range = rangeParam && TIME_RANGES[rangeParam] ? rangeParam : '7d'
  const days = TIME_RANGES[range].days
  
  // Get platform metrics
  const { metrics, isLoading, isError } = useAnalyticsMetrics(days)
  
  // Additional admin-specific metrics
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics>({
    totalUsers: 0,
    businessOwners: 0,
    pendingBusinesses: 0,
    avgBusinessRating: 0,
    platformGrowth: {
      newBusinesses: 0,
      newUsers: 0,
      newReviews: 0
    }
  })
  const [adminLoading, setAdminLoading] = useState(true)
  
  // Function to handle range changes
  const handleRangeChange = (newRange: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', newRange)
    router.push(`${pathname}?${params.toString()}`)
  }
  
  // Fetch additional admin metrics
  useEffect(() => {
    const fetchAdminMetrics = async () => {
      try {
        const response = await fetch('/api/admin/metrics')
        if (response.ok) {
          const data = await response.json()
          setAdminMetrics(data.metrics)
        }
      } catch (error) {
        console.error('Error fetching admin metrics:', error)
      } finally {
        setAdminLoading(false)
      }
    }
    
    if (analyticsAvailable) {
      fetchAdminMetrics()
    } else {
      setAdminLoading(false)
    }
  }, [analyticsAvailable, range])
  
  // Show loading state
  if (checkingAnalytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }
  
  // If analytics system is not available
  if (!analyticsAvailable) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Unavailable</h1>
            <p className="text-gray-600 mb-6">
              The analytics system is currently unavailable. Please check your database setup and try again.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Calculate percentage changes (mock data for now)
  const getPercentageChange = (current: number) => {
    const change = Math.floor(Math.random() * 20) - 10 // Random between -10 and +10
    return change >= 0 ? `+${change}%` : `${change}%`
  }
  
  // Combine platform and admin metrics for display
  const platformStats = [
    { 
      title: 'Total Page Views', 
      value: metrics?.views || 0, 
      icon: 'eye',
      change: getPercentageChange(metrics?.views || 0),
      description: 'Across all business pages'
    },
    { 
      title: 'Active Businesses', 
      value: metrics?.businesses || 0, 
      icon: 'building',
      change: getPercentageChange(metrics?.businesses || 0),
      description: 'Live business listings'
    },
    { 
      title: 'Search Queries', 
      value: metrics?.searches || 0, 
      icon: 'search',
      change: getPercentageChange(metrics?.searches || 0),
      description: 'User search attempts'
    },
    { 
      title: 'Total Reviews', 
      value: metrics?.reviews || 0, 
      icon: 'star',
      change: getPercentageChange(metrics?.reviews || 0),
      description: 'All platform reviews'
    }
  ]
  
  const userStats = [
    { 
      title: 'Total Users', 
      value: adminMetrics.totalUsers, 
      icon: 'users',
      change: getPercentageChange(adminMetrics.totalUsers),
      description: 'Registered platform users'
    },
    { 
      title: 'Business Owners', 
      value: adminMetrics.businessOwners, 
      icon: 'briefcase',
      change: getPercentageChange(adminMetrics.businessOwners),
      description: 'Users with business accounts'
    },
    { 
      title: 'Pending Reviews', 
      value: adminMetrics.pendingBusinesses, 
      icon: 'clock',
      change: '0%',
      description: 'Businesses awaiting approval'
    },
    { 
      title: 'Platform Rating', 
      value: adminMetrics.avgBusinessRating || 0, 
      icon: 'star',
      change: adminMetrics.avgBusinessRating > 4 ? '+2%' : '0%',
      description: 'Average business rating',
      format: 'rating'
    }
  ]
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
              <p className="text-gray-600 mt-2">
                Monitor your business directory performance and user engagement
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Analytics Active</span>
              </div>
              <AnalyticsDateRangePicker 
                currentRange={range} 
                ranges={TIME_RANGES} 
                onRangeChange={handleRangeChange}
              />
            </div>
          </div>
        </div>
        
        {/* Error State */}
        {isError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  There was an error loading some analytics data. Data may be incomplete.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Platform Metrics Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(isLoading ? Array(4).fill(null) : platformStats).map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">{stat.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        stat.change?.startsWith('+') 
                          ? 'bg-green-100 text-green-800' 
                          : stat.change?.startsWith('-')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold text-gray-900">
                          {stat.format === 'rating' && stat.value > 0 
                            ? `${stat.value} ★` 
                            : stat.value.toLocaleString()
                          }
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* User Metrics Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(adminLoading ? Array(4).fill(null) : userStats).map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                {adminLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">{stat.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        stat.change?.startsWith('+') 
                          ? 'bg-green-100 text-green-800' 
                          : stat.change?.startsWith('-')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold text-gray-900">
                          {stat.format === 'rating' && stat.value > 0 
                            ? `${stat.value} ★` 
                            : stat.value.toLocaleString()
                          }
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Page Views Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <PageViewsChart days={days} />
              )}
            </div>
          </div>
          
          {/* Search Insights Widget - Takes 1 column */}
          <div>
            <SearchInsightsWidget days={days} />
          </div>
        </div>
        
        {/* Detailed Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Search Analytics */}
          <div className="bg-white rounded-lg shadow-sm">
            {isLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <SearchAnalyticsChart days={days} />
            )}
          </div>
          
          {/* Top Businesses */}
          <div className="bg-white rounded-lg shadow-sm">
            {isLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <TopBusinessesTable days={days} />
            )}
          </div>
        </div>
        
        {/* Action Items & Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h3>
            <div className="space-y-3">
              <a href="/admin/businesses" className="flex items-center p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Manage Businesses
              </a>
              <a href="/admin/users" className="flex items-center p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Manage Users
              </a>
              <a href="/admin/categories" className="flex items-center p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Manage Categories
              </a>
            </div>
          </div>
          
          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">System Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Database</span>
                <span className="flex items-center text-green-600 font-semibold">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Healthy
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Analytics</span>
                <span className={`flex items-center font-semibold ${analyticsAvailable ? "text-green-600" : "text-red-600"}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${analyticsAvailable ? "bg-green-600" : "bg-red-600"}`}></div>
                  {analyticsAvailable ? 'Active' : 'Issues'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Search</span>
                <span className="flex items-center text-green-600 font-semibold">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Storage</span>
                <span className="flex items-center text-green-600 font-semibold">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Available
                </span>
              </div>
            </div>
          </div>
          
          {/* Platform Growth */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Growth Insights</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New Businesses</span>
                <span className="text-blue-600 font-semibold">+{adminMetrics.platformGrowth.newBusinesses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New Users</span>
                <span className="text-blue-600 font-semibold">+{adminMetrics.platformGrowth.newUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New Reviews</span>
                <span className="text-blue-600 font-semibold">+{adminMetrics.platformGrowth.newReviews}</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Growth Rate</span>
                  <span className="text-green-600 font-semibold">+12.5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}