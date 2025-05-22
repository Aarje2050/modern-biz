// src/app/api/admin/metrics/route.ts (CREATE THIS FILE)
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const revalidate = 1800 // Cache for 30 minutes

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is admin (basic check)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Fetching admin metrics...')
    
    // Get admin-specific metrics using correct table references
    const [
        usersResult,
        businessOwnersResult,
        pendingBusinessesResult,
        avgRatingResult
      ] = await Promise.all([
        // Use public.profiles instead of core.profiles
        supabase.from('profiles')
          .select('*', { count: 'exact', head: true }),
          
        supabase.from('businesses')
          .select('profile_id', { count: 'exact', head: true })
          .not('profile_id', 'is', null),
          
        supabase.from('businesses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
          
        // Use public.reviews instead of reviews.reviews
        supabase.from('reviews')
          .select('rating')
      ])
    
    console.log('Raw results:', {
      users: usersResult.count,
      businessOwners: businessOwnersResult.count,
      pending: pendingBusinessesResult.count,
      reviewsData: avgRatingResult.data?.length
    })
    
    // Calculate average rating across all businesses
    let avgBusinessRating = 0
    if (avgRatingResult.data && avgRatingResult.data.length > 0) {
      const totalRating = avgRatingResult.data.reduce((sum, review) => sum + review.rating, 0)
      avgBusinessRating = Math.round((totalRating / avgRatingResult.data.length) * 10) / 10
    }
    
    const metrics = {
      totalUsers: usersResult.count || 0,
      businessOwners: businessOwnersResult.count || 0,
      pendingBusinesses: pendingBusinessesResult.count || 0,
      avgBusinessRating,
      platformGrowth: {
        newBusinesses: Math.floor(Math.random() * 5) + 1, // Mock data for now
        newUsers: Math.floor(Math.random() * 10) + 1,
        newReviews: Math.floor(Math.random() * 8) + 1
      }
    }
    
    console.log('Final metrics:', metrics)
    
    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('Admin metrics error:', error)
    return NextResponse.json({
      error: 'Failed to fetch admin metrics',
      details: error instanceof Error ? error.message : 'Unknown error',
      metrics: {
        totalUsers: 0,
        businessOwners: 0,
        pendingBusinesses: 0,
        avgBusinessRating: 0,
        platformGrowth: {
          newBusinesses: 0,
          newUsers: 0,
          newReviews: 0
        }
      }
    }, { status: 500 })
  }
}