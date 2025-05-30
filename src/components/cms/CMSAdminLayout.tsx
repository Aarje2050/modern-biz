'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSiteContext } from '@/hooks/useSiteContext'

interface CMSAdminLayoutProps {
  children: React.ReactNode
  siteId: string
}

export default function CMSAdminLayout({ children, siteId }: CMSAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const { siteConfig } = useSiteContext()

  const navigation = [
    {
      name: 'Dashboard',
      href: `/admin/sites/${siteId}`,
      icon: '📊',
      current: pathname === `/admin/sites/${siteId}`
    },
    {
      name: 'Pages',
      href: `/admin/sites/${siteId}/pages`,
      icon: '📄',
      current: pathname.includes('/pages'),
      submenu: [
        { name: 'All Pages', href: `/admin/sites/${siteId}/pages` },
        { name: 'Add New', href: `/admin/sites/${siteId}/pages/new` }
      ]
    },
    {
      name: 'Posts',
      href: `/admin/sites/${siteId}/posts`,
      icon: '📝',
      current: pathname.includes('/posts'),
      submenu: [
        { name: 'All Posts', href: `/admin/sites/${siteId}/posts` },
        { name: 'Add New', href: `/admin/sites/${siteId}/posts/new` },
        { name: 'Categories', href: `/admin/sites/${siteId}/categories` }
      ]
    },
    {
      name: 'Media',
      href: `/admin/sites/${siteId}/media`,
      icon: '🖼️',
      current: pathname.includes('/media')
    },
    {
      name: 'Templates',
      href: `/admin/sites/${siteId}/templates`,
      icon: '🖼️',
      current: pathname.includes('/templates')
    },
    {
      name: 'Appearance',
      href: `/admin/sites/${siteId}/appearance`,
      icon: '🎨',
      current: pathname.includes('/appearance'),
      submenu: [
        { name: 'Themes', href: `/admin/sites/${siteId}/appearance/themes` },
        { name: 'Customize', href: `/admin/sites/${siteId}/appearance/customize` },
        { name: 'Menus', href: `/admin/sites/${siteId}/appearance/menus` }
      ]
    },
    {
      name: 'Settings',
      href: `/admin/sites/${siteId}/settings`,
      icon: '⚙️',
      current: pathname.includes('/settings'),
      submenu: [
        { name: 'General', href: `/admin/sites/${siteId}/settings/general` },
        { name: 'SEO', href: `/admin/sites/${siteId}/settings/seo` },
        { name: 'Advanced', href: `/admin/sites/${siteId}/settings/advanced` }
      ]
    }
  ]

  // Add directory-specific navigation
  if (siteConfig?.site_type === 'directory') {
    navigation.splice(3, 0, {
      name: 'Directory',
      href: `/admin/sites/${siteId}/directory`,
      icon: '🏢',
      current: pathname.includes('/directory'),
      submenu: [
        { name: 'Businesses', href: `/admin/sites/${siteId}/directory/businesses` },
        { name: 'Categories', href: `/admin/sites/${siteId}/directory/categories` },
        { name: 'Reviews', href: `/admin/sites/${siteId}/directory/reviews` }
      ]
    })
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {siteConfig?.name || 'Site CMS'}
              </h1>
              <p className="text-sm text-gray-500 truncate">
                {siteConfig?.domain}
              </p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {sidebarOpen && (
                    <>
                      {item.name}
                      {item.submenu && (
                        <span className="ml-auto text-xs">▼</span>
                      )}
                    </>
                  )}
                </Link>
                
                {/* Submenu */}
                {item.submenu && item.current && sidebarOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.name}
                        href={subitem.href}
                        className="group flex items-center px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        {subitem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Admin
                </p>
                <Link 
                  href="/admin"
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  ← Back to Admin
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Site Management
              </h2>
              <span className="text-sm text-gray-500">
                {siteConfig?.site_type === 'directory' ? 'Business Directory' : 
                 siteConfig?.site_type === 'landing' ? 'Landing Page' :
                 siteConfig?.site_type === 'service' ? 'Service Website' : 'Website'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <a 
                href={`http://${siteConfig?.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                👁️ View Site
              </a>
              <Link
                href="/admin/sites"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                All Sites
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}