// src/components/analytics/search-analytics.tsx
'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useSearchTermsAnalytics } from '@/hooks/useAnalytics'

interface SearchAnalyticsChartProps {
  days: number;  // Add this prop to fix the error
}

export default function SearchAnalyticsChart({ days }: SearchAnalyticsChartProps) {
  const { searchTerms, isLoading, isError } = useSearchTermsAnalytics(days);
  
  if (isLoading) {
    return <div className="h-80 bg-white p-6 rounded-lg shadow flex items-center justify-center">Loading search analytics...</div>;
  }
  
  if (isError) {
    return (
      <div className="h-80 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Popular Search Terms</h2>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Unable to load search analytics data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Popular Search Terms</h2>
      
      {searchTerms.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No search data available for the selected period.</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={searchTerms}
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="term" 
                angle={-45} 
                textAnchor="end"
                height={70} 
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Search Count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}