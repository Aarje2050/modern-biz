// components/locations/LocationFilters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
}

interface LocationFiltersProps {
  categories: Category[]
  currentCategory?: string
  currentSort?: string
  locationSlug: string
}

export default function LocationFilters({
  categories,
  currentCategory = '',
  currentSort = 'name_asc',
  locationSlug
}: LocationFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = (filterType: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(filterType, value)
    } else {
      params.delete(filterType)
    }
    
    // Reset to page 1 when filters change
    params.delete('page')
    
    const queryString = params.toString()
    const newUrl = `/locations/${locationSlug}${queryString ? `?${queryString}` : ''}`
    
    router.push(newUrl)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4">
      {/* Category Filter */}
      <select 
        value={currentCategory}
        onChange={(e) => handleFilterChange('category', e.target.value)}
        className="flex-1 px-4 py-3 text-gray-900 focus:outline-none rounded-lg"
      >
        <option value="">All Categories</option>
        {categories?.map(category => (
          <option key={category.id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
      
      {/* Sort Filter */}
      <select 
        value={currentSort}
        onChange={(e) => handleFilterChange('sort', e.target.value)}
        className="px-4 py-3 text-gray-900 focus:outline-none rounded-lg"
      >
        <option value="name_asc">Name A-Z</option>
        <option value="name_desc">Name Z-A</option>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>
    </div>
  )
}