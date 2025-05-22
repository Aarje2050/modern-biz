// src/components/search/search-input.tsx (update existing)
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

interface SearchInputProps {
  className?: string
}

export default function SearchInput({ className = '' }: SearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  
  // Initialize with current search query from URL
  useEffect(() => {
    const currentQuery = searchParams.get('q')
    if (currentQuery) {
      setQuery(currentQuery)
    }
  }, [searchParams])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) {
      return
    }
    
    // Create new URL with search query
    const params = new URLSearchParams(searchParams.toString())
    params.set('q', query.trim())
    params.delete('page') // Reset to first page on new search
    
    // Navigate to search page with new query
    router.push(`/search?${params.toString()}`)
    
    // REMOVE TRACKING FROM HERE - SearchTracker will handle it
  }
  
  const handleClear = () => {
    setQuery('')
    
    // Remove search query from URL
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    params.delete('page')
    
    if (params.toString()) {
      router.push(`/search?${params.toString()}`)
    } else {
      router.push('/search')
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search businesses, services, or categories..."
          className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  )
}