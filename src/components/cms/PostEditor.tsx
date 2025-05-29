// src/components/cms/PostEditor.tsx - BLOG POST EDITOR
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CMSAdminLayout from './CMSAdminLayout'

interface PostData {
  title: string
  slug: string
  content: string
  excerpt: string
  post_status: 'draft' | 'published' | 'private'
  seo_title: string
  seo_description: string
  seo_keywords: string[]
  featured_image_url: string
  menu_order: number
  template: string
  meta_data: any
  categories: string[]
  tags: string[]
}

interface PostEditorProps {
  siteId: string
  postId?: string
  initialData?: Partial<PostData>
}

export default function PostEditor({ siteId, postId, initialData }: PostEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content')
  
  const [formData, setFormData] = useState<PostData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    post_status: 'draft',
    seo_title: '',
    seo_description: '',
    seo_keywords: [],
    featured_image_url: '',
    menu_order: 0,
    template: 'blog-post',
    meta_data: {},
    categories: [],
    tags: [],
    ...initialData
  })

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && (!formData.slug || !postId)) {
      const autoSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({ ...prev, slug: autoSlug }))
    }
  }, [formData.title, postId])

  // Auto-generate SEO title if empty
  useEffect(() => {
    if (formData.title && !formData.seo_title) {
      setFormData(prev => ({ ...prev, seo_title: formData.title }))
    }
  }, [formData.title])

  const handleSave = async (status?: 'draft' | 'published') => {
    setSaving(true)
    
    try {
      const saveData = {
        ...formData,
        post_type: 'post', // Key difference from pages
        post_status: status || formData.post_status,
        seo_keywords: Array.isArray(formData.seo_keywords) 
          ? formData.seo_keywords 
          : (formData.seo_keywords as string).toString().split(',').map((k: string) => k.trim()).filter(Boolean),
          published_at: (status === 'published' || formData.post_status === 'published') 
          ? new Date().toISOString() : null,
        categories: formData.categories // Include categories for API
      }

      const url = postId 
        ? `/api/cms/sites/${siteId}/posts/${postId}`
        : `/api/cms/sites/${siteId}/posts`
      
      const method = postId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      })

      if (response.ok) {
        const result = await response.json()
        
        if (!postId) {
          // New post created, redirect to edit
          router.push(`/admin/sites/${siteId}/posts/${result.id}/edit`)
        } else {
          // Show success message
          alert('Post saved successfully!')
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to save post'}`)
      }
    } catch (error) {
      alert('Failed to save post')
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const getSeoScore = () => {
    let score = 0
    let maxScore = 100
    
    // Title optimization (25 points)
    if (formData.seo_title && formData.seo_title.length >= 30 && formData.seo_title.length <= 60) {
      score += 25
    } else if (formData.seo_title) {
      score += 15
    }
    
    // Description optimization (25 points)
    if (formData.seo_description && formData.seo_description.length >= 120 && formData.seo_description.length <= 160) {
      score += 25
    } else if (formData.seo_description) {
      score += 15
    }
    
    // Keywords (20 points)
    const keywords = Array.isArray(formData.seo_keywords) ? formData.seo_keywords : []
    if (keywords.length >= 3 && keywords.length <= 8) {
      score += 20
    } else if (keywords.length > 0) {
      score += 10
    }
    
    // Content length (15 points)
    if (formData.content && formData.content.length > 300) {
      score += 15
    } else if (formData.content) {
      score += 8
    }
    
    // Featured image (10 points)
    if (formData.featured_image_url) {
      score += 10
    }
    
    // Excerpt (5 points)
    if (formData.excerpt) {
      score += 5
    }
    
    return Math.round((score / maxScore) * 100)
  }

  const seoScore = getSeoScore()
  
  const getSeoScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <CMSAdminLayout siteId={siteId}>
      <div className="max-w-6xl mx-auto">
        {/* Enterprise Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {postId ? `Edit Post: ${formData.title || 'Untitled'}` : 'Create New Post'}
            </h1>
            <p className="text-gray-600 mt-1">
              {postId ? 'Update your blog post content and settings' : 'Share your thoughts with a new blog post'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {previewMode ? '📝 Edit' : '👁️ Preview'}
            </button>
            
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save Draft'}
            </button>
            
            <button
              onClick={() => handleSave('published')}
              disabled={saving || !formData.title}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Publishing...' : '🚀 Publish'}
            </button>
          </div>
        </div>

        {previewMode ? (
          // BLOG POST PREVIEW MODE
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Post Preview</span>
                <span className="text-xs text-gray-500">
                  URL: /blog/{formData.slug || 'post-url'}
                </span>
              </div>
            </div>
            <div className="p-8">
              {/* Blog Post Meta */}
              <div className="text-sm text-gray-500 mb-4">
                <span>{new Date().toLocaleDateString()}</span>
                {formData.categories.length > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    <span>in {formData.categories.join(', ')}</span>
                  </>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{formData.title || 'Post Title'}</h1>
              
              {formData.excerpt && (
                <p className="text-lg text-gray-600 mb-6 italic border-l-4 border-blue-500 pl-4">
                  {formData.excerpt}
                </p>
              )}
              
              {formData.featured_image_url && (
                <img 
                  src={formData.featured_image_url} 
                  alt={formData.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}
              
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.content || 'Post content will appear here...' }}
              />
              
              {/* Tags */}
              {formData.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // BLOG POST EDITOR MODE
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  {[
                    { key: 'content', label: '📝 Content', desc: 'Post title and content' },
                    { key: 'seo', label: '🔍 SEO', desc: 'Search optimization' },
                    { key: 'settings', label: '⚙️ Settings', desc: 'Categories & settings' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div>{tab.label}</div>
                        <div className="text-xs text-gray-400">{tab.desc}</div>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content Tab */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter your post title..."
                      className="w-full text-2xl font-semibold border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 px-0 py-3 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post URL
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-500 text-sm mr-2">yoursite.com/blog/</span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="post-url"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post Excerpt
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Brief summary of your post..."
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Appears in blog listings and social media previews
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post Content
                    </label>
                    <div className="border rounded-lg">
                      <div className="border-b bg-gray-50 px-4 py-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <button type="button" className="font-bold">B</button>
                          <button type="button" className="italic">I</button>
                          <button type="button" className="underline">U</button>
                          <span className="text-gray-400">|</span>
                          <button type="button">🔗</button>
                          <button type="button">📷</button>
                          <span className="text-gray-400">|</span>
                          <button type="button">H1</button>
                          <button type="button">H2</button>
                        </div>
                      </div>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Write your blog post here... You can use HTML tags."
                        rows={15}
                        className="w-full border-0 focus:ring-0 p-4 font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports HTML. Rich editor coming soon.
                    </p>
                  </div>
                </div>
              )}

              {/* SEO Tab - Same as Pages */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-blue-900">SEO Score</h3>
                        <p className="text-sm text-blue-700">Optimize your post for search engines</p>
                      </div>
                      <div className={`text-3xl font-bold ${getSeoScoreColor(seoScore)}`}>
                        {seoScore}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={formData.seo_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                      placeholder="Optimized title for search engines..."
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Appears in search results and browser tabs</span>
                      <span className={formData.seo_title.length > 60 ? 'text-red-500' : 'text-gray-500'}>
                        {formData.seo_title.length}/60
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={formData.seo_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                      placeholder="Compelling description that appears in search results..."
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Shown in search engine results</span>
                      <span className={formData.seo_description.length > 160 ? 'text-red-500' : 'text-gray-500'}>
                        {formData.seo_description.length}/160
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords & Tags
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(formData.seo_keywords) ? formData.seo_keywords.join(', ') : formData.seo_keywords}
                      onChange={(e) => {
                        const keywords = e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                        setFormData(prev => ({ ...prev, seo_keywords: keywords, tags: keywords }))
                      }}
                      placeholder="blog, tutorial, guide, tips"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate with commas. These will also be used as post tags.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Featured Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.featured_image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, featured_image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used for social media sharing and blog header
                    </p>
                  </div>
                </div>
              )}

              {/* Settings Tab - Blog Specific */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post Status
                    </label>
                    <select
                      value={formData.post_status}
                      onChange={(e) => setFormData(prev => ({ ...prev, post_status: e.target.value as any }))}
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  {/* Enhanced Categories Section */}
                  <CategorySelector 
                    siteId={siteId}
                    selectedCategories={formData.categories}
                    onCategoriesChange={(categories) => setFormData(prev => ({ ...prev, categories }))}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post Template
                    </label>
                    <select
                      value={formData.template}
                      onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="blog-post">Standard Blog Post</option>
                      <option value="blog-featured">Featured Post</option>
                      <option value="blog-tutorial">Tutorial Post</option>
                      <option value="blog-news">News Post</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Enhanced for Posts */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Publishing Options */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Publish</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleSave('draft')}
                      disabled={saving}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 disabled:opacity-50 flex items-center"
                    >
                      <span className="mr-2">💾</span>
                      Save Draft
                    </button>
                    <button
                      onClick={() => handleSave('published')}
                      disabled={saving || !formData.title}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 disabled:opacity-50 flex items-center"
                    >
                      <span className="mr-2">🚀</span>
                      Publish Now
                    </button>
                    <button
                      onClick={() => setPreviewMode(true)}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center"
                    >
                      <span className="mr-2">👁️</span>
                      Preview Post
                    </button>
                  </div>
                </div>

                {/* SEO Status */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="font-medium text-gray-900 mb-3">SEO Status</h3>
                  <div className="space-y-2">
                    <div className={`text-sm ${getSeoScoreColor(seoScore)}`}>
                      <span className="font-medium">Score: {seoScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          seoScore >= 80 ? 'bg-green-500' : 
                          seoScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${seoScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Post Categories */}
                {formData.categories.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.categories.map((category, index) => (
                        <span 
                          key={index}
                          className="inline-flex px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Tags */}
                {formData.tags.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </CMSAdminLayout>
  )
}

// ENTERPRISE CATEGORY SELECTOR COMPONENT
function CategorySelector({ siteId, selectedCategories, onCategoriesChange }: {
  siteId: string
  selectedCategories: string[]
  onCategoriesChange: (categories: string[]) => void
}) {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/cms/sites/${siteId}/categories`)
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [siteId])

  const handleCategoryToggle = (categoryId: string) => {
    const newSelection = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId]
    
    onCategoriesChange(newSelection)
  }

  if (loading) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categories
        </label>
        <div className="text-sm text-gray-500">Loading categories...</div>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Categories
      </label>
      
      {categories.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.id)}
                onChange={() => handleCategoryToggle(category.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm text-gray-700">{category.name}</span>
                {category.is_featured && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                    Featured
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
          No categories available. 
          <a 
            href={`/admin/sites/${siteId}/categories`}
            className="text-blue-600 hover:text-blue-700 ml-1"
          >
            Create categories first.
          </a>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-1">
        Select one or more categories for this post
      </p>
    </div>
  )
}