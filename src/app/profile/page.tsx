// src/app/profile/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProfileForm from '@/components/profile/profile-form'

export const metadata = {
  title: 'My Profile - Business Directory',
  description: 'Manage your profile and business listings',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login?redirect_to=/profile')
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
    .select(`
      id,
      name,
      slug,
      status,
      logo_url,
      created_at,
      verification_level
    `)
    .eq('profile_id', session.user.id)
    .order('created_at', { ascending: false })
  
  // Get user's reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      title,
      content,
      created_at,
      status,
      businesses:business_id(
        id,
        name,
        slug
      )
    `)
    .eq('profile_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(5)
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Profile info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-32 h-32 mb-4 bg-gray-200 rounded-full overflow-hidden">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Profile picture'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-4xl font-bold">
                    {profile?.full_name 
                      ? profile.full_name.substring(0, 2).toUpperCase() 
                      : session.user.email?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-medium">
                {profile?.full_name || 'User'}
              </h2>
              <p className="text-gray-600">{session.user.email}</p>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600 mb-2">
                Account type: <span className="font-medium">{profile?.account_type || 'Standard'}</span>
              </p>
              <p className="text-sm text-gray-600">
                Member since: <span className="font-medium">{new Date(session.user.created_at).toLocaleDateString()}</span>
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Quick Links</h3>
            <nav className="space-y-2">
              <Link href="/businesses/add" className="flex items-center text-gray-700 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50">
                <svg className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add a New Business
              </Link>
              <Link href="/dashboard" className="flex items-center text-gray-700 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50">
                <svg className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              <Link href="/saved" className="flex items-center text-gray-700 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50">
                <svg className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Saved Businesses
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.href = '/'
                }}
                className="w-full flex items-center text-gray-700 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50"
              >
                <svg className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </nav>
          </div>
        </div>
        
        {/* Right column - Profile form and businesses */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Edit Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Edit Profile</h3>
            <ProfileForm profile={profile} userId={session.user.id} />
          </div>
          
          {/* User's Businesses */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">My Businesses</h3>
              <Link 
                href="/businesses/add"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                + Add New
              </Link>
            </div>
            
            {businesses && businesses.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {businesses.map((business) => (
                  <div key={business.id} className="py-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="relative h-12 w-12 mr-4 bg-gray-200 rounded-full overflow-hidden">
                        {business.logo_url ? (
                          <Image
                            src={business.logo_url}
                            alt={business.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold">
                            {business.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-medium">{business.name}</h4>
                        <div className="flex items-center mt-1">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              business.status === 'active' ? 'bg-green-100 text-green-800' :
                              business.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                          </span>
                          {business.verification_level !== 'none' && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {business.verification_level.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {business.status === 'active' && (
                        <Link
                          href={`/businesses/${business.slug}`}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          View
                        </Link>
                      )}
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
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-base font-medium text-gray-900">No businesses yet</h3>
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
          </div>
          
          {/* User's Reviews */}
          {/* {reviews && reviews.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">My Reviews</h3>
              <div className="divide-y divide-gray-200">
                {reviews.map((review) => (
                  <div key={review.id} className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link 
                          href={`/businesses/${review.businesses?.slug}`} 
                          className="text-base font-medium hover:text-gray-700"
                        >
                          {review.businesses?.name}
                        </Link>
                        <div className="flex items-center mt-1">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <svg 
                                key={i} 
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          review.status === 'published' ? 'bg-green-100 text-green-800' :
                          review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                      </span>
                    </div>
                    {review.title && (
                      <h4 className="font-medium mt-2">{review.title}</h4>
                    )}
                    <p className="text-gray-600 mt-1">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  )
}