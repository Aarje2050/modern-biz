// src/components/analytics/page-views-chart.tsx
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { usePageViewsChart } from '@/hooks/useAnalytics'

interface PageViewsChartProps {
  days: number
  entityType?: string
  entityId?: string
}

export default function PageViewsChart({ 
  days,
  entityType,
  entityId
}: PageViewsChartProps) {
  const { chartData, isLoading, isError } = usePageViewsChart(days, entityType, entityId)
  
  if (isLoading) {
    return <div className="h-80 bg-white p-6 rounded-lg shadow flex items-center justify-center">Loading chart...</div>
  }
  
  if (isError) {
    return (
      <div className="h-80 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Page Views</h2>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Unable to load chart data</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Page Views</h2>
      <div className="h-80">
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
    </div>
  )
}