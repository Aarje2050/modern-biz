// src/components/search/filter-sidebar.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type CategoryType = {
  id: string
  name: string
  slug: string
}

type FilterProps = {
  categories: CategoryType[]
}

export default function FilterSidebar({ categories }: FilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [locationValue, setLocationValue] = useState('')
  
  // Initialize filters from URL params
  useEffect(() => {
    // Categories
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      setSelectedCategories(categoryParam.split(','))
    } else {
      setSelectedCategories([])
    }
    
    // Location
    setLocationValue(searchParams.get('location') || '')
  }, [searchParams])
  
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Handle categories
    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories.join(','))
    } else {
      params.delete('category')
    }
    
    // Handle location
    if (locationValue.trim()) {
      params.set('location', locationValue.trim())
    } else {
      params.delete('location')
    }
    
    // Reset to page 1 when filters change
    params.delete('page')
    
    router.push(`/search?${params.toString()}`)
  }
  
  const resetFilters = () => {
    setSelectedCategories([])
    setLocationValue('')
    
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('location')
    params.delete('page')
    
    if (params.has('q')) {
      router.push(`/search?${params.toString()}`)
    } else {
      router.push('/search')
    }
  }
  
  const toggleCategory = (categorySlug: string) => {
    if (selectedCategories.includes(categorySlug)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categorySlug))
    } else {
      setSelectedCategories([...selectedCategories, categorySlug])
    }
  }
  
  const hasActiveFilters = selectedCategories.length > 0 || locationValue.trim() !== ''
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Reset all
          </button>
        )}
      </div>
      
      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center">
              <input
                id={`category-${category.slug}`}
                type="checkbox"
                className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                checked={selectedCategories.includes(category.slug)}
                onChange={() => toggleCategory(category.slug)}
              />
              <label 
                htmlFor={`category-${category.slug}`}
                className="ml-2 text-sm text-gray-700"
              >
                {category.name}
              </label>
            </div>
          ))}
          
          {categories.length === 0 && (
            <p className="text-sm text-gray-500">No categories available</p>
          )}
        </div>
      </div>
      
      {/* Location */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
        <input
          type="text"
          placeholder="City, state or zip code"
          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          value={locationValue}
          onChange={(e) => setLocationValue(e.target.value)}
        />
      </div>
      
      <button
        onClick={applyFilters}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        Apply Filters
      </button>
    </div>
  )
}