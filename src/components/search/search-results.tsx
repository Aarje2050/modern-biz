// src/components/search/search-results.tsx
import BusinessCard from '../businesses/business-card'

type SearchResultsProps = {
  businesses: any[]
  query: string | null
  total: number
}

export default function SearchResults({ businesses, query, total }: SearchResultsProps) {
  if (businesses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No businesses found</h3>
        <p className="mt-2 text-gray-500">
          {query 
            ? `No businesses match your search for "${query}"`
            : 'No businesses match your filters'}
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        {total} {total === 1 ? 'business' : 'businesses'} found
        {query ? ` for "${query}"` : ''}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((business) => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </div>
    </div>
  )
}