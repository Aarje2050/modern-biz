'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Calendar, TrendingUp, Users, Eye, Phone, MapPin, Star, Share2 } from 'lucide-react'
import AnalyticsDateRangePicker from '@/components/analytics/date-range-picker'
import BusinessViewsChart from '@/components/analytics/business-views-chart'
import BusinessInteractionsChart from '@/components/analytics/business-interactions-chart'
import ReviewsAnalytics from '@/components/analytics/reviews-analytics'
import { 
  useUserBusinesses, 
  useBusinessMetrics,
  useAnalyticsAvailability
} from '@/hooks/useAnalytics'

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
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Coming Soon</h1>
            <p className="text-gray-600 mb-6">
              We're setting up your business analytics. This feature will be available shortly.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  // If user has no businesses
  if (!loadingBusinesses && (!businesses || businesses.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Start Getting Analytics</h1>
            <p className="text-gray-600 mb-6">
              Add your business to start tracking performance metrics and customer engagement.
            </p>
            <a 
              href="/businesses/add" 
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your Business
              <TrendingUp className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    )
  }
  
  // Find selected business
  const selectedBusiness = businesses?.find(b => b.id === businessId) || businesses?.[0]
  
  // Stats for display
  const performanceStats = [
    { 
      title: 'Profile Views', 
      value: metrics?.views || 0,
      change: '+12%',
      icon: Eye,
      color: 'blue',
      description: 'People viewed your business profile'
    },
    { 
      title: 'Customer Actions', 
      value: metrics?.interactions || 0,
      change: '+8%', 
      icon: Phone,
      color: 'green',
      description: 'Calls, directions, and website visits'
    },
    { 
      title: 'Reviews Received', 
      value: metrics?.reviews || 0,
      change: '+15%',
      icon: Star,
      color: 'yellow',
      description: 'New customer reviews'
    },
    { 
      title: 'Average Rating', 
      value: metrics?.avgRating || 0,
      change: metrics && metrics.avgRating > 4 ? '+2%' : '0%',
      icon: Star,
      color: 'purple',
      description: 'Your business rating',
      format: 'rating'
    }
  ]
  
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Business Analytics</h1>
              {selectedBusiness && (
                <p className="text-gray-600 mt-2 flex items-center">
                  <span className="font-medium">{selectedBusiness.name}</span>
                  <span className="mx-2">•</span>
                  <span>Performance insights for the {TIME_RANGES[range].name.toLowerCase()}</span>
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {businesses && businesses.length > 1 && (
                <select 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        </div>
        
        {/* Performance Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceStats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  {loadingMetrics ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg border ${getColorClasses(stat.color)}`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
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
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">{stat.title}</h3>
                        <p className="text-3xl font-bold text-gray-900 mb-2">
                          {stat.format === 'rating' && stat.value > 0 
                            ? `${stat.value} ★` 
                            : stat.value.toLocaleString()
                          }
                        </p>
                        <p className="text-sm text-gray-500">{stat.description}</p>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Charts Section */}
        {businessId && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm">
                <BusinessViewsChart 
                  businessId={businessId}
                  days={days}
                />
              </div>
              
              <div className="bg-white rounded-lg shadow-sm">
                <BusinessInteractionsChart 
                  businessId={businessId}
                  days={days}
                />
              </div>
            </div>
            
            {/* Reviews Analytics */}
            <div className="mb-8">
              <ReviewsAnalytics 
                businessId={businessId}
                days={days}
              />
            </div>
            
            {/* Insights & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Performance Insights */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Performance Insights</h3>
                <div className="space-y-4">
                  {metrics?.views && metrics.views > 0 ? (
                    <>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Strong Profile Views</p>
                          <p className="text-sm text-gray-600">
                            Your business is getting {metrics.views} views. Keep your profile updated!
                          </p>
                        </div>
                      </div>
                      
                      {metrics.avgRating > 4 && (
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Excellent Rating</p>
                            <p className="text-sm text-gray-600">
                              Your {metrics.avgRating}★ rating is helping attract more customers.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {(metrics.interactions / Math.max(metrics.views, 1)) > 0.1 && (
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">High Engagement</p>
                            <p className="text-sm text-gray-600">
                              Visitors are taking action on your profile. Great job!
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <TrendingUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500">More insights will appear as you get more activity</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Items */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Recommended Actions</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Add More Photos</p>
                      <p className="text-sm text-gray-600">
                        Businesses with photos get 3x more views.
                      </p>
                      <a href={`/dashboard/businesses/${businessId}/media`} className="text-sm text-blue-600 hover:underline">
                        Add photos →
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-0.5">
                      <Star className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Encourage Reviews</p>
                      <p className="text-sm text-gray-600">
                        Ask satisfied customers to leave reviews.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mt-0.5">
                      <Share2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Share Your Profile</p>
                      <p className="text-sm text-gray-600">
                        Share your business profile on social media.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Upgrade Prompt */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Unlock Advanced Analytics</h3>
                  <p className="text-blue-100 mb-4">
                    Get detailed competitor insights, customer demographics, and conversion tracking
                  </p>
                  <ul className="text-sm text-blue-100 space-y-1">
                    <li>• Competitor performance comparison</li>
                    <li>• Customer demographic breakdown</li>
                    <li>• Lead source tracking & conversion rates</li>
                    <li>• Monthly performance reports via email</li>
                    <li>• Export analytics data to CSV</li>
                  </ul>
                </div>
                <div className="text-center ml-8">
                  <div className="bg-white/20 rounded-lg p-4 mb-4">
                    <p className="text-3xl font-bold">$29</p>
                    <p className="text-sm">per month</p>
                  </div>
                  <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                    Upgrade to Premium
                  </button>
                  <p className="text-xs text-blue-200 mt-2">Cancel anytime</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}