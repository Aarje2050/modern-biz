// src/components/search/search-input.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SearchInput({ className = '' }: { className?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  
  // Update query state when searchParams changes
  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create new URL with search params
    const params = new URLSearchParams(searchParams.toString())
    
    if (query) {
      params.set('q', query)
    } else {
      params.delete('q')
    }
    
    // Reset to page 1 when search changes
    params.delete('page')
    
    router.push(`/search?${params.toString()}`)
  }
  
  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search businesses..."
          className="w-full py-3 pl-4 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  )
}