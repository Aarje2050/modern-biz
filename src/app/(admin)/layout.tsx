// src/app/(admin)/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const router = useRouter()
  
  
  useEffect(() => {
    async function checkAdmin() {
      
  // Add null check
  if (!supabase) {
    setError('Unable to connect to database')
    setLoading(false)
    return
  }
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login?redirect_to=/admin')
          return
        }
        
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', session.user.id)
          .single()
          
        if (profile?.account_type !== 'admin') {
          router.push('/')
          return
        }
        
        setIsAdmin(true)
      } catch (error) {
        console.error('Error checking admin status:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    
    checkAdmin()
  }, [router, supabase])
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  
  if (!isAdmin) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin" className="flex-shrink-0 font-bold">
                Business Directory Admin
              </Link>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link href="/admin" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                    Dashboard
                  </Link>
                  <Link href="/admin/analytics" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                    Analytics
                  </Link>
                  <Link href="/admin/businesses" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                    Businesses
                  </Link>
                  
<Link href="/admin/categories" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
  Categories
</Link>
                  <Link href="/admin/users" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                    Manage Users
                  </Link>
                  <Link href="/admin/sites" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                    Site Management
                  </Link>
                  <Link href="/admin/bulk-assign" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                    Bulk Assign
                  </Link>
                  <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                    Back to Site
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}