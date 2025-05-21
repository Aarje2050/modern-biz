import { useState, useEffect } from 'react'
import useSWR from 'swr'

// Types for analytics data
interface BaseMetrics {
  views: number;
  isError?: boolean;
}

interface PlatformMetrics extends BaseMetrics {
  businesses: number;
  searches: number;
  reviews: number;
}

interface BusinessMetrics extends BaseMetrics {
  interactions: number;
  reviews: number;
  avgRating: number;
}

interface ChartDataPoint {
  date: string;
  views?: number;
  count?: number;
  [key: string]: any;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  profile: {
    full_name: string | null;
  };
}

interface RatingsSummary {
  rating: number;
  count: number;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  views: number;
  interactions: number;
  reviews: number;
  avgRating: number;
}

interface SearchTerm {
  term: string;
  count: number;
}

interface BusinessInteraction {
  name: string;
  value: number;
  color: string;
}

// Error handling fetcher with timeout
const fetcher = async (url: string) => {
  try {
    // Set up timeout for fetch operations
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Analytics API error: ${res.status} - ${errorText}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('Analytics fetch error:', error);
    throw error;
  }
};

/**
 * Hook for fetching global platform analytics metrics
 */
export function useAnalyticsMetrics(days: number): {
  metrics: PlatformMetrics | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const url = `/api/analytics/metrics?days=${days}`;
  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes
    errorRetryCount: 2,
    fallbackData: { metrics: { views: 0, businesses: 0, searches: 0, reviews: 0 } }
  });
  
  return {
    metrics: data?.metrics,
    isLoading,
    isError: !!error
  };
}

/**
 * Hook for fetching business-specific analytics metrics
 */
export function useBusinessMetrics(businessId: string, days: number): {
  metrics: BusinessMetrics | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const url = businessId ? `/api/analytics/metrics?days=${days}&businessId=${businessId}` : null;
  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes
    errorRetryCount: 2,
    fallbackData: { metrics: { views: 0, interactions: 0, reviews: 0, avgRating: 0 } }
  });
  
  return {
    metrics: data?.metrics,
    isLoading,
    isError: !!error
  };
}

/**
 * Hook for fetching page views chart data
 */
export function usePageViewsChart(days: number, entityType?: string, entityId?: string): {
  chartData: ChartDataPoint[];
  isLoading: boolean;
  isError: boolean;
} {
  let url = `/api/analytics/charts/page-views?days=${days}`;
  
  if (entityType) {
    url += `&entityType=${entityType}`;
  }
  
  if (entityId) {
    url += `&entityId=${entityId}`;
  }
  
  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes
    errorRetryCount: 2
  });
  
  return {
    chartData: data?.data || [],
    isLoading,
    isError: !!error
  };
}

/**
 * Hook for fetching top search terms
 */
export function useSearchTermsAnalytics(days: number): {
  searchTerms: SearchTerm[];
  isLoading: boolean;
  isError: boolean;
} {
  const url = `/api/analytics/charts/search-terms?days=${days}`;
  
  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes
    errorRetryCount: 2
  });
  
  return {
    searchTerms: data?.data || [],
    isLoading,
    isError: !!error
  };
}

/**
 * Hook for fetching business interactions chart data
 */
export function useBusinessInteractionsChart(businessId: string, days: number): {
  interactionData: BusinessInteraction[];
  isLoading: boolean;
  isError: boolean;
} {
  const url = businessId 
    ? `/api/analytics/charts/business-interactions?days=${days}&businessId=${businessId}`
    : null;
  
  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes
    errorRetryCount: 2
  });
  
  return {
    interactionData: data?.data || [],
    isLoading,
    isError: !!error
  };
}

/**
 * Hook for fetching top businesses
 */
export function useTopBusinesses(days: number): {
  businesses: Business[];
  isLoading: boolean;
  isError: boolean;
} {
  const url = `/api/analytics/top-businesses?days=${days}`;
  
  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes
    errorRetryCount: 2
  });
  
  return {
    businesses: data?.data || [],
    isLoading,
    isError: !!error
  };
}

/**
 * Hook for fetching reviews analytics
 */
export function useReviewsAnalytics(businessId: string, days: number): {
  reviews: Review[];
  ratingSummary: RatingsSummary[];
  avgRating: number;
  totalReviews: number;
  isLoading: boolean;
  isError: boolean;
} {
  const url = businessId 
    ? `/api/analytics/reviews?days=${days}&businessId=${businessId}`
    : null;
  
  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes
    errorRetryCount: 2
  });
  
  return {
    reviews: data?.reviews || [],
    ratingSummary: data?.ratingSummary || [],
    avgRating: data?.avgRating || 0,
    totalReviews: data?.totalReviews || 0,
    isLoading,
    isError: !!error
  };
}

/**
 * Hook for fetching user's business list
 */
export function useUserBusinesses(): {
  businesses: { id: string; name: string; slug: string }[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data, error, isLoading } = useSWR('/api/analytics/user-businesses', fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 2
  });
  
  return {
    businesses: data?.businesses || [],
    isLoading,
    isError: !!error
  };
}

/**
 * Hook for checking if analytics is available
 */
export function useAnalyticsAvailability(): {
  available: boolean;
  isLoading: boolean;
} {
  const { data, error, isLoading } = useSWR('/api/analytics/status', fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 1,
    dedupingInterval: 600000 // 10 minutes
  });
  
  return {
    available: data?.available || false,
    isLoading
  };
}

/**
 * Hook to safely use analytics with fallback for unavailable analytics
 */
export function useSafeAnalytics<T>(
  analyticsHook: () => { isLoading: boolean; isError: boolean } & T
): { isLoading: boolean; isError: boolean; analyticsAvailable: boolean } & T {
  const { available, isLoading: checkingAvailability } = useAnalyticsAvailability();
  const hookResult = analyticsHook();
  
  // Combine loading states
  const isLoading = checkingAvailability || hookResult.isLoading;
  
  // If analytics is unavailable, mark as error
  const isError = !available || hookResult.isError;
  
  return {
    ...hookResult,
    isLoading,
    isError,
    analyticsAvailable: available
  };
}