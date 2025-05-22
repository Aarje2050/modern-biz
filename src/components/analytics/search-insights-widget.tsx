'use client'

import { useState, useEffect } from 'react'

interface SearchInsight {
  term: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

interface SearchInsightsWidgetProps {
  days: number;
}

export default function SearchInsightsWidget({ days }: SearchInsightsWidgetProps) {
  const [insights, setInsights] = useState<SearchInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSearches, setTotalSearches] = useState(0)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch(`/api/analytics/charts/search-terms?days=${days}`)
        const data = await response.json()
        
        if (data.data) {
          // Get top 5 search terms with mock trends
          const topTerms = data.data.slice(0, 5).map((term: any) => ({
            term: term.term,
            count: term.count,
            trend: term.count > 2 ? 'up' : 'stable' as 'up' | 'down' | 'stable'
          }))
          
          setInsights(topTerms)
          setTotalSearches(data.summary?.totalSearches || 0)
        }
      } catch (error) {
        console.error('Error fetching search insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [days])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Search Terms</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Top Search Terms</h3>
        <span className="text-sm text-gray-500">{totalSearches} total searches</span>
      </div>
      
      {insights.length === 0 ? (
        <div className="text-center py-6">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500 text-sm mt-2">No search data yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={insight.term} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 w-6">
                  #{index + 1}
                </span>
                <span className="text-sm text-gray-900 ml-2 truncate max-w-32">
                  {insight.term}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900">
                  {insight.count}
                </span>
                
                {insight.trend === 'up' && (
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )}
                
                {insight.trend === 'down' && (
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                )}
                
                {insight.trend === 'stable' && (
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-gray-400 rounded"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t">
        <a 
          href="/admin/analytics" 
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View detailed search analytics →
        </a>
      </div>
    </div>
  )
}