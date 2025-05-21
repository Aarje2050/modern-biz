// src/components/businesses/business-filters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

type Category = {
  id: string
  name: string
  slug: string
}

type SortOption = 'name_asc' | 'name_desc' | 'newest' | 'oldest'

type BusinessFiltersProps = {
  categories: Category[]
  currentCategorySlug?: string
  currentSort?: SortOption
}

export default function BusinessFilters({ 
  categories, 
  currentCategorySlug = '',
  currentSort = 'name_asc'
}: BusinessFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      
      // Reset to page 1 when filters change
      params.delete('page')
      
      return params.toString()
    },
    [searchParams]
  )
  
  const handleCategoryChange = (slug: string) => {
    router.push(`/businesses?${createQueryString('category', slug)}`)
  }
  
  const handleSortChange = (sort: string) => {
    router.push(`/businesses?${createQueryString('sort', sort)}`)
  }
  
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-8">
      {/* Category Filter */}
      <div className="w-full md:w-auto mb-4 md:mb-0">
        <label htmlFor="category-filter" className="sr-only">Filter by Category</label>
        <select
          id="category-filter"
          className="block w-full md:w-48 rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
          value={currentCategorySlug}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Sort Options */}
      <div className="w-full md:w-auto">
        <label htmlFor="sort-options" className="sr-only">Sort by</label>
        <select
          id="sort-options"
          className="block w-full md:w-48 rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>
  )
}