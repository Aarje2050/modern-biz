// src/components/analytics/top-businesses-table.tsx
'use client'

import { useTopBusinesses } from '@/hooks/useAnalytics'

interface TopBusinessesTableProps {
  days: number;
}

export default function TopBusinessesTable({ days }: TopBusinessesTableProps) {
  const { businesses, isLoading, isError } = useTopBusinesses(days);
  
  if (isLoading) {
    return <div className="p-6 bg-white rounded-lg shadow">Loading top businesses...</div>;
  }
  
  if (isError) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Top Performing Businesses</h2>
        <p className="text-gray-500">Unable to load business data</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Top Performing Businesses</h2>
      
      {businesses.length === 0 ? (
        <p className="text-gray-500">No data available for the selected period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interactions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {businesses.map((business) => (
                <tr key={business.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a href={`/businesses/${business.slug}`} className="text-blue-600 hover:underline">
                      {business.name}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{business.views}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{business.interactions}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{business.reviews}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {business.avgRating > 0 ? `${business.avgRating} ★` : 'No ratings'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}