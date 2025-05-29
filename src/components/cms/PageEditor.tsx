// src/components/cms/PageEditor.tsx - ENTERPRISE PAGE EDITOR
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CMSAdminLayout from './CMSAdminLayout'

interface PageData {
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
}

interface PageEditorProps {
  siteId: string
  pageId?: string
  initialData?: Partial<PageData>
}

export default function PageEditor({ siteId, pageId, initialData }: PageEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content')
  
  const [formData, setFormData] = useState<PageData>({
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
    template: '',
    meta_data: {},
    ...initialData
  })

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && (!formData.slug || !pageId)) {
      const autoSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({ ...prev, slug: autoSlug }))
    }
  }, [formData.title, pageId])

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
        post_status: status || formData.post_status,
        seo_keywords: Array.isArray(formData.seo_keywords) 
          ? formData.seo_keywords 
          : (formData.seo_keywords as string).toString().split(',').map((k: string) => k.trim()).filter(Boolean)
        }

      const url = pageId 
        ? `/api/cms/sites/${siteId}/posts/${pageId}`
        : `/api/cms/sites/${siteId}/posts`
      
      const method = pageId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      })

      if (response.ok) {
        const result = await response.json()
        
        if (!pageId) {
          // New page created, redirect to edit
          router.push(`/admin/sites/${siteId}/pages/${result.id}`)
        } else {
          // Show success message
          alert('Page saved successfully!')
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to save page'}`)
      }
    } catch (error) {
      alert('Failed to save page')
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
              {pageId ? `Edit: ${formData.title || 'Untitled'}` : 'Create New Page'}
            </h1>
            <p className="text-gray-600 mt-1">
              {pageId ? 'Update your page content and SEO settings' : 'Create a new page for your site'}
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
          // ENTERPRISE PREVIEW MODE
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Page Preview</span>
                <span className="text-xs text-gray-500">
                  URL: /{formData.slug || 'page-url'}
                </span>
              </div>
            </div>
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{formData.title || 'Page Title'}</h1>
              {formData.excerpt && (
                <p className="text-lg text-gray-600 mb-6">{formData.excerpt}</p>
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
                dangerouslySetInnerHTML={{ __html: formData.content || 'Page content will appear here...' }}
              />
            </div>
          </div>
        ) : (
          // ENTERPRISE EDITOR MODE
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  {[
                    { key: 'content', label: '📝 Content', desc: 'Page title and content' },
                    { key: 'seo', label: '🔍 SEO', desc: 'Search optimization' },
                    { key: 'settings', label: '⚙️ Settings', desc: 'Advanced options' }
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
                      Page Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter your page title..."
                      className="w-full text-2xl font-semibold border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 px-0 py-3 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page URL
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-500 text-sm mr-2">yoursite.com/</span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="page-url"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Excerpt
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Brief description of this page..."
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Short description shown in search results and page previews
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Content
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
                        placeholder="Write your page content here... You can use HTML tags."
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

              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-blue-900">SEO Score</h3>
                        <p className="text-sm text-blue-700">Optimize your page for search engines</p>
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
                      Keywords
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(formData.seo_keywords) ? formData.seo_keywords.join(', ') : formData.seo_keywords}
                      onChange={(e) => {
                        const keywords = e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                        setFormData(prev => ({ ...prev, seo_keywords: keywords }))
                      }}
                      placeholder="keyword1, keyword2, keyword3"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate with commas. 3-8 keywords recommended.
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
                      Used for social media sharing and page header
                    </p>
                  </div>

                  {/* SEO Preview */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-medium text-gray-900 mb-3">Search Preview</h3>
                    <div className="bg-white border rounded p-3">
                      <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                        {formData.seo_title || formData.title || 'Page Title'}
                      </div>
                      <div className="text-green-700 text-sm">
                        yoursite.com/{formData.slug || 'page-url'}
                      </div>
                      <div className="text-gray-600 text-sm mt-1">
                        {formData.seo_description || formData.excerpt || 'Page description will appear here...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Status
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Menu Order
                    </label>
                    <input
                      type="number"
                      value={formData.menu_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, menu_order: parseInt(e.target.value) || 0 }))}
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lower numbers appear first in navigation menus
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Template
                    </label>
                    <select
                      value={formData.template}
                      onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Default Template</option>
                      <option value="landing-page">Landing Page</option>
                      <option value="service-page">Service Page</option>
                      <option value="contact-page">Contact Page</option>
                      <option value="full-width">Full Width</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleSave('draft')}
                      disabled={saving}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      💾 Save Draft
                    </button>
                    <button
                      onClick={() => handleSave('published')}
                      disabled={saving || !formData.title}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      🚀 Publish
                    </button>
                    <button
                      onClick={() => setPreviewMode(true)}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50"
                    >
                      👁️ Preview
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
                    <ul className="text-xs text-gray-600 space-y-1 mt-3">
                      <li className={formData.seo_title ? 'text-green-600' : 'text-gray-400'}>
                        ✓ SEO Title
                      </li>
                      <li className={formData.seo_description ? 'text-green-600' : 'text-gray-400'}>
                        ✓ Meta Description  
                      </li>
                      <li className={formData.seo_keywords.length > 0 ? 'text-green-600' : 'text-gray-400'}>
                        ✓ Keywords
                      </li>
                      <li className={formData.featured_image_url ? 'text-green-600' : 'text-gray-400'}>
                        ✓ Featured Image
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Page Info */}
                {pageId && (
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Page Info</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Status: <span className="font-medium">{formData.post_status}</span></div>
                      <div>URL: <span className="font-medium">/{formData.slug}</span></div>
                      <div>Order: <span className="font-medium">{formData.menu_order}</span></div>
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