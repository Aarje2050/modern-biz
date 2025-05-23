// src/app/(admin)/admin/setup/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Sample categories to add
const initialCategories = [
  { name: 'Restaurants', description: 'Places to eat and dine' },
  { name: 'Shopping', description: 'Retail shops and stores' },
  { name: 'Services', description: 'Professional and personal services' },
  { name: 'Health & Medical', description: 'Healthcare providers and facilities' },
  { name: 'Beauty & Spa', description: 'Salons, spas, and beauty services' },
  { name: 'Home Services', description: 'Home repair and maintenance services' },
  { name: 'Automotive', description: 'Car dealerships, repair shops, and services' },
  { name: 'Education', description: 'Schools, universities, and educational services' },
  { name: 'Entertainment', description: 'Entertainment venues and activities' },
  { name: 'Hotels & Travel', description: 'Accommodations and travel services' },
]

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{success?: string; error?: string} | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
// Add null check
if (!supabase) {
  setError('Unable to connect to database')
  setLoading(false)
  return
}
  
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
  
  const handleAddInitialCategories = async () => {
    try {
      setLoading(true)
      setResult(null)
      
      // Check if any categories already exist
      const { count } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
      
      if (count && count > 0) {
        setResult({ error: `${count} categories already exist. This tool is only for initial setup.` })
        return
      }
      
      // Prepare categories for insertion
      const categoriesToInsert = initialCategories.map(cat => ({
        name: cat.name,
        slug: generateSlug(cat.name),
        description: cat.description,
        is_featured: true
      }))
      
      // Insert categories
      const { error } = await supabase
        .from('categories')
        .insert(categoriesToInsert)
        
      if (error) throw error
      
      setResult({ success: `Successfully added ${initialCategories.length} initial categories!` })
    } catch (err: any) {
      console.error('Error adding categories:', err)
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Initial Setup</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Add Initial Categories</h2>
        <p className="text-gray-600 mb-6">
          Use this tool to add a set of common business categories to get started. 
          This should only be used once during initial setup.
        </p>
        
        {result && (
          <div className={`p-4 mb-6 ${result.error ? 'bg-red-50 border-l-4 border-red-400' : 'bg-green-50 border-l-4 border-green-400'}`}>
            <p className={result.error ? 'text-red-700' : 'text-green-700'}>
              {result.error || result.success}
            </p>
          </div>
        )}
        
        <button
          onClick={handleAddInitialCategories}
          disabled={loading}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
        >
          {loading ? 'Adding Categories...' : 'Add Initial Categories'}
        </button>
      </div>
    </div>
  )
}