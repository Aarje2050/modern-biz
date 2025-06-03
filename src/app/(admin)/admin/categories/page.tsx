// src/app/(admin)/admin/categories/page.tsx
'use client'
// Add these imports and state to src/app/(admin)/admin/categories/page.tsx
import { Tab } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  display_order: number
  is_featured: boolean
  created_at: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Add these new states for bulk operations
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Add this state for bulk import
  const [bulkCategories, setBulkCategories] = useState('')
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv')
  const [importResult, setImportResult] = useState<{success?: string; error?: string} | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    parent_id: '',
    is_featured: false
  })
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  
  // Add null check
  if (!supabase) {
    setError('Unable to connect to database')
    setLoading(false)
    return
  }
  
  useEffect(() => {
    fetchCategories()
  }, [])
  
  const fetchCategories = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
        
      if (error) throw error
      
      setCategories(data || [])
      setSelectedCategories([]) // Clear selections when refetching
    } catch (err: any) {
      console.error('Error loading categories:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Bulk selection functions
  const handleSelectCategory = (categoryId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCategories(prev => [...prev, categoryId])
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId))
    }
  }

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedCategories(categories.map(cat => cat.id))
    } else {
      setSelectedCategories([])
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return

    const selectedNames = categories
      .filter(cat => selectedCategories.includes(cat.id))
      .map(cat => cat.name)
      .join(', ')

    if (!window.confirm(
      `Are you sure you want to delete ${selectedCategories.length} categories?\n\n` +
      `Categories to delete: ${selectedNames}\n\n` +
      `This action cannot be undone.`
    )) return

    try {
      setBulkDeleting(true)
      setError(null)

      const { error } = await supabase
        .from('categories')
        .delete()
        .in('id', selectedCategories)

      if (error) throw error

      setSelectedCategories([])
      fetchCategories()
    } catch (err: any) {
      console.error('Error bulk deleting categories:', err)
      setError(`Failed to delete categories: ${err.message}`)
    } finally {
      setBulkDeleting(false)
    }
  }
  
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
  
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setError(null)
      
      if (!newCategory.name) {
        setError('Category name is required')
        return
      }
      
      const slug = generateSlug(newCategory.name)
      
      // Check if slug already exists
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
        
      if (existingCategory) {
        setError('A category with this name already exists')
        return
      }
      
      const { error } = await supabase
        .from('categories')
        .insert({
          name: newCategory.name,
          slug,
          description: newCategory.description || null,
          parent_id: newCategory.parent_id || null,
          is_featured: newCategory.is_featured
        })
        
      if (error) throw error
      
      setNewCategory({
        name: '',
        description: '',
        parent_id: '',
        is_featured: false
      })
      
      fetchCategories()
    } catch (err: any) {
      console.error('Error creating category:', err)
      setError(err.message)
    }
  }
  
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingCategory) return
    
    try {
      setError(null)
      
      const { error } = await supabase
        .from('categories')
        .update({
          name: editingCategory.name,
          description: editingCategory.description,
          parent_id: editingCategory.parent_id || null,
          is_featured: editingCategory.is_featured
        })
        .eq('id', editingCategory.id)
        
      if (error) throw error
      
      setEditingCategory(null)
      fetchCategories()
    } catch (err: any) {
      console.error('Error updating category:', err)
      setError(err.message)
    }
  }
  
  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      
      fetchCategories()
    } catch (err: any) {
      console.error('Error deleting category:', err)
      setError(err.message)
    }
  }
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 h-96"></div>
      </div>
    )
  }

  // Add this function to handle bulk import
  const handleBulkImport = async () => {
    try {
      setError(null)
      setImportResult(null)
      
      if (!bulkCategories.trim()) {
        setImportResult({ error: 'Please enter category data to import' })
        return
      }
      
      let categoriesToImport = []
      
      // Parse input based on selected format
      if (importFormat === 'csv') {
        // Process CSV format: Name,Description,Parent (optional)
        const lines = bulkCategories.trim().split('\n')
        
        for (const line of lines) {
          const [name, description, parentName] = line.split(',').map(item => item.trim())
          
          if (!name) continue // Skip empty lines
          
          const slug = generateSlug(name)
          
          // Check if category with this name/slug already exists
          const { data: existingCategory } = await supabase
            .from('categories')
            .select('id, name')
            .or(`name.eq.${name},slug.eq.${slug}`)
            .maybeSingle()
            
          if (existingCategory) {
            console.log(`Skipping duplicate category: ${name}`)
            continue
          }
          
          // Find parent_id if parent name is provided
          let parent_id = null
          if (parentName) {
            const { data: parentCategory } = await supabase
              .from('categories')
              .select('id')
              .eq('name', parentName)
              .maybeSingle()
              
            if (parentCategory) {
              parent_id = parentCategory.id
            }
          }
          
          categoriesToImport.push({
            name,
            slug,
            description: description || null,
            parent_id,
            is_featured: false
          })
        }
      } else {
        // Process JSON format
        try {
          const parsedData = JSON.parse(bulkCategories)
          
          if (!Array.isArray(parsedData)) {
            throw new Error('JSON must be an array of category objects')
          }
          
          for (const item of parsedData) {
            if (!item.name) continue // Skip items without names
            
            const slug = generateSlug(item.name)
            
            // Check if category already exists
            const { data: existingCategory } = await supabase
              .from('categories')
              .select('id, name')
              .or(`name.eq.${item.name},slug.eq.${slug}`)
              .maybeSingle()
              
            if (existingCategory) {
              console.log(`Skipping duplicate category: ${item.name}`)
              continue
            }
            
            // Find parent_id if parent name is provided
            let parent_id = null
            if (item.parent) {
              const { data: parentCategory } = await supabase
                .from('categories')
                .select('id')
                .eq('name', item.parent)
                .maybeSingle()
                
              if (parentCategory) {
                parent_id = parentCategory.id
              }
            }
            
            categoriesToImport.push({
              name: item.name,
              slug,
              description: item.description || null,
              parent_id,
              is_featured: item.featured || false
            })
          }
        } catch (err: any) {
          setImportResult({ error: `Invalid JSON format: ${err.message}` })
          return
        }
      }
      
      // Insert categories in batches (to avoid hitting request size limits)
      if (categoriesToImport.length === 0) {
        setImportResult({ error: 'No valid categories found to import' })
        return
      }
      
      // Insert in batches of 50
      const batchSize = 50
      let imported = 0
      
      for (let i = 0; i < categoriesToImport.length; i += batchSize) {
        const batch = categoriesToImport.slice(i, i + batchSize)
        
        const { error: batchError } = await supabase
          .from('categories')
          .insert(batch)
          
        if (batchError) {
          throw batchError
        }
        
        imported += batch.length
      }
      
      setImportResult({ success: `Successfully imported ${imported} categories` })
      setBulkCategories('') // Clear input after successful import
      fetchCategories()
    } catch (err: any) {
      console.error('Error importing categories:', err)
      setImportResult({ error: err.message })
    }
  }
  
  // Add this function to generate sample data
  const generateSampleData = () => {
    if (importFormat === 'csv') {
      setBulkCategories(`Restaurants,Places to eat and dine
Shopping,Retail shops and stores
Services,Professional and personal services
Health & Medical,Healthcare providers and facilities
Beauty & Spa,Salons and beauty services
Home Services,Home repair and maintenance
Automotive,Car dealerships and repair shops
Education,Schools and educational services
Entertainment,Entertainment venues and activities`)
    } else {
      setBulkCategories(JSON.stringify([
        { name: "Restaurants", description: "Places to eat and dine", featured: true },
        { name: "Shopping", description: "Retail shops and stores" },
        { name: "Services", description: "Professional and personal services" },
        { name: "Cafes", description: "Coffee shops and cafes", parent: "Restaurants" }
      ], null, 2))
    }
  }

  // Calculate if all visible categories are selected
  const allSelected = categories.length > 0 && selectedCategories.length === categories.length
  const someSelected = selectedCategories.length > 0 && selectedCategories.length < categories.length
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Categories</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
<div className="bg-white rounded-lg shadow-sm p-6 mb-8">
  <Tab.Group>
    <Tab.List className="flex space-x-4 border-b border-gray-200 mb-6">
      <Tab
        className={({ selected }) =>
          `py-2 px-4 text-sm font-medium focus:outline-none ${
            selected
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`
        }
      >
        Categories List
      </Tab>
      <Tab
        className={({ selected }) =>
          `py-2 px-4 text-sm font-medium focus:outline-none ${
            selected
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`
        }
      >
        Add Category
      </Tab>
      <Tab
        className={({ selected }) =>
          `py-2 px-4 text-sm font-medium focus:outline-none ${
            selected
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`
        }
      >
        Bulk Import
      </Tab>
    </Tab.List>
    
    <Tab.Panels>
      {/* Categories List Panel with Bulk Select/Delete */}
      <Tab.Panel>
        {/* Bulk Actions Bar */}
        {selectedCategories.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-900">
                  {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear selection
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {bulkDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    `Delete ${selectedCategories.length}`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {categories.length === 0 ? (
          <p className="text-gray-500">No categories found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      checked={allSelected}
                      ref={input => {
                        if (input) input.indeterminate = someSelected
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Featured
                  </th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map(category => (
                  <tr 
                    key={category.id}
                    className={selectedCategories.includes(category.id) ? 'bg-blue-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                        checked={selectedCategories.includes(category.id)}
                        onChange={(e) => handleSelectCategory(category.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{category.name}</div>
                      {category.parent_id && (
                        <div className="text-xs text-gray-500">
                          Parent: {categories.find(c => c.id === category.parent_id)?.name || 'Unknown'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.is_featured ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tab.Panel>
      
      {/* Add Category Panel */}
      <Tab.Panel>
        <h2 className="text-lg font-medium mb-4">Add New Category</h2>
        <form onSubmit={handleCreateCategory}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="parent" className="block text-sm font-medium text-gray-700">
                Parent Category
              </label>
              <select
                id="parent"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                value={newCategory.parent_id}
                onChange={(e) => setNewCategory({...newCategory, parent_id: e.target.value})}
              >
                <option value="">None (Top Level)</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                id="featured"
                type="checkbox"
                className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                checked={newCategory.is_featured}
                onChange={(e) => setNewCategory({...newCategory, is_featured: e.target.checked})}
              />
              <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                Featured category
              </label>
            </div>
            
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Create Category
            </button>
          </div>
        </form>
      </Tab.Panel>
      
      {/* Bulk Import Panel */}
      <Tab.Panel>
        <h2 className="text-lg font-medium mb-4">Bulk Import Categories</h2>
        
        {importResult && (
          <div className={`p-4 mb-6 ${importResult.error ? 'bg-red-50 border-l-4 border-red-400' : 'bg-green-50 border-l-4 border-green-400'}`}>
            <p className={importResult.error ? 'text-red-700' : 'text-green-700'}>
              {importResult.error || importResult.success}
            </p>
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex space-x-4 mb-2">
            <div className="flex items-center">
              <input
                id="format-csv"
                name="import-format"
                type="radio"
                className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300"
                checked={importFormat === 'csv'}
                onChange={() => setImportFormat('csv')}
              />
              <label htmlFor="format-csv" className="ml-2 block text-sm font-medium text-gray-700">
                CSV Format
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="format-json"
                name="import-format"
                type="radio"
                className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300"
                checked={importFormat === 'json'}
                onChange={() => setImportFormat('json')}
              />
              <label htmlFor="format-json" className="ml-2 block text-sm font-medium text-gray-700">
                JSON Format
              </label>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">
            {importFormat === 'csv' 
              ? 'Enter categories in CSV format: "Name,Description,Parent (optional)" - one per line'
              : 'Enter categories in JSON format: array of objects with name, description, parent, and featured properties'}
          </p>
          
          <button
            type="button"
            onClick={generateSampleData}
            className="text-sm text-blue-600 hover:text-blue-800 mb-2"
          >
            Load sample data
          </button>
          
          <textarea
            rows={10}
            className="w-full border border-gray-300 rounded-md shadow-sm focus:border-gray-500 focus:ring-gray-500 p-2 font-mono text-sm"
            value={bulkCategories}
            onChange={(e) => setBulkCategories(e.target.value)}
            placeholder={importFormat === 'csv' 
              ? 'Restaurants,Places to eat and dine\nShopping,Retail shops and stores' 
              : '[{ "name": "Restaurants", "description": "Places to eat" }]'}
          ></textarea>
        </div>
        
        <button
          onClick={handleBulkImport}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Import Categories
        </button>
      </Tab.Panel>
    </Tab.Panels>
  </Tab.Group>
</div>
      
      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="relative bg-white rounded-lg max-w-md w-full p-6">
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              onClick={() => setEditingCategory(null)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-lg font-medium mb-4">Edit Category</h2>
            
            <form onSubmit={handleUpdateCategory}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                  ></textarea>
                </div>
                
                <div>
                 <label htmlFor="edit-parent" className="block text-sm font-medium text-gray-700">
                   Parent Category
                 </label>
                 <select
                   id="edit-parent"
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                   value={editingCategory.parent_id || ''}
                   onChange={(e) => setEditingCategory({...editingCategory, parent_id: e.target.value || null})}
                 >
                   <option value="">None (Top Level)</option>
                   {categories
                     .filter(c => c.id !== editingCategory.id) // Can't be its own parent
                     .map(category => (
                       <option key={category.id} value={category.id}>
                         {category.name}
                       </option>
                     ))
                   }
                 </select>
               </div>
               
               <div className="flex items-center">
                 <input
                   id="edit-featured"
                   type="checkbox"
                   className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                   checked={editingCategory.is_featured}
                   onChange={(e) => setEditingCategory({...editingCategory, is_featured: e.target.checked})}
                 />
                 <label htmlFor="edit-featured" className="ml-2 block text-sm text-gray-700">
                   Featured category
                 </label>
               </div>
               
               <div className="flex justify-end space-x-3 mt-6">
                 <button
                   type="button"
                   className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                   onClick={() => setEditingCategory(null)}
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                 >
                   Save Changes
                 </button>
               </div>
             </div>
           </form>
         </div>
       </div>
     )}
   </div>
 )
}