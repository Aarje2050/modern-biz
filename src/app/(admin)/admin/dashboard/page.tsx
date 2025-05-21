// src/app/(admin)/admin/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type CountsType = {
  totalBusinesses: number
  pendingBusinesses: number
  activeBusinesses: number
  rejectedBusinesses: number
  totalUsers: number
}

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<CountsType>({
    totalBusinesses: 0,
    pendingBusinesses: 0,
    activeBusinesses: 0,
    rejectedBusinesses: 0,
    totalUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentBusinesses, setRecentBusinesses] = useState<any[]>([])
  const supabase = createClient()
  
  // src/app/(admin)/admin/page.tsx - Fix the count issue
useEffect(() => {
    async function fetchData() {
      
// Replace the recent businesses fetch with this simpler version:

try {
    // Get business counts
    const { count: totalBusinessesCount } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      
    const { count: pendingBusinessesCount } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      
    const { count: activeBusinessesCount } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      
    const { count: rejectedBusinessesCount } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected')
      
    // Get user count
    const { count: totalUsersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      
    // Simple query to get just the business data without joins
    const { data: recent, error: recentError } = await supabase
      .from('businesses')
      .select('id, name, slug, status, created_at, profile_id')
      .order('created_at', { ascending: false })
      .limit(10)
    
    console.log('Recent businesses data:', recent)
    console.log('Recent businesses error:', recentError)
    
    // If we successfully got businesses, try to get the profile data separately
    const businessesWithProfiles = recent ? await Promise.all(
      recent.map(async (business) => {
        if (business.profile_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', business.profile_id)
            .single()
          
          return {
            ...business,
            profiles: profile
          }
        }
        return business
      })
    ) : []
    
    setCounts({
      totalBusinesses: totalBusinessesCount || 0,
      pendingBusinesses: pendingBusinessesCount || 0,
      activeBusinesses: activeBusinessesCount || 0,
      rejectedBusinesses: rejectedBusinessesCount || 0,
      totalUsers: totalUsersCount || 0
    })
    
    setRecentBusinesses(businessesWithProfiles)
  } catch (error) {
    console.error('Error fetching admin data:', error)
  } finally {
    setLoading(false)
  }
    }
    
    fetchData()
  }, [supabase])
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm h-24"></div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 h-96"></div>
      </div>
    )
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Businesses</p>
          <p className="text-3xl font-bold">{counts.totalBusinesses}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-600">{counts.pendingBusinesses}</p>
          <Link href="/admin/businesses?status=pending" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500">Active Businesses</p>
          <p className="text-3xl font-bold text-green-600">{counts.activeBusinesses}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Users</p>
          <p className="text-3xl font-bold">{counts.totalUsers}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Businesses</h2>
          <Link href="/admin/businesses" className="text-sm text-blue-600 hover:underline">
            View all businesses
          </Link>
          
        </div>
        
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBusinesses.map((business) => (
                <tr key={business.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{business.name}</div>
                    <div className="text-sm text-gray-500">{business.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{business.profiles?.full_name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{business.profiles?.email || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${business.status === 'active' ? 'bg-green-100 text-green-800' : 
                        business.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}
                    >
                      {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(business.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/admin/businesses/${business.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                      Review
                    </Link>
                    <Link href={`/businesses/${business.slug}`} target="_blank" className="text-gray-600 hover:text-gray-900">
                      View
                    </Link>
                    
                  </td>
                </tr>
              ))}
              
              {recentBusinesses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No businesses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}