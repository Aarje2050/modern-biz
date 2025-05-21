// src/app/api/analytics/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function GET(request: Request, nextUrl: URL) {
  // Create client correctly
  const supabase = createRouteHandlerClient<Database>({ cookies });
  
  
  // Now use await to get session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(request.url);
  // Get query parameters
  const searchParams = url.searchParams;
  const startDate = searchParams.get('start_date') || getDefaultStartDate();
  const endDate = searchParams.get('end_date') || new Date().toISOString();
  const businessId = searchParams.get('business_id');
  const groupBy = searchParams.get('group_by') || 'day';
  const entityType = searchParams.get('entity_type');
  const metric = searchParams.get('metric') || 'page_views';

  // Check if user is admin (for platform-wide analytics)
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', session.user.id)
    .single();

  const isAdmin = profile?.account_type === 'admin';

  // If requesting business-specific analytics, verify ownership or admin status
  if (businessId && !isAdmin) {
    const { data: business } = await supabase
      .from('businesses')
      .select('profile_id')
      .eq('id', businessId)
      .single();

    if (!business || business.profile_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }

  try {
    let data;

    // Different metrics have different queries
    switch (metric) {
      case 'page_views':
        data = await getPageViewsData(supabase, {
          startDate,
          endDate,
          businessId,
          groupBy,
          entityType,
          isAdmin
        });
        break;
      
      case 'top_businesses':
        data = await getTopBusinessesData(supabase, {
          startDate,
          endDate,
          limit: 10,
          isAdmin
        });
        break;
      
      case 'search_queries':
        data = await getSearchQueriesData(supabase, {
          startDate,
          endDate,
          limit: 10,
          isAdmin
        });
        break;
      
      case 'user_growth':
        if (!isAdmin) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        data = await getUserGrowthData(supabase, {
          startDate,
          endDate,
          groupBy
        });
        break;
      
      case 'review_analytics':
        data = await getReviewsAnalytics(supabase, {
          startDate,
          endDate,
          businessId,
          isAdmin
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' }, 
      { status: 500 }
    );
  }
}

// Helper to get default date (30 days ago)
function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString();
}

// Get page views data with grouping
async function getPageViewsData(supabase: any, {
  startDate,
  endDate,
  businessId,
  groupBy,
  entityType,
  isAdmin
}: any) {
  // Build query
  let query = supabase
    .from('page_views')
    .select('created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Add filters
  if (businessId) {
    query = query.eq('entity_type', 'business').eq('entity_id', businessId);
  } else if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  // If not admin, restrict to user's businesses
  if (!isAdmin && !businessId) {
    // Get user's businesses first
    const { data: userBusinesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('profile_id', (await supabase.auth.getUser()).data.user?.id);
    
    if (userBusinesses && userBusinesses.length > 0) {
      const businessIds = userBusinesses.map((b: any) => b.id);
      query = query
        .eq('entity_type', 'business')
        .in('entity_id', businessIds);
    }
  }

  const { data: pageViews, error } = await query;

  if (error) throw error;

  // Group by time period
  const grouped = groupByTimePeriod(pageViews, groupBy);
  return grouped;
}

// Get top performing businesses
async function getTopBusinessesData(supabase: any, {
  startDate,
  endDate,
  limit,
  isAdmin
}: any) {
  // Only admins can see all businesses
  if (!isAdmin) {
    // Get user's businesses
    const { data: user } = await supabase.auth.getUser();
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('profile_id', user.user?.id);
    
    // If user has no businesses, return empty data
    if (!businesses || businesses.length === 0) {
      return [];
    }
    
    // Only show the user's businesses
    const businessIds = businesses.map((b: any) => b.id);
    
    const { data, error } = await supabase
      .from('page_views')
      .select('entity_id, count')
      .eq('entity_type', 'business')
      .in('entity_id', businessIds)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('count', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    // Get business details for the IDs
    const { data: businessDetails } = await supabase
      .from('businesses')
      .select('id, name, slug')
      .in('id', data.map((item: any) => item.entity_id));
    
    // Combine data
    return data.map((item: any) => {
      const business = businessDetails.find((b: any) => b.id === item.entity_id);
      return {
        ...item,
        name: business?.name,
        slug: business?.slug
      };
    });
  } else {
    // For admin, get top businesses across the platform
    const { data, error } = await supabase.rpc('get_top_businesses', {
      start_date: startDate,
      end_date: endDate,
      limit_count: limit
    });
    
    if (error) {
      // Fallback if RPC isn't available
      const { data: pageViews } = await supabase
        .from('page_views')
        .select('entity_id, count(*)')
        .eq('entity_type', 'business')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .group('entity_id')
        .order('count', { ascending: false })
        .limit(limit);
      
      // Get business details
      const { data: businessDetails } = await supabase
        .from('businesses')
        .select('id, name, slug')
        .in('id', pageViews.map((item: any) => item.entity_id));
      
      // Combine data
      return pageViews.map((item: any) => {
        const business = businessDetails.find((b: any) => b.id === item.entity_id);
        return {
          entity_id: item.entity_id,
          count: item.count,
          name: business?.name,
          slug: business?.slug
        };
      });
    }
    
    return data;
  }
}

// Get top search queries
async function getSearchQueriesData(supabase: any, {
  startDate,
  endDate,
  limit,
  isAdmin
}: any) {
  // Create search_queries table if it doesn't exist
  // This is simplified - in production, manage this with proper migrations
  try {
    if (!isAdmin) {
      return []; // Only admins can see search analytics for now
    }
    
    // For admins, get top search queries
    const { data, error } = await supabase
      .from('search_queries')
      .select('query, count(*)')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .group('query')
      .order('count', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching search queries:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error in search queries data:', error);
    return [];
  }
}

// Get user growth over time
async function getUserGrowthData(supabase: any, {
  startDate,
  endDate,
  groupBy
}: any) {
  // Only available to admins
  const { data, error } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  if (error) throw error;
  
  // Group by time period
  const grouped = groupByTimePeriod(data, groupBy);
  return grouped;
}

// Get review analytics
async function getReviewsAnalytics(supabase: any, {
  startDate,
  endDate,
  businessId,
  isAdmin
}: any) {
  let query = supabase
    .from('reviews')
    .select('id, rating, created_at, business_id')
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  // Filter by business if specified
  if (businessId) {
    query = query.eq('business_id', businessId);
  } else if (!isAdmin) {
    // For non-admins without a specific business, get their businesses
    const { data: user } = await supabase.auth.getUser();
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('profile_id', user.user?.id);
    
    if (!businesses || businesses.length === 0) {
      return { ratings: [], timeline: [] };
    }
    
    query = query.in('business_id', businesses.map((b: any) => b.id));
  }
  
  const { data: reviews, error } = await query;
  
  if (error) throw error;
  
  // Group reviews by rating
  const ratingDistribution = [0, 0, 0, 0, 0]; // For 1-5 stars
  reviews.forEach((review: any) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingDistribution[review.rating - 1]++;
    }
  });
  
  // Group by time for the timeline
  const timeline = groupByTimePeriod(reviews, 'day');
  
  return {
    ratings: [
      { rating: 1, count: ratingDistribution[0] },
      { rating: 2, count: ratingDistribution[1] },
      { rating: 3, count: ratingDistribution[2] },
      { rating: 4, count: ratingDistribution[3] },
      { rating: 5, count: ratingDistribution[4] }
    ],
    timeline
  };
}

// Helper to group data by time period
function groupByTimePeriod(data: any[], period: string) {
  const grouped: Record<string, number> = {};
  
  // Initialize with all dates in range
  const startDate = new Date(Math.min(...data.map(item => new Date(item.created_at).getTime())));
  const endDate = new Date(Math.max(...data.map(item => new Date(item.created_at).getTime())));
  
  let current = new Date(startDate);
  while (current <= endDate) {
    let key;
    
    switch (period) {
      case 'hour':
        key = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate().toString().padStart(2, '0')} ${current.getHours().toString().padStart(2, '0')}:00`;
        current.setHours(current.getHours() + 1);
        break;
      case 'day':
        key = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate().toString().padStart(2, '0')}`;
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        // Get first day of the week (Sunday)
        const firstDay = new Date(current);
        firstDay.setDate(current.getDate() - current.getDay());
        key = `${firstDay.getFullYear()}-W${Math.ceil((firstDay.getDate() + firstDay.getDay()) / 7)}`;
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        key = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`;
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        key = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate().toString().padStart(2, '0')}`;
        current.setDate(current.getDate() + 1);
    }
    
    grouped[key] = 0;
  }
  
  // Count items for each time period
  data.forEach(item => {
    const date = new Date(item.created_at);
    let key;
    
    switch (period) {
      case 'hour':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:00`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        break;
      case 'week':
        // Get first day of the week (Sunday)
        const firstDay = new Date(date);
        firstDay.setDate(date.getDate() - date.getDay());
        key = `${firstDay.getFullYear()}-W${Math.ceil((firstDay.getDate() + firstDay.getDay()) / 7)}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      default:
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
    
    if (grouped[key] !== undefined) {
      grouped[key]++;
    } else {
      grouped[key] = 1;
    }
  });
  
  // Convert to array for chart data
  return Object.entries(grouped).map(([date, count]) => ({
    date,
    count
  }));
}