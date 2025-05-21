// src/components/analytics/business-views-chart.tsx
'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { usePageViewsChart } from '@/hooks/useAnalytics'

interface BusinessViewsChartProps {
  businessId: string;
  days: number;
}

export default function BusinessViewsChart({ 
  businessId, 
  days
}: BusinessViewsChartProps) {
  // Use the hook with appropriate parameters
  const { chartData, isLoading, isError } = usePageViewsChart(
    days, 
    'business', 
    businessId
  );

  if (isLoading) {
    return <div className="h-80 bg-white p-6 rounded-lg shadow flex items-center justify-center">Loading views chart...</div>;
  }

  if (isError) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Profile Views</h2>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Unable to load chart data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Profile Views</h2>
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No view data available for this period.</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#3b82f6"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}