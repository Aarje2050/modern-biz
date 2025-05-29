// src/components/cms/MenuBuilder.tsx - ENTERPRISE MENU BUILDER
'use client'
import { useState, useEffect } from 'react'

interface MenuItem {
  id: string
  title: string
  url: string
  parent_id?: string
  display_order: number
  link_type: 'custom' | 'page' | 'post' | 'category' | 'external'
  target_id?: string
  css_classes?: string
  settings: any
}

interface Menu {
  id: string
  name: string
  label: string
  locations: string[]
  settings: any
  items: MenuItem[]
}

interface AvailableContent {
  pages: any[]
  posts: any[]
  categories: any[]
}

interface MenuBuilderProps {
  siteId: string
  initialMenus: Menu[]
  availableContent: AvailableContent
  siteType: string
}

export default function MenuBuilder({ siteId, initialMenus, availableContent, siteType }: MenuBuilderProps) {
  const [menus, setMenus] = useState<Menu[]>(initialMenus)
  const [activeMenu, setActiveMenu] = useState<Menu | null>(initialMenus[0] || null)
  const [showNewMenuForm, setShowNewMenuForm] = useState(false)
  const [showAddItemPanel, setShowAddItemPanel] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [newMenuData, setNewMenuData] = useState({
    name: '',
    label: '',
    locations: [] as string[]
  })

  const [newItemData, setNewItemData] = useState<{
    title: string
    url: string
    link_type: 'custom' | 'page' | 'post' | 'category' | 'external'
    target_id: string
    css_classes: string
  }>({
    title: '',
    url: '',
    link_type: 'custom',  // Remove 'as const'
    target_id: '',
    css_classes: ''
  })

  // Available menu locations based on site type
  const getAvailableLocations = () => {
    const baseLocations = [
      { value: 'header', label: 'Primary Navigation (Header)' },
      { value: 'footer', label: 'Footer Menu' },
      { value: 'mobile', label: 'Mobile Menu' }
    ]
    
    if (siteType === 'directory') {
      baseLocations.push({ value: 'sidebar', label: 'Directory Sidebar' })
    }
    
    return baseLocations
  }

  const createMenu = async () => {
    if (!newMenuData.name.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/cms/sites/${siteId}/menus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMenuData.name,
          label: newMenuData.label || newMenuData.name,
          locations: newMenuData.locations,
          settings: {}
        })
      })

      if (response.ok) {
        const newMenu = await response.json()
        setMenus(prev => [...prev, { ...newMenu, items: [] }])
        setActiveMenu({ ...newMenu, items: [] })
        setNewMenuData({ name: '', label: '', locations: [] })
        setShowNewMenuForm(false)
        alert('Menu created successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to create menu'}`)
      }
    } catch (error) {
      alert('Failed to create menu')
      console.error('Create menu error:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteMenu = async (menuId: string) => {
    if (!confirm('Are you sure you want to delete this menu? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/cms/sites/${siteId}/menus/${menuId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMenus(prev => prev.filter(menu => menu.id !== menuId))
        if (activeMenu?.id === menuId) {
          setActiveMenu(menus.find(m => m.id !== menuId) || null)
        }
        alert('Menu deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to delete menu'}`)
      }
    } catch (error) {
      alert('Failed to delete menu')
      console.error('Delete menu error:', error)
    }
  }

  const addMenuItem = async () => {
    if (!activeMenu || !newItemData.title.trim()) return

    setLoading(true)
    try {
      let finalUrl = newItemData.url
      let targetId = null

      // Generate URL based on link type
      switch (newItemData.link_type) {
        case 'page':
          const page = availableContent.pages.find(p => p.id === newItemData.target_id)
          finalUrl = page ? `/${page.slug}` : '/'
          targetId = newItemData.target_id
          break
        case 'post':
          const post = availableContent.posts.find(p => p.id === newItemData.target_id)
          finalUrl = post ? `/blog/${post.slug}` : '/blog'
          targetId = newItemData.target_id
          break
        case 'category':
          const category = availableContent.categories.find(c => c.id === newItemData.target_id)
          finalUrl = category ? `/blog/category/${category.slug}` : '/blog'
          targetId = newItemData.target_id
          break
        default:
          finalUrl = newItemData.url || '#'
      }

      const response = await fetch(`/api/cms/sites/${siteId}/menus/${activeMenu.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItemData.title,
          url: finalUrl,
          link_type: newItemData.link_type,
          target_id: targetId,
          css_classes: newItemData.css_classes,
          display_order: activeMenu.items.length,
          settings: {}
        })
      })

      if (response.ok) {
        const newItem = await response.json()
        setMenus(prev => prev.map(menu => 
          menu.id === activeMenu.id 
            ? { ...menu, items: [...menu.items, newItem] }
            : menu
        ))
        setActiveMenu(prev => prev ? { ...prev, items: [...prev.items, newItem] } : null)
        setNewItemData({ title: '', url: '', link_type: 'custom', target_id: '', css_classes: '' })
        setShowAddItemPanel(false)
        alert('Menu item added successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to add menu item'}`)
      }
    } catch (error) {
      alert('Failed to add menu item')
      console.error('Add menu item error:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteMenuItem = async (itemId: string) => {
    if (!activeMenu || !confirm('Remove this menu item?')) return

    try {
      const response = await fetch(`/api/cms/sites/${siteId}/menus/${activeMenu.id}/items/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMenus(prev => prev.map(menu => 
          menu.id === activeMenu.id 
            ? { ...menu, items: menu.items.filter(item => item.id !== itemId) }
            : menu
        ))
        setActiveMenu(prev => prev ? { ...prev, items: prev.items.filter(item => item.id !== itemId) } : null)
        alert('Menu item removed successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to remove menu item'}`)
      }
    } catch (error) {
      alert('Failed to remove menu item')
      console.error('Delete menu item error:', error)
    }
  }

  const updateMenuLocations = async (menuId: string, locations: string[]) => {
    try {
      const response = await fetch(`/api/cms/sites/${siteId}/menus/${menuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations })
      })

      if (response.ok) {
        setMenus(prev => prev.map(menu => 
          menu.id === menuId ? { ...menu, locations } : menu
        ))
        if (activeMenu?.id === menuId) {
          setActiveMenu(prev => prev ? { ...prev, locations } : null)
        }
      }
    } catch (error) {
      console.error('Update menu locations error:', error)
    }
  }

  const availableLocations = getAvailableLocations()

  return (
    <div className="space-y-6">
      {/* Menu Selection & Creation */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Menus</h2>
            <button
              onClick={() => setShowNewMenuForm(!showNewMenuForm)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {showNewMenuForm ? 'Cancel' : '➕ Create Menu'}
            </button>
          </div>
        </div>

        {/* New Menu Form */}
        {showNewMenuForm && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Menu Name *
                  </label>
                  <input
                    type="text"
                    value={newMenuData.name}
                    onChange={(e) => setNewMenuData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Main Navigation"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Label
                  </label>
                  <input
                    type="text"
                    value={newMenuData.label}
                    onChange={(e) => setNewMenuData(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="Main Navigation"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menu Locations
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableLocations.map(location => (
                    <label key={location.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newMenuData.locations.includes(location.value)}
                        onChange={(e) => {
                          const locations = e.target.checked
                            ? [...newMenuData.locations, location.value]
                            : newMenuData.locations.filter(l => l !== location.value)
                          setNewMenuData(prev => ({ ...prev, locations }))
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{location.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={createMenu}
                  disabled={loading || !newMenuData.name.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Menu'}
                </button>
                <button
                  onClick={() => setShowNewMenuForm(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menu Tabs */}
        {menus.length > 0 && (
          <div className="px-6 py-4">
            <div className="flex items-center space-x-1 border-b border-gray-200 -mb-4">
              {menus.map(menu => (
                <button
                  key={menu.id}
                  onClick={() => setActiveMenu(menu)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeMenu?.id === menu.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {menu.label}
                  {menu.items.length > 0 && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {menu.items.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Menu Builder */}
      {activeMenu && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Structure */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Menu Structure: {activeMenu.label}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowAddItemPanel(!showAddItemPanel)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      ➕ Add Item
                    </button>
                    <button
                      onClick={() => deleteMenu(activeMenu.id)}
                      className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                    >
                      🗑️ Delete Menu
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {activeMenu.items.length > 0 ? (
                  <div className="space-y-2">
                    {activeMenu.items
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-sm font-medium text-blue-600">
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{item.title}</h4>
                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                  {item.link_type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">{item.url}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => deleteMenuItem(item.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">🧭</div>
                    <h3 className="text-lg font-medium mb-2">No menu items yet</h3>
                    <p className="text-sm mb-4">Add your first menu item to get started.</p>
                    <button
                      onClick={() => setShowAddItemPanel(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Add First Item
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Settings Sidebar */}
          <div className="space-y-6">
            {/* Add Item Panel */}
            {showAddItemPanel && (
              <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Menu Item</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link Type
                    </label>
                    <select
                      value={newItemData.link_type}
                      onChange={(e) => setNewItemData(prev => ({ 
                        ...prev, 
                        link_type: e.target.value as any,
                        target_id: '',
                        url: ''
                      }))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="custom">Custom URL</option>
                      <option value="page">Page</option>
                      <option value="post">Blog Post</option>
                      <option value="category">Category</option>
                      <option value="external">External Link</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Menu Text *
                    </label>
                    <input
                      type="text"
                      value={newItemData.title}
                      onChange={(e) => setNewItemData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Home, About, Services..."
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* Dynamic content selector */}
                  {newItemData.link_type === 'page' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Page
                      </label>
                      <select
                        value={newItemData.target_id}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, target_id: e.target.value }))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Choose a page...</option>
                        {availableContent.pages.map(page => (
                          <option key={page.id} value={page.id}>
                            {page.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newItemData.link_type === 'post' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Post
                      </label>
                      <select
                        value={newItemData.target_id}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, target_id: e.target.value }))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Choose a post...</option>
                        {availableContent.posts.map(post => (
                          <option key={post.id} value={post.id}>
                            {post.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newItemData.link_type === 'category' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Category
                      </label>
                      <select
                        value={newItemData.target_id}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, target_id: e.target.value }))}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Choose a category...</option>
                        {availableContent.categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(newItemData.link_type === 'custom' || newItemData.link_type === 'external') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL
                      </label>
                      <input
                        type="url"
                        value={newItemData.url}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://example.com or /custom-page"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CSS Classes (Optional)
                    </label>
                    <input
                      type="text"
                      value={newItemData.css_classes}
                      onChange={(e) => setNewItemData(prev => ({ ...prev, css_classes: e.target.value }))}
                      placeholder="highlight special-link"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-4">
                    <button
                      onClick={addMenuItem}
                      disabled={loading || !newItemData.title.trim()}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Item'}
                    </button>
                    <button
                      onClick={() => setShowAddItemPanel(false)}
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Locations */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Menu Locations</h3>
              <div className="space-y-3">
                {availableLocations.map(location => (
                  <label key={location.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={activeMenu.locations.includes(location.value)}
                      onChange={(e) => {
                        const locations = e.target.checked
                          ? [...activeMenu.locations, location.value]
                          : activeMenu.locations.filter(l => l !== location.value)
                        updateMenuLocations(activeMenu.id, locations)
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{location.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Select where this menu should appear on your site.
              </p>
            </div>

            {/* Menu Statistics */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Menu Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Items:</span>
                  <span className="text-sm font-medium">{activeMenu.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Locations:</span>
                  <span className="text-sm font-medium">{activeMenu.locations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium">Recently</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {menus.length === 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="text-center py-16">
            <div className="text-gray-500">
              <div className="text-6xl mb-4">🧭</div>
              <h3 className="text-xl font-medium mb-2">No menus created yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first navigation menu to help visitors navigate your site.
              </p>
              <button
                onClick={() => setShowNewMenuForm(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create First Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}