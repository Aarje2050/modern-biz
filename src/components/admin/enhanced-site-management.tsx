'use client'
import { useState, useEffect } from 'react'

interface Site {
  id: string
  domain: string
  name: string
  slug: string
  site_type: string
  template: string
  config: any
  status: string
  created_at: string
}



const SITE_TYPES = {
  directory: {
    name: 'Business Directory',
    description: 'Full business directory with listings, reviews, search',
    templates: ['directory-modern', 'directory-classic'],
    fields: ['niche', 'location']
  },
  landing: {
    name: 'Landing Page',
    description: 'Single-page marketing site with conversion focus',
    templates: ['landing-conversion', 'landing-minimal'],
    fields: ['niche']
  },
  service: {
    name: 'Service Business',
    description: 'Local service business with booking and contact',
    templates: ['service-local', 'service-professional'],
    fields: ['niche', 'location']
  },
  static: {
    name: 'Static Website',
    description: 'Multi-page static website',
    templates: ['static-corporate', 'static-portfolio'],
    fields: []
  }
}

export default function EnhancedSiteManagement() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [formData, setFormData] = useState({
    domain: '',
    name: '',
    siteType: 'directory',
    template: 'directory-modern',
    niche: '',
    location: '',
    primaryColor: '#2563eb'
  })

  useEffect(() => {
    fetchSites()
  }, [])

  useEffect(() => {
    if (editingSite) {
      setFormData({
        domain: editingSite.domain,
        name: editingSite.name,
        siteType: editingSite.site_type || 'directory',
        template: editingSite.template || 'directory-modern',
        niche: editingSite.config?.niche || '',
        location: editingSite.config?.location || '',
        primaryColor: editingSite.config?.theme?.primaryColor || '#2563eb'
      })
      setShowForm(true)
    }
  }, [editingSite])

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites')
      if (response.ok) {
        const data = await response.json()
        setSites(data)
      }
    } catch (error) {
      console.error('Error fetching sites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSiteTypeChange = (siteType: string) => {
    const templates = SITE_TYPES[siteType as keyof typeof SITE_TYPES]?.templates || []
    setFormData({
      ...formData,
      siteType,
      template: templates[0] || ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const siteData = {
        domain: formData.domain,
        name: formData.name,
        site_type: formData.siteType,
        template: formData.template,
        config: {
          template: formData.template,
          niche: formData.niche,
          location: formData.location,
          theme: {
            primaryColor: formData.primaryColor,
            secondaryColor: '#64748b'
          },
          seo: {
            defaultTitle: `${formData.name} - ${formData.niche ? `Best ${formData.niche} Services` : 'Welcome'}`,
            defaultDescription: `${formData.niche ? `Discover top-rated ${formData.niche} services` : 'Welcome to our website'} ${formData.location ? `in ${formData.location}` : ''}`,
            keywords: [formData.niche, formData.location, 'directory', 'reviews'].filter(Boolean)
          },
          features: SITE_TYPES[formData.siteType as keyof typeof SITE_TYPES] ? {
            reviews: formData.siteType === 'directory',
            messaging: formData.siteType === 'directory',
            analytics: true,
            booking: formData.siteType === 'service'
          } : {}
        }
      }

      const url = editingSite ? `/api/sites/${editingSite.id}` : '/api/sites'
      const method = editingSite ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteData)
      })

      if (response.ok) {
        setShowForm(false)
        setEditingSite(null)
        setFormData({
          domain: '',
          name: '',
          siteType: 'directory',
          template: 'directory-modern',
          niche: '',
          location: '',
          primaryColor: '#2563eb'
        })
        fetchSites()
      }
    } catch (error) {
      console.error('Error saving site:', error)
    }
  }

  const currentSiteType: {
    name: string
    description: string
    templates: string[]
    fields: string[]
  } = SITE_TYPES[formData.siteType as keyof typeof SITE_TYPES]
  if (loading) return <div className="p-6">Loading sites...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Site Management Platform</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Create New Site'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingSite ? `Edit: ${editingSite.name}` : 'Create New Site'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Domain</label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({...formData, domain: e.target.value})}
                  placeholder="example.com"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Site Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="My Awesome Site"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            {/* Site Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Site Type</label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(SITE_TYPES).map(([key, type]) => (
                  <div
                    key={key}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      formData.siteType === key 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSiteTypeChange(key)}
                  >
                    <h3 className="font-medium">{type.name}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Selection */}
            {currentSiteType && (
              <div>
                <label className="block text-sm font-medium mb-1">Template</label>
                <select
                  value={formData.template}
                  onChange={(e) => setFormData({...formData, template: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  {currentSiteType.templates.map(template => (
                    <option key={template} value={template}>
                      {template.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dynamic Fields Based on Site Type */}
            {currentSiteType?.fields.includes('niche') && (
              <div>
                <label className="block text-sm font-medium mb-1">Niche/Industry</label>
                <input
                  type="text"
                  value={formData.niche}
                  onChange={(e) => setFormData({...formData, niche: e.target.value})}
                  placeholder="e.g., duct-cleaning, restaurants, plumbing"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            )}

            {currentSiteType?.fields.includes('location') && (
              <div>
                <label className="block text-sm font-medium mb-1">Target Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Toronto, Canada, New York"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            )}

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium mb-1">Primary Color</label>
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                className="w-full h-10 border rounded"
              />
            </div>

            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              {editingSite ? 'Update Site' : 'Create Site'}
            </button>
          </form>
        </div>
      )}

      {/* Sites Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Domain</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Template</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sites.map((site) => (
              <tr key={site.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{site.domain}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{site.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {SITE_TYPES[site.site_type as keyof typeof SITE_TYPES]?.name || site.site_type || 'Directory'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{site.template || 'directory-modern'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    site.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {site.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setEditingSite(site)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 mr-2"
                  >
                    Edit
                  </button>
                  <a 
                    href={`http://${site.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 mr-2 inline-block"
                  >
                    Visit Site
                  </a>
                  <a 
                    href={`/admin/sites/${site.id}`}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600 inline-block"
                  >
                    Manage
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {sites.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No sites found. Create your first site to get started.
          </div>
        )}
      </div>
    </div>
  )
}