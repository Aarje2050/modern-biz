// src/app/(admin)/admin/users/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type User = {
  id: string
  full_name: string | null
  email: string | null
  account_type: string
  is_verified: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [processingUser, setProcessingUser] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pageSize = 10
  
  const supabase = createClient()
  // Add null check
  if (!supabase) {
    setError('Unable to connect to database')
    setLoading(false)
    return
  }
  
  useEffect(() => {
    async function fetchUsers() {
      // Add null check
      if (!supabase) {
        setError('Unable to connect to database')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        
        // Start building the query
        let query = supabase
          .from('profiles')
          .select('*', { count: 'exact' })
        
        // Apply search filter
        if (searchQuery) {
          query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        }
        
        // Apply pagination
        const from = (currentPage - 1) * pageSize
        const to = from + pageSize - 1
        
        // Execute the query
        const { data, count, error } = await query
          .order('created_at', { ascending: false })
          .range(from, to)
        
        if (error) throw error
        
        setUsers(data || [])
        setTotalPages(Math.ceil((count || 0) / pageSize))
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [currentPage, searchQuery, supabase])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page on new search
  }
  
  const toggleAdminStatus = async (userId: string, currentType: string) => {
    try {
      setProcessingUser(userId)
      
      const newType = currentType === 'admin' ? 'standard' : 'admin'
      
      const { error } = await supabase
        .from('profiles')
        .update({ account_type: newType })
        .eq('id', userId)
        
      if (error) throw error
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, account_type: newType } : user
      ))
      
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Failed to update user status')
    } finally {
      setProcessingUser(null)
    }
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
        <h1 className="text-2xl font-bold">Manage Users</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-end mb-6">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Search users..."
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
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verified
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.full_name || 'No name'}</div>
                    <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.account_type === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {user.account_type.charAt(0).toUpperCase() + user.account_type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.is_verified ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => toggleAdminStatus(user.id, user.account_type)}
                      disabled={processingUser === user.id}
                      className={`text-sm font-medium ${
                        user.account_type === 'admin' 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-purple-600 hover:text-purple-900'
                      }`}
                    >
                      {processingUser === user.id 
                        ? 'Processing...' 
                        : user.account_type === 'admin' 
                          ? 'Remove Admin' 
                          : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
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