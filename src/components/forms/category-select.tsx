// src/components/forms/category-select.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CategoryOption = {
  id: string
  name: string
  parent_id: string | null
}

type CategorySelectProps = {
  selectedCategories: string[]
  onChange: (categoryIds: string[]) => void
  maxCategories?: number
}

export default function CategorySelect({ 
  selectedCategories, 
  onChange,
  maxCategories = 5 
}: CategorySelectProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, parent_id')
          .order('name')
        
        if (error) throw error
        setCategories(data || [])
      } catch (err) {
        console.error('Error loading categories:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadCategories()
  }, [supabase])
  
  const handleCategoryChange = (categoryId: string) => {
    const updatedCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId]
    
    // Limit to maxCategories
    const limitedCategories = updatedCategories.slice(0, maxCategories)
    onChange(limitedCategories)
  }
  
  if (loading) {
    return <div className="animate-pulse h-40 bg-gray-200 rounded"></div>
  }
  
  // Organize categories by parent
  const parentCategories = categories.filter(c => !c.parent_id)
  const childCategories = categories.filter(c => c.parent_id)
  
  // Group child categories by parent_id
  const childrenByParent: Record<string, CategoryOption[]> = {}
  childCategories.forEach(child => {
    if (child.parent_id) {
      if (!childrenByParent[child.parent_id]) {
        childrenByParent[child.parent_id] = []
      }
      childrenByParent[child.parent_id].push(child)
    }
  })
  
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Categories
        </label>
        <span className="text-xs text-gray-500">
          {selectedCategories.length}/{maxCategories} selected
        </span>
      </div>
      
      {categories.length === 0 ? (
        <p className="text-sm text-gray-500">No categories available</p>
      ) : (
        <div className="border border-gray-300 rounded-md p-3 max-h-72 overflow-y-auto">
          <div className="space-y-3">
            {parentCategories.map(parent => (
              <div key={parent.id}>
                <div className="flex items-center">
                  <input
                    id={`category-${parent.id}`}
                    type="checkbox"
                    className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                    checked={selectedCategories.includes(parent.id)}
                    onChange={() => handleCategoryChange(parent.id)}
                    disabled={!selectedCategories.includes(parent.id) && selectedCategories.length >= maxCategories}
                  />
                  <label htmlFor={`category-${parent.id}`} className="ml-2 text-sm font-medium text-gray-700">
                    {parent.name}
                  </label>
                </div>
                
                {/* Show child categories if parent has children */}
                {childrenByParent[parent.id] && (
                  <div className="ml-6 mt-1 space-y-1">
                    {childrenByParent[parent.id].map(child => (
                      <div key={child.id} className="flex items-center">
                        <input
                          id={`category-${child.id}`}
                          type="checkbox"
                          className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                          checked={selectedCategories.includes(child.id)}
                          onChange={() => handleCategoryChange(child.id)}
                          disabled={!selectedCategories.includes(child.id) && selectedCategories.length >= maxCategories}
                        />
                        <label htmlFor={`category-${child.id}`} className="ml-2 text-sm text-gray-600">
                          {child.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <p className="mt-1 text-xs text-gray-500">
        Select up to {maxCategories} categories that best describe your business
      </p>
    </div>
  )
}