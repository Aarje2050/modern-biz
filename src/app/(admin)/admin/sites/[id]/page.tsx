// CMS Site Dashboard - WordPress-style overview
import { createClient } from '@/lib/supabase/server'
import CMSAdminLayout from '@/components/cms/CMSAdminLayout'
import Link from 'next/link'
import { verifyAdminAccess } from '@/lib/middleware/admin-access'

interface SiteDashboardProps {
  params: { id: string }
}

export default async function SiteDashboard({ params }: SiteDashboardProps) {
  const { success, response } = await verifyAdminAccess()
  if (!success) return response

  const siteId = params.id
  const supabase = createClient()
  
  // Get site info
  const { data: site } = await supabase
    .from('sites')
    .select('name, domain, site_type, template, config, status, created_at')
    .eq('id', siteId)
    .single()

  // Get content stats
  const [
    { count: totalPages },
    { count: publishedPages },
    { count: draftPages },
    { count: totalPosts },
    { count: publishedPosts }
  ] = await Promise.all([
    supabase.from('site_posts').select('*', { count: 'exact', head: true }).eq('site_id', siteId).eq('post_type', 'page'),
    supabase.from('site_posts').select('*', { count: 'exact', head: true }).eq('site_id', siteId).eq('post_type', 'page').eq('post_status', 'published'),
    supabase.from('site_posts').select('*', { count: 'exact', head: true }).eq('site_id', siteId).eq('post_type', 'page').eq('post_status', 'draft'),
    supabase.from('site_posts').select('*', { count: 'exact', head: true }).eq('site_id', siteId).eq('post_type', 'post'),
    supabase.from('site_posts').select('*', { count: 'exact', head: true }).eq('site_id', siteId).eq('post_type', 'post').eq('post_status', 'published')
  ])

  // Get recent pages
  const { data: recentPages } = await supabase
    .from('site_posts')
    .select('id, title, slug, post_status, updated_at')
    .eq('site_id', siteId)
    .eq('post_type', 'page')
    .order('updated_at', { ascending: false })
    .limit(5)

  // Get directory-specific stats if applicable
  let directoryStats = null
  if (site?.site_type === 'directory') {
    const [
      { count: totalBusinesses },
      { count: activeBusinesses },
      { count: totalCategories }
    ] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('site_id', siteId),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('site_id', siteId).eq('status', 'active'),
      supabase.from('categories').select('*', { count: 'exact', head: true }).eq('site_id', siteId)
    ])

    directoryStats = {
      totalBusinesses: totalBusinesses || 0,
      activeBusinesses: activeBusinesses || 0,
      totalCategories: totalCategories || 0
    }
  }

  const quickActions = [
    {
      title: 'Add New Page',
      description: 'Create a new page for your site',
      href: `/admin/sites/${siteId}/pages/new`,
      icon: '📄',
      color: 'bg-blue-500'
    },
    {
      title: 'Manage Menus',
      description: 'Edit your site navigation',
      href: `/admin/sites/${siteId}/appearance/menus`,
      icon: '🧭',
      color: 'bg-green-500'
    },
    {
      title: 'Customize Appearance',
      description: 'Change colors, fonts, and layout',
      href: `/admin/sites/${siteId}/appearance/customize`,
      icon: '🎨',
      color: 'bg-purple-500'
    },
    {
      title: 'SEO Settings',
      description: 'Optimize your site for search engines',
      href: `/admin/sites/${siteId}/settings/seo`,
      icon: '🔍',
      color: 'bg-orange-500'
    }
  ]

  if (site?.site_type === 'directory') {
    quickActions.splice(1, 0, {
      title: 'Manage Businesses',
      description: 'Add and edit business listings',
      href: `/admin/sites/${siteId}/directory/businesses`,
      icon: '🏢',
      color: 'bg-indigo-500'
    })
  }

  return (
    <CMSAdminLayout siteId={siteId}>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome to {site?.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {site?.site_type === 'directory' ? 'Business Directory' : 
                 site?.site_type === 'landing' ? 'Landing Page' :
                 site?.site_type === 'service' ? 'Service Website' : 'Website'} • {site?.domain}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                site?.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {site?.status === 'active' ? 'Live' : 'Inactive'}
              </span>
              <a 
                href={`http://${site?.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                👁️ View Site
              </a>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Pages</p>
                <p className="text-2xl font-semibold text-gray-900">{totalPages || 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <span className="text-green-600 font-medium">{publishedPages || 0}</span>
                <span className="mx-1">published,</span>
                <span className="text-yellow-600 font-medium">{draftPages || 0}</span>
                <span className="ml-1">drafts</span>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Blog Posts</p>
                <p className="text-2xl font-semibold text-gray-900">{totalPosts || 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <span className="text-green-600 font-medium">{publishedPosts || 0}</span>
                <span className="ml-1">published</span>
              </div>
            </div>
          </div>

          {directoryStats && (
            <>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Businesses</p>
                    <p className="text-2xl font-semibold text-gray-900">{directoryStats.totalBusinesses}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="text-green-600 font-medium">{directoryStats.activeBusinesses}</span>
                    <span className="ml-1">active</span>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📂</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Categories</p>
                    <p className="text-2xl font-semibold text-gray-900">{directoryStats.totalCategories}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                    <span className="text-xl">{action.icon}</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Pages */}
        {recentPages && recentPages.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Pages</h2>
              <Link
                href={`/admin/sites/${siteId}/pages`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all pages →
              </Link>
            </div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {recentPages.map((page: any) => (
                  <li key={page.id}>
                    <Link
                      href={`/admin/sites/${siteId}/pages/${page.id}/edit`}
                      className="block hover:bg-gray-50 px-6 py-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{page.title}</p>
                          <p className="text-sm text-gray-500">/{page.slug}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            page.post_status === 'published' 
                              ? 'bg-green-100 text-green-800'
                              : page.post_status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {page.post_status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(page.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Site Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Site Information</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Domain</dt>
              <dd className="text-sm text-gray-900">{site?.domain}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="text-sm text-gray-900 capitalize">{site?.site_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Template</dt>
              <dd className="text-sm text-gray-900">{site?.template}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="text-sm text-gray-900">
                {site?.created_at ? new Date(site.created_at).toLocaleDateString() : 'Unknown'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </CMSAdminLayout>
  )
}