'use client'
import { useState, useEffect } from 'react'

interface SiteCustomizerProps {
  siteId: string
  siteName: string
  customizations: Record<string, any>
}

interface ColorPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  )
}

export default function SiteCustomizer({ 
  siteId, 
  siteName, 
  customizations: initialCustomizations 
}: SiteCustomizerProps) {
  const [activeTab, setActiveTab] = useState('colors')
  const [customizations, setCustomizations] = useState(initialCustomizations)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Set<string>>(new Set())

  const tabs = [
    { id: 'colors', name: 'Colors & Branding', icon: '🎨' },
    { id: 'typography', name: 'Typography', icon: '📝' },
    { id: 'layout', name: 'Layout & Spacing', icon: '📐' },
    { id: 'header', name: 'Header', icon: '🏠' },
    { id: 'footer', name: 'Footer', icon: '🦶' },
    { id: 'custom_css', name: 'Custom CSS', icon: '💻' }
  ]

  // Update customizations and mark as changed
  const updateCustomizations = (section: string, newSettings: any) => {
    setCustomizations(prev => ({
      ...prev,
      [section]: newSettings
    }))
    setHasUnsavedChanges(prev => new Set([...prev, section]))
    setError(null)
  }

  // Save specific section
  const saveSection = async (section: string) => {
    setSaving(section)
    setError(null)
    
    try {
      const response = await fetch(`/api/cms/sites/${siteId}/customizations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          settings: customizations[section]
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save customizations')
      }

      setHasUnsavedChanges(prev => {
        const newSet = new Set(prev)
        newSet.delete(section)
        return newSet
      })
      setSuccess(`${tabs.find(t => t.id === section)?.name} saved successfully!`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(null)
    }
  }

  // Save all sections
  const saveAll = async () => {
    setSaving('all')
    setError(null)
    
    try {
      const savePromises = Array.from(hasUnsavedChanges).map(section =>
        fetch(`/api/cms/sites/${siteId}/customizations`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section,
            settings: customizations[section]
          })
        })
      )

      const responses = await Promise.all(savePromises)
      const failedResponses = responses.filter(r => !r.ok)

      if (failedResponses.length > 0) {
        throw new Error('Some customizations failed to save')
      }

      setHasUnsavedChanges(new Set())
      setSuccess('All customizations saved successfully!')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(null)
    }
  }

  // Reset section to defaults
  const resetSection = async (section: string) => {
    if (!confirm(`Reset ${tabs.find(t => t.id === section)?.name} to defaults?`)) {
      return
    }

    setSaving(section)
    try {
      const response = await fetch(`/api/cms/sites/${siteId}/customizations/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset section')
      }

      // Update local state with defaults
      const defaultSettings = getDefaultSettings(section)
      setCustomizations(prev => ({
        ...prev,
        [section]: defaultSettings
      }))

      setHasUnsavedChanges(prev => {
        const newSet = new Set(prev)
        newSet.delete(section)
        return newSet
      })
      setSuccess(`${tabs.find(t => t.id === section)?.name} reset to defaults!`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(null)
    }
  }

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  // Render section content based on active tab
  const renderSectionContent = () => {
    const sectionData = customizations[activeTab] || {}

    switch (activeTab) {
      case 'colors':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker
                  label="Primary Color"
                  value={sectionData.primary || '#3B82F6'}
                  onChange={(value) => updateCustomizations('colors', { ...sectionData, primary: value })}
                />
                <ColorPicker
                  label="Secondary Color"
                  value={sectionData.secondary || '#64748B'}
                  onChange={(value) => updateCustomizations('colors', { ...sectionData, secondary: value })}
                />
                <ColorPicker
                  label="Accent Color"
                  value={sectionData.accent || '#10B981'}
                  onChange={(value) => updateCustomizations('colors', { ...sectionData, accent: value })}
                />
                <ColorPicker
                  label="Background"
                  value={sectionData.background || '#FFFFFF'}
                  onChange={(value) => updateCustomizations('colors', { ...sectionData, background: value })}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Text Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker
                  label="Primary Text"
                  value={sectionData.text_primary || '#1F2937'}
                  onChange={(value) => updateCustomizations('colors', { ...sectionData, text_primary: value })}
                />
                <ColorPicker
                  label="Secondary Text"
                  value={sectionData.text_secondary || '#6B7280'}
                  onChange={(value) => updateCustomizations('colors', { ...sectionData, text_secondary: value })}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Interface</h3>
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker
                  label="Surface Color"
                  value={sectionData.surface || '#F8FAFC'}
                  onChange={(value) => updateCustomizations('colors', { ...sectionData, surface: value })}
                />
                <ColorPicker
                  label="Border Color"
                  value={sectionData.border || '#E5E7EB'}
                  onChange={(value) => updateCustomizations('colors', { ...sectionData, border: value })}
                />
              </div>
            </div>
          </div>
        )

      case 'typography':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Font Family</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heading Font
                  </label>
                  <select
                    value={sectionData.heading_font || 'Inter'}
                    onChange={(e) => updateCustomizations('typography', { 
                      ...sectionData, 
                      heading_font: e.target.value 
                    })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Source Sans Pro">Source Sans Pro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body Font
                  </label>
                  <select
                    value={sectionData.body_font || 'Inter'}
                    onChange={(e) => updateCustomizations('typography', { 
                      ...sectionData, 
                      body_font: e.target.value 
                    })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Source Sans Pro">Source Sans Pro</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Font Sizes</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(sectionData.font_sizes || {}).map(([size, value]) => (
                  <div key={size}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {size.toUpperCase()} ({value as string})
                    </label>
                    <input
                      type="text"
                      value={value as string}
                      onChange={(e) => updateCustomizations('typography', {
                        ...sectionData,
                        font_sizes: { ...sectionData.font_sizes, [size]: e.target.value }
                      })}
                      className="block w-full border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'layout':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Container Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container Width
                  </label>
                  <input
                    type="text"
                    value={sectionData.container_width || '1200px'}
                    onChange={(e) => updateCustomizations('layout', { 
                      ...sectionData, 
                      container_width: e.target.value 
                    })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sidebar Width
                  </label>
                  <input
                    type="text"
                    value={sectionData.sidebar_width || '300px'}
                    onChange={(e) => updateCustomizations('layout', { 
                      ...sectionData, 
                      sidebar_width: e.target.value 
                    })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Spacing Scale</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(sectionData.spacing || {}).map(([size, value]) => (
                  <div key={size}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {size.toUpperCase()}
                    </label>
                    <input
                      type="text"
                      value={value as string}
                      onChange={(e) => updateCustomizations('layout', {
                        ...sectionData,
                        spacing: { ...sectionData.spacing, [size]: e.target.value }
                      })}
                      className="block w-full border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'header':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Logo & Branding</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={sectionData.logo_url || ''}
                    onChange={(e) => updateCustomizations('header', { 
                      ...sectionData, 
                      logo_url: e.target.value 
                    })}
                    placeholder="https://example.com/logo.png"
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo Width
                    </label>
                    <input
                      type="text"
                      value={sectionData.logo_width || '120px'}
                      onChange={(e) => updateCustomizations('header', { 
                        ...sectionData, 
                        logo_width: e.target.value 
                      })}
                      className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sectionData.show_tagline !== false}
                      onChange={(e) => updateCustomizations('header', { 
                        ...sectionData, 
                        show_tagline: e.target.checked 
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Show Tagline
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Header Appearance</h3>
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker
                  label="Background Color"
                  value={sectionData.background_color || '#FFFFFF'}
                  onChange={(value) => updateCustomizations('header', { 
                    ...sectionData, 
                    background_color: value 
                  })}
                />
                <ColorPicker
                  label="Text Color"
                  value={sectionData.text_color || '#1F2937'}
                  onChange={(value) => updateCustomizations('header', { 
                    ...sectionData, 
                    text_color: value 
                  })}
                />
              </div>
              <div className="mt-4 flex items-center space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sectionData.sticky_header === true}
                    onChange={(e) => updateCustomizations('header', { 
                      ...sectionData, 
                      sticky_header: e.target.checked 
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Sticky Header
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sectionData.border_bottom !== false}
                    onChange={(e) => updateCustomizations('header', { 
                      ...sectionData, 
                      border_bottom: e.target.checked 
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Border Bottom
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      case 'footer':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Footer Appearance</h3>
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker
                  label="Background Color"
                  value={sectionData.background_color || '#F8FAFC'}
                  onChange={(value) => updateCustomizations('footer', { 
                    ...sectionData, 
                    background_color: value 
                  })}
                />
                <ColorPicker
                  label="Text Color"
                  value={sectionData.text_color || '#6B7280'}
                  onChange={(value) => updateCustomizations('footer', { 
                    ...sectionData, 
                    text_color: value 
                  })}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Copyright Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sectionData.show_copyright !== false}
                    onChange={(e) => updateCustomizations('footer', { 
                      ...sectionData, 
                      show_copyright: e.target.checked 
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Show Copyright
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Copyright Text
                  </label>
                  <input
                    type="text"
                    value={sectionData.copyright_text || `© 2024 ${siteName}. All rights reserved.`}
                    onChange={(e) => updateCustomizations('footer', { 
                      ...sectionData, 
                      copyright_text: e.target.value 
                    })}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'custom_css':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Custom CSS</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={sectionData.enabled === true}
                  onChange={(e) => updateCustomizations('custom_css', { 
                    ...sectionData, 
                    enabled: e.target.checked 
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Enable Custom CSS
                </label>
              </div>
            </div>
            <div>
              <textarea
                value={sectionData.css || ''}
                onChange={(e) => updateCustomizations('custom_css', { 
                  ...sectionData, 
                  css: e.target.value 
                })}
                placeholder="/* Add your custom CSS here */
.custom-class {
  color: #333;
  font-size: 16px;
}"
                className="block w-full h-64 border border-gray-300 rounded-md shadow-sm font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={!sectionData.enabled}
              />
              <p className="mt-2 text-sm text-gray-500">
                Custom CSS will be applied to your site when enabled. Use with caution.
              </p>
            </div>
          </div>
        )

      default:
        return <div>Section content not found</div>
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="text-green-400">✓</div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button 
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header with Save Actions */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Site Customization
          </h2>
          <div className="flex items-center space-x-3">
            {hasUnsavedChanges.size > 0 && (
              <span className="text-sm text-yellow-600">
                {hasUnsavedChanges.size} unsaved change{hasUnsavedChanges.size > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={() => saveSection(activeTab)}
              disabled={!hasUnsavedChanges.has(activeTab) || saving === activeTab}
              className="px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving === activeTab ? 'Saving...' : 'Save Section'}
            </button>
            <button
              onClick={saveAll}
              disabled={hasUnsavedChanges.size === 0 || saving === 'all'}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving === 'all' ? 'Saving All...' : 'Save All'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="px-6 flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
              {hasUnsavedChanges.has(tab.id) && (
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Section Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {tabs.find(t => t.id === activeTab)?.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Customize the {activeTab} settings for your site
            </p>
          </div>
          <button
            onClick={() => resetSection(activeTab)}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Reset to Defaults
          </button>
        </div>

        {renderSectionContent()}
      </div>
    </div>
  )
}

// Helper function to get default settings (client-side)
function getDefaultSettings(section: string) {
  const defaults: Record<string, any> = {
    colors: {
      primary: '#3B82F6',
      secondary: '#64748B', 
      accent: '#10B981',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text_primary: '#1F2937',
      text_secondary: '#6B7280',
      border: '#E5E7EB'
    },
    typography: {
      heading_font: 'Inter',
      body_font: 'Inter',
      font_sizes: {
        xs: '0.75rem',
        sm: '0.875rem', 
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      line_heights: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75'
      }
    },
    layout: {
      container_width: '1200px',
      sidebar_width: '300px',
      header_height: '80px',
      footer_height: 'auto',
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem', 
        lg: '1.5rem',
        xl: '3rem'
      },
      border_radius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem'
      }
    },
    header: {
      logo_url: '',
      logo_width: '120px',
      show_tagline: true,
      sticky_header: false,
      background_color: '#FFFFFF',
      text_color: '#1F2937',
      border_bottom: true,
      padding: {
        top: '1rem',
        bottom: '1rem'
      }
    },
    footer: {
      background_color: '#F8FAFC',
      text_color: '#6B7280',
      show_copyright: true,
      copyright_text: '© 2024 Site. All rights reserved.',
      show_social_links: true,
      social_links: [],
      columns: 3,
      padding: {
        top: '3rem',
        bottom: '2rem'
      }
    },
    custom_css: {
      css: '',
      enabled: false
    }
  }

  return defaults[section] || {}
}