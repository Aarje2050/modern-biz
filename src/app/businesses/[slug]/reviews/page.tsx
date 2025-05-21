// src/app/businesses/[slug]/reviews/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ReviewForm from '@/components/reviews/review-form'
import ReviewList from '@/components/reviews/review-list'

// Define TypeScript interfaces for our data
interface Business {
  id: string
  name: string
  slug: string
  logo_url: string | null
  verification_level: string
}

interface Review {
  id: string
  rating: number
  business_id: string
  profile_id: string
  status: string
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  
  const { data: business, error } = await supabase
    .from('businesses')
    .select('name')
    .eq('slug', params.slug)
    .single()
    
  if (error || !business) {
    return {
      title: 'Business Not Found',
      description: 'The business you are looking for could not be found.'
    }
  }
  
  return {
    title: `Reviews for ${business.name}`,
    description: `See what people are saying about ${business.name} and share your own experience`,
    openGraph: {
      title: `Reviews for ${business.name}`,
      description: `See what people are saying about ${business.name} and share your own experience`,
      type: 'website'
    }
  }
}

export default async function BusinessReviewsPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  
  // Get business details
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      slug,
      logo_url,
      verification_level
    `)
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single()
  
  if (error || !data) {
    notFound()
  }

  // Cast data to our Business type
  const business = data as Business
  
  // Get user session to check if logged in
  const { data: { session } } = await supabase.auth.getSession()
  
  // Get review stats
  const { data: reviewData, error: reviewError } = await supabase
    .from('reviews')
    .select('rating', { count: 'exact' })
    .eq('business_id', business.id)
    .eq('status', 'published')
  
  // Use a default value if we couldn't get the reviews
  const reviewCount = reviewError ? 0 : (reviewData?.length || 0)
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href={`/businesses/${params.slug}`}
          className="text-gray-600 hover:text-gray-900 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to {business.name}
        </Link>
      </div>
      
      <div className="flex items-center mb-8">
        <div className="relative h-14 w-14 bg-gray-100 rounded-lg overflow-hidden mr-4">
          {business.logo_url ? (
            <Image
              src={business.logo_url}
              alt={business.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 text-lg font-bold">
              {business.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">Reviews for {business.name}</h1>
          <p className="text-gray-600">
            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            {business.verification_level !== 'none' && (
              <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723a3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {business.verification_level.replace('_', ' ').charAt(0).toUpperCase() + business.verification_level.replace('_', ' ').slice(1)}
              </span>
            )}
          </p>
        </div>
      </div>
      
      {/* Write a review section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Write a Review</h2>
        
        {session ? (
          <ReviewForm businessId={business.id} />
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              Please sign in to write a review for {business.name}.
            </p>
            <a
              href={`/login?redirect_to=${encodeURIComponent(`/businesses/${params.slug}/reviews`)}`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Sign In to Review
            </a>
          </div>
        )}
      </div>
      
      {/* Reviews section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-6">All Reviews</h2>
        <ReviewList businessId={business.id} />
      </div>
    </div>
  )
}