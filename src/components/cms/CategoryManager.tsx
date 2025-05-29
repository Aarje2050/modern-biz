// src/components/cms/CategoryManager.tsx - ENTERPRISE CATEGORY MANAGEMENT
'use client'
import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  parent_id?: string
  display_order: number
  post_count: number
  is_featured: boolean
}

interface CategoryManagerProps {
  siteId: string
  initialCategories: Category[]
}

export default function CategoryManager({ siteId, initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
    parent_id: '',
    is_featured: false
  })

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && (!formData.slug || !editingCategory)) {
      const autoSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({ ...prev, slug: autoSlug }))
    }
  }, [formData.name, editingCategory])

  // Load editing data
  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        slug: editingCategory.slug,
        description: editingCategory.description || '',
        color: editingCategory.color,
        parent_id: editingCategory.parent_id || '',
        is_featured: editingCategory.is_featured
      })
      setShowForm(true)
    }
  }, [editingCategory])

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#3B82F6',
      parent_id: '',
      is_featured: false
    })
    setEditingCategory(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const categoryData = {
        ...formData,
        site_id: siteId,
        display_order: editingCategory?.display_order || categories.length
      }

      const url = editingCategory 
        ? `/api/cms/sites/${siteId}/categories/${editingCategory.id}`
        : `/api/cms/sites/${siteId}/categories`
      
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      })

      if (response.ok) {
        const result = await response.json()
        
        if (editingCategory) {
          // Update existing category
          setCategories(prev => prev.map(cat => 
            cat.id === editingCategory.id ? { ...cat, ...result } : cat
          ))
        } else {
          // Add new category
          setCategories(prev => [...prev, result])
        }
        
        resetForm()
        alert('Category saved successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to save category'}`)
      }
    } catch (error) {
      alert('Failed to save category')
      console.error('Save error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/cms/sites/${siteId}/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCategories(prev => prev.filter(cat => cat.id !== categoryId))
        alert('Category deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to delete category'}`)
      }
    } catch (error) {
      alert('Failed to delete category')
      console.error('Delete error:', error)
    }
  }

  const parentCategories = categories.filter(cat => !cat.parent_id)

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Manage Categories</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '➕ Add Category'}
        </button>
      </div>

      {/* Category Form */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingCategory ? `Edit: ${editingCategory.name}` : 'Add New Category'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Technology, Tutorial, News..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="technology"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category..."
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">None (Top Level)</option>
                  {parentCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured Category</span>
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Categories ({categories.length})</h3>
        </div>

        {categories.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {categories.sort((a, b) => a.display_order - b.display_order).map((category) => (
              <div key={category.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Color Indicator */}
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: category.color }}
                    />
                    
                    {/* Category Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                        {category.is_featured && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                            Featured
                          </span>
                        )}
                        {category.parent_id && (
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            Child Category
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        /{category.slug} • {category.post_count} posts
                      </p>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                    <a
                      href={`/blog/category/${category.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                    >
                      View
                    </a>
                  </div>
                </div>

                {/* Child Categories */}
                {categories.filter(child => child.parent_id === category.id).length > 0 && (
                  <div className="mt-4 ml-8 space-y-2">
                    {categories
                      .filter(child => child.parent_id === category.id)
                      .map(child => (
                        <div key={child.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: child.color }}
                            />
                            <span className="text-sm font-medium text-gray-700">{child.name}</span>
                            <span className="text-xs text-gray-500">({child.post_count} posts)</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingCategory(child)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(child.id)}
                              className="text-red-600 hover:text-red-800 text-xs font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">📂</div>
              <h3 className="text-lg font-medium mb-2">No categories yet</h3>
              <p className="text-sm mb-4">
                Create your first category to organize your blog posts.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create First Category
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}