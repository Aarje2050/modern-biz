// Enhanced MenuEditor with better error handling and UX
'use client'
import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface MenuItem {
  id: string
  label: string
  url: string
  type: 'page' | 'category' | 'custom' | 'business'
  target?: '_blank' | '_self'
  children?: MenuItem[]
}

interface Menu {
  id: string
  name: string
  label: string
  items: MenuItem[]
  locations: string[]
  is_active: boolean
}

interface MenuEditorProps {
  siteId: string
  menus: Menu[]
  pages: Array<{ id: string; title: string; slug: string }>
  categories: Array<{ id: string; name: string; slug: string }>
  activeMenu: string
  siteType: string
}

export default function MenuEditor({ 
  siteId, 
  menus, 
  pages, 
  categories, 
  activeMenu, 
  siteType 
}: MenuEditorProps) {
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Find and set the active menu
  useEffect(() => {
    const menu = menus.find(m => m.name === activeMenu) || menus[0]
    if (menu) {
      setSelectedMenu(menu)
      setMenuItems(menu.items || [])
      setHasUnsavedChanges(false)
    }
  }, [activeMenu, menus])

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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(menuItems)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setMenuItems(items)
    setHasUnsavedChanges(true)
    setError(null)
  }

  const addMenuItem = (type: 'page' | 'category' | 'custom', data: any) => {
    try {
      // Check if item already exists
      const exists = menuItems.some(item => 
        item.type === type && 
        (type === 'page' ? item.id === `page-${data.id}` : 
         type === 'category' ? item.id === `category-${data.id}` : false)
      )

      if (exists) {
        setError(`This ${type} is already in the menu`)
        return
      }

      let newItem: MenuItem

      switch (type) {
        case 'page':
          newItem = {
            id: `page-${data.id}`,
            label: data.title,
            url: `/${data.slug}`,
            type: 'page'
          }
          break
        case 'category':
          newItem = {
            id: `category-${data.id}`,
            label: data.name,
            url: `/categories/${data.slug}`,
            type: 'category'
          }
          break
        case 'custom':
          if (!data.label?.trim() || !data.url?.trim()) {
            setError('Label and URL are required for custom links')
            return
          }
          newItem = {
            id: `custom-${Date.now()}`,
            label: data.label.trim(),
            url: data.url.trim(),
            type: 'custom',
            target: data.target || '_self'
          }
          break
        default:
          return
      }

      setMenuItems([...menuItems, newItem])
      setHasUnsavedChanges(true)
      setError(null)
      setSuccess(`Added "${newItem.label}" to menu`)
    } catch (err) {
      setError('Failed to add menu item')
    }
  }

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    if (!updates.label?.trim()) {
      setError('Menu item label cannot be empty')
      return
    }

    setMenuItems(items => 
      items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    )
    setHasUnsavedChanges(true)
    setError(null)
  }

  const removeMenuItem = (id: string) => {
    const item = menuItems.find(item => item.id === id)
    setMenuItems(items => items.filter(item => item.id !== id))
    setHasUnsavedChanges(true)
    setError(null)
    setSuccess(item ? `Removed "${item.label}" from menu` : 'Menu item removed')
  }

  const saveMenu = async () => {
    if (!selectedMenu) return

    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/cms/sites/${siteId}/menus/${selectedMenu.name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: menuItems,
          locations: selectedMenu.locations
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save menu')
      }

      setHasUnsavedChanges(false)
      setSuccess('Menu saved successfully!')
    } catch (error: any) {
      setError(error.message || 'Failed to save menu')
    } finally {
      setSaving(false)
    }
  }

  const menuTabs = [
    { name: 'header', label: 'Header Menu' },
    { name: 'footer', label: 'Footer Menu' }
  ]

  if (siteType === 'directory') {
    menuTabs.push({ name: 'sidebar', label: 'Sidebar Menu' })
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
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

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="text-yellow-400">⚠️</div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have unsaved changes. Don't forget to save your menu.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Menu Selection */}
        <div className="col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Menu</h3>
            
            <div className="space-y-2">
              {menuTabs.map((tab) => (
                <a
                  key={tab.name}
                  href={`?menu=${tab.name}`}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeMenu === tab.name
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </a>
              ))}
            </div>

            {selectedMenu && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Menu Locations</h4>
                <div className="space-y-2">
                  {selectedMenu.locations.map((location) => (
                    <div key={location} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700 capitalize">
                        {location}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add Menu Items */}
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Menu Items</h3>
            
            <div className="space-y-4">
              {/* Pages */}
              {pages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Pages</h4>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
                    {pages.map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50"
                      >
                        <span className="text-sm text-gray-700 truncate">{page.title}</span>
                        <button
                          onClick={() => addMenuItem('page', page)}
                          className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap ml-2"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories (for directory sites) */}
              {siteType === 'directory' && categories.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Categories</h4>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50"
                      >
                        <span className="text-sm text-gray-700 truncate">{category.name}</span>
                        <button
                          onClick={() => addMenuItem('category', category)}
                          className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap ml-2"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Links */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Custom Links</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Link text"
                    className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                    id="custom-label"
                  />
                  <input
                    type="url"
                    placeholder="https://example.com"
                    className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                    id="custom-url"
                  />
                  <button
                    onClick={() => {
                      const labelEl = document.getElementById('custom-label') as HTMLInputElement
                      const urlEl = document.getElementById('custom-url') as HTMLInputElement
                      const label = labelEl?.value
                      const url = urlEl?.value
                      if (label && url) {
                        addMenuItem('custom', { label, url })
                        labelEl.value = ''
                        urlEl.value = ''
                      }
                    }}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Add Custom Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Structure */}
        <div className="col-span-9">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Menu Structure: {selectedMenu?.label}
                </h3>
                <button
                  onClick={saveMenu}
                  disabled={saving || !hasUnsavedChanges}
                  className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white transition-colors ${
                    saving || !hasUnsavedChanges
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {saving ? 'Saving...' : 'Save Menu'}
                </button>
              </div>
            </div>

            <div className="p-6">
              {menuItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500">
                    <div className="text-4xl mb-4">🧭</div>
                    <h3 className="text-lg font-medium mb-2">No menu items</h3>
                    <p className="text-sm">
                      Add pages, categories, or custom links from the sidebar to build your menu.
                    </p>
                  </div>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="menu-items">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {menuItems.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`border rounded-lg p-4 bg-white transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-move text-gray-400 hover:text-gray-600"
                                    >
                                      ⋮⋮
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {item.label}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {item.url} • {item.type}
                                        {item.target === '_blank' && ' • opens in new window'}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => setEditingItem(item)}
                                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => removeMenuItem(item.id)}
                                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>

                                {editingItem?.id === item.id && (
                                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Navigation Label
                                        </label>
                                        <input
                                          type="text"
                                          value={editingItem.label}
                                          onChange={(e) => setEditingItem({
                                            ...editingItem,
                                            label: e.target.value
                                          })}
                                          className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          URL
                                        </label>
                                        <input
                                          type="text"
                                          value={editingItem.url}
                                          onChange={(e) => setEditingItem({
                                            ...editingItem,
                                            url: e.target.value
                                          })}
                                          className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                      </div>
                                    </div>
                                    
                                    {editingItem.type === 'custom' && (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Open in
                                        </label>
                                        <select
                                          value={editingItem.target || '_self'}
                                          onChange={(e) => setEditingItem({
                                            ...editingItem,
                                            target: e.target.value as '_blank' | '_self'
                                          })}
                                          className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                          <option value="_self">Same window</option>
                                          <option value="_blank">New window</option>
                                        </select>
                                      </div>
                                    )}
                                    
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => {
                                          updateMenuItem(editingItem.id, editingItem)
                                          setEditingItem(null)
                                        }}
                                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingItem(null)}
                                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}