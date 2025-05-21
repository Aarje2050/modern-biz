// src/app/(admin)/admin/analytics/page.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import AnalyticsDateRangePicker from '@/components/analytics/date-range-picker'
import StatsCards from '@/components/analytics/stats-cards'
import PageViewsChart from '@/components/analytics/page-views-chart'
import TopBusinessesTable from '@/components/analytics/top-businesses-table'
import SearchAnalyticsChart from '@/components/analytics/search-analytics'
import { useAnalyticsMetrics } from '@/hooks/useAnalytics'

// Define time ranges
const TIME_RANGES = {
  '7d': { name: 'Last 7 Days', days: 7 },
  '30d': { name: 'Last 30 Days', days: 30 },
  '90d': { name: 'Last 90 Days', days: 90 },
}

type TimeRangeKey = keyof typeof TIME_RANGES

export default function AdminAnalyticsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  // Get time range from URL or default to 7 days
  const rangeParam = searchParams.get('range') as TimeRangeKey | null
  const range = rangeParam && TIME_RANGES[rangeParam] ? rangeParam : '7d'
  const days = TIME_RANGES[range].days
  
  // Get metrics from API
  const { metrics, isLoading, isError } = useAnalyticsMetrics(days)
  
  // Function to handle range changes
  const handleRangeChange = (newRange: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', newRange)
    router.push(`${pathname}?${params.toString()}`)
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Platform Analytics</h1>
        <AnalyticsDateRangePicker 
          currentRange={range} 
          ranges={TIME_RANGES} 
          onRangeChange={handleRangeChange}
        />
      </div>
      
      {isError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">
            There was an error loading analytics data. Please try again later.
          </p>
        </div>
      )}
      
      <div className="mb-8">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <p>Loading statistics...</p>
          </div>
        ) : metrics ? (
          <StatsCards stats={[
            { title: 'Page Views', value: metrics.views, icon: 'eye' },
            { title: 'Active Businesses', value: metrics.businesses, icon: 'building' },
            { title: 'Searches', value: metrics.searches, icon: 'search' },
            { title: 'New Reviews', value: metrics.reviews, icon: 'star' }
          ]} />
        ) : (
          <StatsCards stats={[
            { title: 'Page Views', value: 0, icon: 'eye' },
            { title: 'Active Businesses', value: 0, icon: 'building' },
            { title: 'Searches', value: 0, icon: 'search' },
            { title: 'New Reviews', value: 0, icon: 'star' }
          ]} />
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <PageViewsChart days={days} />
        <SearchAnalyticsChart days={days} />
      </div>
      
      <div className="mt-8">
        <TopBusinessesTable days={days} />
      </div>
    </div>
  )
}