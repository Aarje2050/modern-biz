// src/components/analytics/business-interactions-chart.tsx
'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useBusinessInteractionsChart } from '@/hooks/useAnalytics'

interface BusinessInteractionsChartProps {
  businessId: string;
  days: number;
}

export default function BusinessInteractionsChart({ 
  businessId, 
  days
}: BusinessInteractionsChartProps) {
  const { interactionData, isLoading, isError } = useBusinessInteractionsChart(businessId, days);

  if (isLoading) {
    return <div className="h-80 bg-white p-6 rounded-lg shadow flex items-center justify-center">Loading interactions chart...</div>;
  }

  if (isError) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">User Interactions</h2>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Unable to load interaction data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">User Interactions</h2>
      {interactionData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No interaction data available for this period.</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={interactionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {interactionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, 'Interactions']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}