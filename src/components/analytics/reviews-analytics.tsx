// src/components/analytics/reviews-analytics.tsx
'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useReviewsAnalytics } from '@/hooks/useAnalytics'

interface ReviewsAnalyticsProps {
  businessId: string;
  days: number;
}

export default function ReviewsAnalytics({ 
  businessId, 
  days
}: ReviewsAnalyticsProps) {
  const { 
    reviews, 
    ratingSummary, 
    avgRating, 
    totalReviews, 
    isLoading, 
    isError 
  } = useReviewsAnalytics(businessId, days);

  if (isLoading) {
    return <div className="bg-white p-6 rounded-lg shadow flex items-center justify-center h-96">Loading reviews analytics...</div>;
  }

  if (isError) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Reviews Analysis</h2>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Unable to load reviews data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Reviews Analysis</h2>
        {totalReviews > 0 && (
          <div className="text-right">
            <p className="text-3xl font-bold">{avgRating}</p>
            <p className="text-sm text-gray-500">{totalReviews} reviews</p>
          </div>
        )}
      </div>
      
      {reviews.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-500">No reviews available for this period.</p>
        </div>
      ) : (
        <>
          <div className="h-64 mb-8">
            <h3 className="text-md font-medium mb-2">Rating Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ratingSummary}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip formatter={(value: number) => [value, 'Reviews']} />
                <Bar dataKey="count" name="Reviews" fill="#fbbf24" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-4">Recent Reviews</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="border-b pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="flex items-center text-yellow-500 mr-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                        ))}
                      </div>
                      <p className="font-medium">{review.profile?.full_name || 'Anonymous'}</p>
                    </div>
                    <p className="text-sm text-gray-500">{format(parseISO(review.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  {review.title && <p className="font-medium mb-1">{review.title}</p>}
                  <p className="text-gray-700">{review.content}</p>
                </div>
              ))}
              
              {reviews.length > 5 && (
                <div className="text-center mt-4">
                  <a href={`/dashboard/reviews?business=${businessId}`} className="text-blue-600 hover:underline">
                    View all {reviews.length} reviews
                  </a>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}