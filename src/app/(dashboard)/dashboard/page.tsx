// src/app/(dashboard)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
  
  // Get user's businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, slug, status, created_at')
    .eq('profile_id', session.user.id)
    .order('created_at', { ascending: false })
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium">Your Businesses</h2>
          </div>
          
          <div className="p-6">
            {businesses && businesses.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {businesses.map((business) => (
                  <div key={business.id} className="py-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">{business.name}</h3>
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
                    <div className="flex space-x-2">
                      <Link
                        href={`/businesses/${business.slug}`}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        View
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={`/dashboard/businesses/${business.id}/edit`}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No businesses yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new business listing.</p>
                <div className="mt-6">
                  <Link
                    href="/businesses/add"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Business
                  </Link>
                </div>
              </div>
            )}
            
            {businesses && businesses.length > 0 && (
              <div className="mt-6">
                <Link
                  href="/businesses/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Another Business
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium">Account Summary</h2>
            </div>
            <div className="px-6 py-5">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.full_name || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile?.account_type || 'Standard'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Joined</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(session.user.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
              <div className="mt-6">
                <Link
                  href="/profile"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Edit Profile →
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium">Quick Links</h2>
            </div>
            <div className="px-6 py-5">
              <ul className="divide-y divide-gray-200">
                <li className="py-3">
                  <Link href="/businesses/add" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Add a new business
                  </Link>
                </li>
                <li className="py-3">
                  <Link href="/dashboard/analytics" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Analytics
                  </Link>
                </li>
                <li className="py-3">
                  <Link href="/profile" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Update your profile
                  </Link>
                </li>
                <li className="py-3">
                  <Link href="/dashboard/reviews" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Manage your reviews
                  </Link>
                </li>
                <li className="py-3">
                  <Link href="/businesses" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Browse businesses
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}