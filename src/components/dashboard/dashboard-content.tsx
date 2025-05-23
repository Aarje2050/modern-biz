// src/components/dashboard/dashboard-content.tsx (NEW FILE - CLIENT-SIDE ONLY)
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { useSupabase } from '@/hooks/useSupabase'

interface DashboardStats {
  totalBusinesses: number
  pendingBusinesses: number
  activeBusinesses: number
  totalReviews: number
}

interface Business {
  id: string
  name: string
  slug: string
  status: string
  created_at: string
}

export default function DashboardContent() {
  const { user } = useAuth()
  const supabase = useSupabase()
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    pendingBusinesses: 0,
    activeBusinesses: 0,
    totalReviews: 0
  })
  const [recentBusinesses, setRecentBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      if (!supabase || !user) {
        setLoading(false)
        return
      }

      try {
        // Fetch user's businesses
        const { data: businesses, error: businessError } = await supabase
          .from('businesses')
          .select('id, name, slug, status, created_at')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })

        if (businessError) {
          throw businessError
        }

        const businessList = businesses || []

        // Calculate stats
        const totalBusinesses = businessList.length
        const pendingBusinesses = businessList.filter(b => b.status === 'pending').length
        const activeBusinesses = businessList.filter(b => b.status === 'active').length

        // Fetch review count for user's businesses
        let totalReviews = 0
        if (businessList.length > 0) {
          const businessIds = businessList.map(b => b.id)
          const { count, error: reviewError } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .in('business_id', businessIds)

          if (!reviewError) {
            totalReviews = count || 0
          }
        }

        setStats({
          totalBusinesses,
          pendingBusinesses,
          activeBusinesses,
          totalReviews
        })

        setRecentBusinesses(businessList.slice(0, 5))
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [supabase, user])

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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m2 0h2M9 7h6m-6 4h6m-6 4h6" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Businesses</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalBusinesses}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingBusinesses}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Businesses</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeBusinesses}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Reviews</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalReviews}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Businesses */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Businesses</h3>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/businesses/add"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Add Business
              </Link>
            </div>
          </div>
          
          <div className="mt-6">
            {recentBusinesses.length === 0 ? (
              <div className="text-center py-6">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m2 0h2M9 7h6m-6 4h6m-6 4h6" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No businesses</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding your first business.</p>
                <div className="mt-6">
                  <Link
                    href="/businesses/add"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Business
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {recentBusinesses.map((business) => (
                    <li key={business.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {business.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Status: <span className={`font-medium ${
                              business.status === 'active' ? 'text-green-600' :
                              business.status === 'pending' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                            </span>
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex space-x-2">
                          <Link
                            href={`/dashboard/businesses/${business.id}/edit`}
                            className="text-gray-700 hover:text-gray-900 text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/businesses/${business.slug}`}
                            className="text-gray-700 hover:text-gray-900 text-sm font-medium"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}