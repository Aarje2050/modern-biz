// src/app/saved/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import SaveBusinessButton from '@/components/businesses/save-business-button'

export const metadata = {
  title: 'Saved Businesses - Business Directory',
  description: 'View and manage your saved businesses',
}

// Define proper TypeScript types
type SavedBusiness = {
  id: string
  created_at: string
  business_id: string
  businesses: {
    id: string
    name: string
    slug: string
    short_description: string | null
    logo_url: string | null
  }
}

type EnhancedSavedBusiness = SavedBusiness & {
  businesses: SavedBusiness['businesses'] & {
    city?: string
    state?: string
  }
}

export default async function SavedBusinessesPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login?redirect_to=/saved')
  }
  
  // Get user's saved businesses with joined business details
  // Note: We're explicitly declaring the type of savedBusinesses
  const { data: savedBusinesses, error } = await supabase
    .from('core.saved_businesses')
    .select(`
      id,
      created_at,
      business_id,
      businesses:business_id(
        id,
        name,
        slug,
        short_description,
        logo_url
      )
    `)
    .eq('profile_id', session.user.id)
    .order('created_at', { ascending: false })
  
  // Enhance results with location information
  const enhancedBusinesses: EnhancedSavedBusiness[] = await Promise.all((savedBusinesses || []).map(async (saved: any) => {
    const business = saved.businesses
    
    if (!business) return saved
    
    // Get primary location for each business
    const { data: location } = await supabase
      .from('locations')
      .select('city, state')
      .eq('business_id', business.id)
      .eq('is_primary', true)
      .limit(1)
      .maybeSingle()
    
    return {
      ...saved,
      businesses: {
        ...business,
        city: location?.city || undefined,
        state: location?.state || undefined
      }
    }
  }))
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Saved Businesses</h1>
      
      {enhancedBusinesses && enhancedBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enhancedBusinesses.map(saved => {
            const business = saved.businesses
            
            return (
              <div key={saved.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4">
                      <div className="relative h-16 w-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {business.logo_url ? (
                          <Image
                            src={business.logo_url}
                            alt={business.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                            {business.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-medium hover:text-gray-700">
                          <Link href={`/businesses/${business.slug}`}>
                            {business.name}
                          </Link>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {business.city}{business.city && business.state ? ', ' : ''}{business.state}
                        </p>
                      </div>
                    </div>
                    <SaveBusinessButton businessId={business.id} isSaved={true} savedId={saved.id} />
                  </div>
                  
                  {business.short_description && (
                    <p className="text-gray-600 mt-4 text-sm line-clamp-2">
                      {business.short_description}
                    </p>
                  )}
                  
                  <div className="mt-4 flex justify-between items-center">
                    <Link 
                      href={`/businesses/${business.slug}`}
                      className="text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      View Details
                    </Link>
                    <span className="text-xs text-gray-500">
                      Saved on {new Date(saved.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No saved businesses</h3>
          <p className="mt-2 text-gray-500">
            You haven't saved any businesses yet. Browse the directory and save businesses you're interested in.
          </p>
          <div className="mt-6">
            <Link 
              href="/businesses" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Browse Businesses
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}