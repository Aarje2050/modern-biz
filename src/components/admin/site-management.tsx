'use client'
import { useState, useEffect } from 'react'

interface Site {
  id: string
  domain: string
  name: string
  slug: string
  config: any
  status: string
  created_at: string
}

export default function SiteManagementAdmin() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [formData, setFormData] = useState({
    domain: '',
    name: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const siteData = {
        domain: formData.domain,
        name: formData.name,
        config: {
          niche: formData.niche,
          location: formData.location,
          theme: {
            primaryColor: formData.primaryColor,
            secondaryColor: '#64748b'
          },
          seo: {
            defaultTitle: `${formData.name} - Find the Best ${formData.niche} Services`,
            defaultDescription: `Discover top-rated ${formData.niche} services in ${formData.location}`,
            keywords: [formData.niche, formData.location, 'directory', 'reviews']
          },
          features: {
            reviews: true,
            messaging: true,
            analytics: true
          }
        }
      }

      const url = editingSite ? `/api/sites/${editingSite.id}` : '/api/sites'
      const method = editingSite ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(siteData)
      })

      if (response.ok) {
        setShowForm(false)
        setEditingSite(null)
        setFormData({
          domain: '',
          name: '',
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

  const handleEdit = (site: Site) => {
    setEditingSite(site)
  }

  const handleCancelEdit = () => {
    setEditingSite(null)
    setShowForm(false)
    setFormData({
      domain: '',
      name: '',
      niche: '',
      location: '',
      primaryColor: '#2563eb'
    })
  }

  if (loading) {
    return <div className="p-6">Loading sites...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Site Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add New Site'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingSite ? `Edit Site: ${editingSite.name}` : 'Create New Site'}
          </h2>
          <div className="space-y-4">
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
                  placeholder="My Business Directory"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Niche</label>
                <input
                  type="text"
                  value={formData.niche}
                  onChange={(e) => setFormData({...formData, niche: e.target.value})}
                  placeholder="duct-cleaning"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="canada"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Primary Color</label>
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                className="w-full h-10 border rounded"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleSubmit(e as any)
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {editingSite ? 'Update Site' : 'Create Site'}
              </button>
              {editingSite && (
                <button
                  onClick={handleCancelEdit}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Domain</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Niche</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Location</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Created</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sites.map((site) => (
              <tr key={site.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{site.domain}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{site.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{site.config?.niche || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{site.config?.location || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    site.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {site.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(site.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleEdit(site)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                  >
                    Edit
                  </button>
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