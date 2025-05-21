// src/app/businesses/[slug]/reviews/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/formatting'

export default async function BusinessReviewsPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  
  // Get the business
  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, slug, status')
    .eq('slug', params.slug)
    .single()
  
  if (error || !business || business.status !== 'active') {
    notFound()
  }
  
  // Get reviews for this business
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles:profile_id (
        full_name,
        avatar_url
      ),
      responses (
        id,
        content,
        created_at
      )
    `)
    .eq('business_id', business.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/businesses/${business.slug}`} className="text-blue-600 hover:underline">
          &larr; Back to {business.name}
        </Link>
        <h1 className="text-2xl font-bold mt-2">Reviews for {business.name}</h1>
      </div>
      
      {reviews && reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between mb-4">
                <div className="flex items-center">
                  <div className="mr-3 w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full text-gray-700 font-medium">
                    {review.profiles?.full_name ? review.profiles.full_name.substring(0, 2).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="font-medium">{review.profiles?.full_name || 'Anonymous'}</div>
                    <div className="text-sm text-gray-500">{formatDate(review.created_at)}</div>
                  </div>
                </div>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i} 
                      className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              
              {review.title && (
                <h3 className="text-lg font-medium mb-2">{review.title}</h3>
              )}
              
              <p className="text-gray-800 mb-4">{review.content}</p>
              
              {/* Business response */}
              {review.responses && review.responses.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-md mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Response from {business.name}</div>
                  <p className="text-gray-800">{review.responses[0].content}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    {formatDate(review.responses[0].created_at)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-600 mb-4">This business doesn't have any reviews yet.</p>
          <Link
            href={`/businesses/${business.slug}`}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Be the first to write a review
          </Link>
        </div>
      )}
    </div>
  )
}