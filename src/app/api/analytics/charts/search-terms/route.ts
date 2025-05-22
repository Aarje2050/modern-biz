import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { subDays, formatISO } from 'date-fns'

export const revalidate = 3600

export async function GET(request: Request) {
  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get('days') || '7', 10)
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const startDate = subDays(new Date(), days)
    
    // Get all search queries from the period with more details
    const { data: searchQueries } = await supabase
      .from('search_queries')
      .select('query, result_count, created_at')
      .gte('created_at', formatISO(startDate))
      .order('created_at', { ascending: false })
    
    if (!searchQueries || searchQueries.length === 0) {
      // Return empty data if no searches yet
      return NextResponse.json({ data: [] })
    }
    
    // Process search data for better analytics
    const termAnalytics: Record<string, {
      count: number;
      totalResults: number;
      firstSearched: string;
      lastSearched: string;
      searches: Array<{ date: string; resultCount: number }>;
    }> = {}
    
    searchQueries.forEach((item: any) => {
      const term = item.query?.toLowerCase()?.trim()
      if (!term) return
      
      if (!termAnalytics[term]) {
        termAnalytics[term] = {
          count: 0,
          totalResults: 0,
          firstSearched: item.created_at,
          lastSearched: item.created_at,
          searches: []
        }
      }
      
      termAnalytics[term].count++
      termAnalytics[term].totalResults += item.result_count || 0
      termAnalytics[term].searches.push({
        date: item.created_at,
        resultCount: item.result_count || 0
      })
      
      // Update first and last searched dates
      if (new Date(item.created_at) < new Date(termAnalytics[term].firstSearched)) {
        termAnalytics[term].firstSearched = item.created_at
      }
      if (new Date(item.created_at) > new Date(termAnalytics[term].lastSearched)) {
        termAnalytics[term].lastSearched = item.created_at
      }
    })
    
    // Convert to array and enhance with analytics
    const searchTerms = Object.entries(termAnalytics)
      .map(([term, analytics]) => ({
        term,
        count: analytics.count,
        avgResultCount: analytics.totalResults / analytics.count,
        firstSearched: analytics.firstSearched,
        lastSearched: analytics.lastSearched,
        isRecent: new Date(analytics.lastSearched) > subDays(new Date(), 1), // Searched in last 24h
        isPopular: analytics.count >= 3, // Consider popular if searched 3+ times
        searches: analytics.searches
      }))
      .sort((a, b) => b.count - a.count) // Sort by popularity
      .slice(0, 50) // Limit to top 50 terms
    
    return NextResponse.json({ 
      data: searchTerms,
      summary: {
        totalSearches: searchQueries.length,
        uniqueTerms: searchTerms.length,
        avgSearchesPerTerm: searchQueries.length / searchTerms.length,
        periodDays: days
      }
    })
  } catch (error) {
    console.error('Search terms API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch search terms data',
      data: [] 
    })
  }
}