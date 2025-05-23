// src/app/(admin)/admin/businesses/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminBusinessesPage() {
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') || 'all'
  
  const [businesses, setBusinesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  const pageSize = 10
  
  const supabase = createClient()
  
  useEffect(() => {
    // src/app/(admin)/admin/businesses/page.tsx
// Replace the fetchBusinesses function with this:

async function fetchBusinesses() {
      
      // Add null check
      if (!supabase) {
        setError('Unable to connect to database')
        setLoading(false)
        return
      }
    try {
      setLoading(true)
      console.log('Fetching businesses with filter:', statusFilter)
      
      // Start with a simple query
      let query = supabase
        .from('businesses')
        .select('id, name, slug, status, created_at, profile_id', { count: 'exact' })
      
      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      
      // Apply search filter
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }
      
      // Apply pagination
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1
      
      // Execute the query
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)
      
      console.log('Businesses data:', data)
      console.log('Businesses count:', count)
      console.log('Query error:', error)
      
      if (error) throw error
      
      // If we successfully got businesses, try to get the profile data separately
      const businessesWithProfiles = data ? await Promise.all(
        data.map(async (business) => {
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
      
      setBusinesses(businessesWithProfiles)
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      console.error('Error fetching businesses:', error)
    } finally {
      setLoading(false)
    }
  }
    
    fetchBusinesses()
  }, [statusFilter, currentPage, searchQuery, supabase])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page on new search
  }
  
  const handleStatusChange = (status: string) => {
    const url = new URL(window.location.href)
    if (status === 'all') {
      url.searchParams.delete('status')
    } else {
      url.searchParams.set('status', status)
    }
    window.history.pushState({}, '', url.toString())
    window.location.reload()
  }
  
  if (loading && currentPage === 1) {
    return (
      <div className="animate-pulse">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 h-96"></div>
      </div>
    )
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Businesses</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div className="flex space-x-2 mb-4 md:mb-0">
            <button
              onClick={() => handleStatusChange('all')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                statusFilter === 'all' 
                  ? 'bg-gray-200 text-gray-800' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleStatusChange('pending')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                statusFilter === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => handleStatusChange('active')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                statusFilter === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                statusFilter === 'rejected' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Rejected
            </button>
          </div>
          
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Search businesses..."
              className="border border-gray-300 rounded-l-md px-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="bg-gray-800 text-white px-4 py-2 rounded-r-md hover:bg-gray-700"
            >
              Search
            </button>
          </form>
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
              {businesses.map((business) => (
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
              
              {businesses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No businesses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Previous</span>
                &laquo; Previous
              </button>
              
              <div className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Next</span>
                Next &raquo;
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}