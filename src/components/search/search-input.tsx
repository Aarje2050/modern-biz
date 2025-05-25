// src/components/search/search-input.tsx (Fixed)
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

interface SearchInputProps {
  className?: string
  placeholder?: string
}

export default function SearchInput({ 
  className = '', 
  placeholder = 'Search businesses, services, or categories...' 
}: SearchInputProps) {
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
      <div className="relative flex bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-4 text-gray-900 placeholder-gray-500 focus:outline-none text-lg bg-white border-0"
            style={{ color: '#111827' }} // Ensure text is always visible
          />
          
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <button
          type="submit"
          className="bg-red-600 hover:bg-red-700 px-8 py-4 text-white font-semibold transition-colors flex items-center"
        >
          Search
        </button>
      </div>
    </form>
  )
}