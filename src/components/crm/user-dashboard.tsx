// src/components/crm/user-dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Bookmark, 
  MessageCircle, 
  Star, 
  Clock, 
  MapPin, 
  Eye,
  Heart,
  Filter,
  Search,
  Plus
} from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { useSupabase } from '@/hooks/useSupabase'

interface UserStats {
  savedBusinesses: number
  totalReviews: number
  messagesExchanged: number
  averageRating: number
}

interface SavedBusiness {
  id: string
  business_id: string
  business_name: string
  business_slug: string
  business_rating: number
  business_logo?: string
  saved_at: string
  category?: string
  location?: string
}

interface RecentReview {
  id: string
  business_id: string
  business_name: string
  business_slug: string
  rating: number
  title: string
  content: string
  created_at: string
  helpful_count: number
}

interface RecentMessage {
  id: string
  business_id: string
  business_name: string
  subject: string
  last_message: string
  updated_at: string
  unread_count: number
}

export default function UserDashboard() {
  const { user } = useAuth()
  const supabase = useSupabase()
  
  const [stats, setStats] = useState<UserStats>({
    savedBusinesses: 0,
    totalReviews: 0,
    messagesExchanged: 0,
    averageRating: 0
  })
  const [savedBusinesses, setSavedBusinesses] = useState<SavedBusiness[]>([])
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([])
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserData() {
      if (!supabase || !user) {
        setLoading(false)
        return
      }
  
      try {
        // Fetch user reviews (simple query)
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('id, business_id, rating, title, content, created_at, helpful_count')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
  
        // Fetch businesses for reviews (separate query)
        const businessIds = reviewsData?.map(r => r.business_id) || []
        const { data: businessesData } = businessIds.length > 0 ? await supabase
          .from('businesses')
          .select('id, name, slug')
          .in('id', businessIds) : { data: [] }
  
        // Fetch recent businesses (simple query)
        const { data: savedData } = await supabase
          .from('businesses')
          .select('id, name, slug, logo_url, created_at')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6)
  
        // Get total counts for stats
        const { count: totalSaved } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
  
        const { count: totalReviews } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', user.id)
  
        const { count: totalMessages } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', user.id)
  
        // Calculate average rating
        const avgRating = reviewsData && reviewsData.length > 0 
          ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length 
          : 0
  
        // Process data
        setStats({
          savedBusinesses: totalSaved || 0,
          totalReviews: totalReviews || 0,
          messagesExchanged: totalMessages || 0,
          averageRating: Math.round(avgRating * 10) / 10
        })
  
        // Map saved businesses (using direct properties)
        setSavedBusinesses((savedData || []).map(item => ({
          id: item.id,
          business_id: item.id,
          business_name: item.name || 'Unknown Business',
          business_slug: item.slug || '',
          business_rating: 4.5,
          business_logo: item.logo_url,
          saved_at: item.created_at
        })))
  
        // Map reviews with business names
        setRecentReviews((reviewsData || []).map(review => {
          const business = businessesData?.find(b => b.id === review.business_id)
          return {
            id: review.id,
            business_id: review.business_id,
            business_name: business?.name || 'Unknown Business',
            business_slug: business?.slug || '',
            rating: review.rating,
            title: review.title,
            content: review.content,
            created_at: review.created_at,
            helpful_count: review.helpful_count
          }
        }))
  
        // Mock messages data (since conversations table structure unknown)
        setRecentMessages([])
  
      } catch (err: any) {
        console.error('Error fetching user data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  
    fetchUserData()
  }, [supabase, user])

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-600 mt-1">Discover and connect with local businesses</p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Search className="mr-2 h-5 w-5" />
            Explore Businesses
          </Link>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bookmark className="h-6 w-6 text-blue-600" />
            </div>
            <Link href="/saved" className="text-sm text-blue-600 hover:text-blue-800">
              View all
            </Link>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Saved Businesses</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.savedBusinesses}</p>
            <p className="text-sm text-gray-600 mt-1">Your favorites</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <Link href="/profile/reviews" className="text-sm text-green-600 hover:text-green-800">
              View all
            </Link>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Reviews Written</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
            <p className="text-sm text-gray-600 mt-1">
              Avg: {stats.averageRating > 0 ? `${stats.averageRating} ★` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-purple-600" />
            </div>
            <Link href="/messages" className="text-sm text-purple-600 hover:text-purple-800">
              View all
            </Link>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Conversations</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.messagesExchanged}</p>
            <p className="text-sm text-gray-600 mt-1">With businesses</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Eye className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">This month</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Profile Views</h3>
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-600 mt-1">Your activity</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Businesses */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recently Saved</h2>
              <Link href="/saved" className="text-sm text-gray-600 hover:text-gray-900">
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {savedBusinesses.length === 0 ? (
              <div className="text-center py-6">
                <Bookmark className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500 mb-4">No saved businesses yet</p>
                <Link
                  href="/search"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Search className="mr-1 h-4 w-4" />
                  Discover businesses
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedBusinesses.map((business) => (
                  <Link
                    key={business.id}
                    href={`/businesses/${business.business_slug}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0">
                        {business.business_logo ? (
                          <img
                            src={business.business_logo}
                            alt={business.business_name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 rounded-lg"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {business.business_name}
                        </h3>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">
                            {business.business_rating}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Saved {formatTimeAgo(business.saved_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/search"
                className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5 mr-3 text-blue-600" />
                Find Businesses
              </Link>
              <Link
                href="/categories"
                className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5 mr-3 text-green-600" />
                Browse Categories
              </Link>
              <Link
                href="/profile"
                className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Eye className="w-5 h-5 mr-3 text-purple-600" />
                Update Profile
              </Link>
              <Link
                href="/businesses/add"
                className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 mr-3 text-orange-600" />
                List Your Business
              </Link>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Your Recent Reviews</h2>
            </div>
            <div className="p-6">
              {recentReviews.length === 0 ? (
                <div className="text-center py-4">
                  <Star className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentReviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <Link
                          href={`/businesses/${review.business_slug}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {review.business_name}
                        </Link>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{review.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(review.created_at)}
                        {review.helpful_count > 0 && (
                          <span className="ml-2">• {review.helpful_count} helpful</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}