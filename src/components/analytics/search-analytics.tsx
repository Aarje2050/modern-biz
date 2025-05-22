'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useSearchTermsAnalytics } from '@/hooks/useAnalytics'

interface SearchAnalyticsChartProps {
  days: number;
}

interface SearchTerm {
  term: string;
  count: number;
  firstSearched?: string;
  lastSearched?: string;
  avgResultCount?: number;
}

export default function SearchAnalyticsChart({ days }: SearchAnalyticsChartProps) {
  const { searchTerms, isLoading, isError } = useSearchTermsAnalytics(days);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [sortBy, setSortBy] = useState<'count' | 'term' | 'recent'>('count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  if (isLoading) {
    return <div className="h-80 bg-white p-6 rounded-lg shadow flex items-center justify-center">Loading search analytics...</div>;
  }

  if (isError) {
    return (
      <div className="h-80 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Search Analytics</h2>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Unable to load search analytics data</p>
        </div>
      </div>
    );
  }

  // Sort search terms based on selected criteria
  const sortedTerms = [...searchTerms].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'count':
        comparison = a.count - b.count;
        break;
      case 'term':
        comparison = a.term.localeCompare(b.term);
        break;
      case 'recent':
        comparison = (new Date(a.lastSearched || 0).getTime()) - (new Date(b.lastSearched || 0).getTime());
        break;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Calculate total searches and unique terms
  const totalSearches = searchTerms.reduce((sum, term) => sum + term.count, 0);
  const uniqueTerms = searchTerms.length;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Header with title and controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold">Search Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">
            {totalSearches} searches • {uniqueTerms} unique terms
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'chart'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Chart
            </button>
          </div>
        </div>
      </div>

      {searchTerms.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 mt-2">No search data available for the selected period.</p>
            <p className="text-sm text-gray-400 mt-1">Users haven't performed any searches yet.</p>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="overflow-hidden">
              {/* Sort Controls */}
              <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'count' | 'term' | 'recent')}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  >
                    <option value="count">Search Volume</option>
                    <option value="term">Search Term</option>
                    <option value="recent">Most Recent</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Order:</span>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
                  >
                    {sortOrder === 'desc' ? '↓ High to Low' : '↑ Low to High'}
                  </button>
                </div>
              </div>

              {/* Search Terms Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Search Term
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Volume
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Share
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedTerms.map((term, index) => {
                      const sharePercentage = ((term.count / totalSearches) * 100).toFixed(1);
                      const isPopular = term.count >= Math.max(3, totalSearches * 0.1);
                      
                      return (
                        <tr key={term.term} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">
                            #{index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {term.term}
                              </span>
                              {isPopular && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Popular
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <span className="text-sm font-semibold text-gray-900">
                                {term.count}
                              </span>
                              <span className="ml-1 text-xs text-gray-500">
                                search{term.count !== 1 ? 'es' : ''}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, (term.count / sortedTerms[0].count) * 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {sharePercentage}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              {term.count > 1 ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                  Trending
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  New
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="mt-6 pt-4 border-t bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{totalSearches}</p>
                    <p className="text-sm text-gray-600">Total Searches</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{uniqueTerms}</p>
                    <p className="text-sm text-gray-600">Unique Terms</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {totalSearches > 0 ? (totalSearches / uniqueTerms).toFixed(1) : '0'}
                    </p>
                    <p className="text-sm text-gray-600">Avg per Term</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Chart View */
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedTerms.slice(0, 15)} // Show top 15 in chart
                  margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="term" 
                    angle={-45} 
                    textAnchor="end"
                    height={80} 
                    interval={0}
                    fontSize={11}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Searches']}
                    labelFormatter={(label) => `Search term: ${label}`}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Search Count" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}