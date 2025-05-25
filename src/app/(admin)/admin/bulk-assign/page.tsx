'use client'
import { useState, useEffect } from 'react'

interface Site {
  id: string
  name: string
  domain: string
  config: any
}

interface UnassignedStats {
  businesses: number
  categories: number
  profiles: number
}

export default function BulkSiteAssignment() {
  const [sites, setSites] = useState<Site[]>([])
  const [stats, setStats] = useState<UnassignedStats | null>(null)
  const [selectedSite, setSelectedSite] = useState('')
  const [assignmentType, setAssignmentType] = useState<'all' | 'businesses' | 'categories'>('businesses')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSites()
    fetchUnassignedStats()
  }, [])

  const fetchSites = async () => {
    const response = await fetch('/api/sites')
    if (response.ok) {
      const data = await response.json()
      setSites(data)
    }
  }

  const fetchUnassignedStats = async () => {
    const response = await fetch('/api/admin/unassigned-stats')
    if (response.ok) {
      const data = await response.json()
      setStats(data)
    }
  }

  const handleBulkAssignment = async () => {
    if (!selectedSite) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: selectedSite,
          type: assignmentType
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully assigned ${result.updated} records to site`)
        fetchUnassignedStats()
      }
    } catch (error) {
      console.error('Assignment error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Bulk Site Assignment</h1>

      {stats && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Unassigned Data</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.businesses}</div>
              <div className="text-sm text-gray-600">Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.categories}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.profiles}</div>
              <div className="text-sm text-gray-600">Profiles</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Assign Unassigned Data to Site</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Target Site</label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Choose a site...</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.domain})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">What to Assign</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="businesses"
                  checked={assignmentType === 'businesses'}
                  onChange={(e) => setAssignmentType(e.target.value as any)}
                  className="mr-2"
                />
                Only Businesses ({stats?.businesses || 0} unassigned)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="categories"
                  checked={assignmentType === 'categories'}
                  onChange={(e) => setAssignmentType(e.target.value as any)}
                  className="mr-2"
                />
                Only Categories ({stats?.categories || 0} unassigned)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="all"
                  checked={assignmentType === 'all'}
                  onChange={(e) => setAssignmentType(e.target.value as any)}
                  className="mr-2"
                />
                Everything (Businesses, Categories, Profiles)
              </label>
            </div>
          </div>

          <button
            onClick={handleBulkAssignment}
            disabled={!selectedSite || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Assigning...' : 'Assign to Site'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">⚠️ Important Notes:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• This will assign ALL unassigned data to the selected site</li>
            <li>• Once assigned, data will only appear on that specific domain</li>
            <li>• This action cannot be easily undone</li>
            <li>• Make sure you select the correct target site</li>
          </ul>
        </div>
      </div>
    </div>
  )
}