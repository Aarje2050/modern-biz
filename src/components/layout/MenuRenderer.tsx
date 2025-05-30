// src/components/layout/MenuRenderer.tsx - FRONTEND MENU RENDERER
import Link from 'next/link'
import { getCurrentSite, getCurrentSiteId } from '@/lib/site-context'
import { createClient } from '@/lib/supabase/server'

interface MenuItem {
  id: string
  title: string
  url: string
  parent_id?: string
  display_order: number
  link_type: string
  css_classes?: string
  settings: any
  children?: MenuItem[]
}

interface Menu {
  id: string
  name: string
  label: string
  locations: string[]
  items: MenuItem[]
}

interface MenuRendererProps {
  location: 'header' | 'footer' | 'mobile' | 'sidebar'
  className?: string
  style?: 'horizontal' | 'vertical' | 'dropdown'
  showIcons?: boolean
}

export default async function MenuRenderer({ 
  location, 
  className = '', 
  style = 'horizontal',
  showIcons = false 
}: MenuRendererProps) {
  const siteConfig =  getCurrentSite()
  
  if (!siteConfig) {
    return null
  }

  const supabase = createClient()

  // Get menus for this location
  const { data: menusData } = await supabase
    .rpc('get_site_menus_with_items', {
      p_site_id: siteConfig.id
    })

  if (!menusData || menusData.length === 0) {
    return null
  }

  // Transform and filter menu data
  const menus = transformMenuData(menusData)
  const locationMenus = menus.filter(menu => menu.locations.includes(location))

  if (locationMenus.length === 0) {
    return null
  }

  // Render the first menu found for this location
  const menu = locationMenus[0]
  const menuItems = buildMenuHierarchy(menu.items)

  if (menuItems.length === 0) {
    return null
  }

  return (
    <nav className={`menu-${location} ${className}`} aria-label={menu.label}>
      {style === 'horizontal' && (
        <HorizontalMenu items={menuItems} showIcons={showIcons} />
      )}
      {style === 'vertical' && (
        <VerticalMenu items={menuItems} showIcons={showIcons} />
      )}
      {style === 'dropdown' && (
        <DropdownMenu items={menuItems} showIcons={showIcons} />
      )}
    </nav>
  )
}

// Horizontal menu layout (for headers)
function HorizontalMenu({ items, showIcons }: { items: MenuItem[], showIcons: boolean }) {
  return (
    <ul className="flex items-center space-x-6">
      {items.map((item) => (
        <li key={item.id} className="relative group">
          <MenuItemLink item={item} showIcons={showIcons} />
          
          {/* Dropdown for child items */}
          {item.children && item.children.length > 0 && (
            <ul className="absolute left-0 top-full mt-2 w-48 bg-white shadow-lg border rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              {item.children.map((child) => (
                <li key={child.id}>
                  <MenuItemLink 
                    item={child} 
                    showIcons={showIcons}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

// Vertical menu layout (for sidebars)
function VerticalMenu({ items, showIcons }: { items: MenuItem[], showIcons: boolean }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id}>
          <MenuItemLink 
            item={item} 
            showIcons={showIcons}
            className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
          />
          
          {/* Child items */}
          {item.children && item.children.length > 0 && (
            <ul className="ml-4 mt-1 space-y-1">
              {item.children.map((child) => (
                <li key={child.id}>
                  <MenuItemLink 
                    item={child} 
                    showIcons={showIcons}
                    className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                  />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

// Dropdown menu layout (for mobile)
function DropdownMenu({ items, showIcons }: { items: MenuItem[], showIcons: boolean }) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.id}>
          <MenuItemLink 
            item={item} 
            showIcons={showIcons}
            className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-b border-gray-100"
          />
          
          {/* Child items */}
          {item.children && item.children.length > 0 && (
            <div className="pl-4 bg-gray-50">
              {item.children.map((child) => (
                <MenuItemLink 
                  key={child.id}
                  item={child} 
                  showIcons={showIcons}
                  className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Individual menu item link component
function MenuItemLink({ 
  item, 
  showIcons, 
  className = "text-gray-700 hover:text-gray-900 font-medium"
}: { 
  item: MenuItem
  showIcons: boolean
  className?: string 
}) {
  const isExternal = item.link_type === 'external' || item.url.startsWith('http')
  const combinedClassName = `${className} ${item.css_classes || ''}`.trim()

  // Icon mapping for different link types
  const getIcon = (linkType: string) => {
    if (!showIcons) return null
    
    const icons: Record<string, string> = {
      page: '📄',
      post: '📝',
      category: '📂',
      external: '🔗',
      custom: '🔗'
    }
    
    return icons[linkType] || icons.custom
  }

  const icon = getIcon(item.link_type)

  if (isExternal) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={combinedClassName}
        title={item.title}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {item.title}
      </a>
    )
  }

  return (
    <Link
      href={item.url}
      className={combinedClassName}
      title={item.title}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {item.title}
    </Link>
  )
}

// Helper function to transform menu data
function transformMenuData(menusData: any[]): Menu[] {
  const menusMap = new Map()
  
  menusData.forEach(row => {
    if (!menusMap.has(row.menu_id)) {
      menusMap.set(row.menu_id, {
        id: row.menu_id,
        name: row.menu_name,
        label: row.menu_label,
        locations: row.menu_locations || [],
        items: []
      })
    }
    
    if (row.item_id) {
      menusMap.get(row.menu_id).items.push({
        id: row.item_id,
        title: row.item_title,
        url: row.item_url,
        parent_id: row.item_parent_id,
        display_order: row.item_display_order,
        link_type: row.item_link_type,
        css_classes: row.item_css_classes,
        settings: row.item_settings || {}
      })
    }
  })
  
  return Array.from(menusMap.values())
}

// Helper function to build menu hierarchy
function buildMenuHierarchy(items: MenuItem[]): MenuItem[] {
  const itemsMap = new Map<string, MenuItem>()
  const rootItems: MenuItem[] = []

  // First pass: create map of all items
  items.forEach(item => {
    itemsMap.set(item.id, { ...item, children: [] })
  })

  // Second pass: build hierarchy
  items
    .sort((a, b) => a.display_order - b.display_order)
    .forEach(item => {
      const menuItem = itemsMap.get(item.id)!
      
      if (item.parent_id && itemsMap.has(item.parent_id)) {
        const parent = itemsMap.get(item.parent_id)!
        if (!parent.children) parent.children = []
        parent.children.push(menuItem)
      } else {
        rootItems.push(menuItem)
      }
    })

  return rootItems
}

// Server-side menu data fetcher for use in other components
export async function getMenuForLocation(location: string) {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    return null
  }

  const supabase = createClient()

  const { data: menusData } = await supabase
    .rpc('get_site_menus_with_items', {
      p_site_id: siteConfig.id
    })

  if (!menusData || menusData.length === 0) {
    return null
  }

  const menus = transformMenuData(menusData)
  const locationMenu = menus.find(menu => menu.locations.includes(location))

  if (!locationMenu || locationMenu.items.length === 0) {
    return null
  }

  return {
    ...locationMenu,
    items: buildMenuHierarchy(locationMenu.items)
  }
}