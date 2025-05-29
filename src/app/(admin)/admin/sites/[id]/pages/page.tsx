// WordPress-style Pages Management
import { createClient } from '@/lib/supabase/server'
import CMSAdminLayout from '@/components/cms/CMSAdminLayout'
import Link from 'next/link'
import { verifyAdminAccess } from '@/lib/middleware/admin-access'

interface Page {
  id: string
  title: string
  slug: string
  post_status: string
  created_at: string
  updated_at: string
  author_id: string
  menu_order: number
}

interface PageListProps {
  params: { id: string }
  searchParams: { status?: string, search?: string }
}

export default async function PagesManagement({ params, searchParams }: PageListProps) {
  const { success, response } = await verifyAdminAccess()
  if (!success) return response

  const siteId = params.id
  const status = searchParams.status || 'all'
  const search = searchParams.search || ''
  
  const supabase = createClient()
  
  // Get pages for this site
  let query = supabase
    .from('site_posts')
    .select(`
      id, title, slug, post_status, created_at, updated_at, 
      author_id, menu_order, 
      author:profiles(full_name)
    `)
    .eq('site_id', siteId)
    .eq('post_type', 'page')
    .order('menu_order', { ascending: true })

  if (status !== 'all') {
    query = query.eq('post_status', status)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data: pages, error } = await query

  if (error) {
    console.error('Error fetching pages:', error)
  }

  // Get site info
  const { data: site } = await supabase
    .from('sites')
    .select('name, domain')
    .eq('id', siteId)
    .single()

  const statusCounts = {
    all: pages?.length || 0,
    published: pages?.filter(p => p.post_status === 'published').length || 0,
    draft: pages?.filter(p => p.post_status === 'draft').length || 0,
    private: pages?.filter(p => p.post_status === 'private').length || 0,
    trash: pages?.filter(p => p.post_status === 'trash').length || 0
  }

  return (
    <CMSAdminLayout siteId={siteId}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
            <p className="text-gray-600">
              Manage static pages for {site?.name}
            </p>
          </div>
          <Link
            href={`/admin/sites/${siteId}/pages/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            ➕ Add New Page
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {/* Status Filters */}
              <div className="flex space-x-4">
                <Link 
                  href={`/admin/sites/${siteId}/pages`}
                  className={`text-sm ${status === 'all' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  All ({statusCounts.all})
                </Link>
                <Link 
                  href={`/admin/sites/${siteId}/pages?status=published`}
                  className={`text-sm ${status === 'published' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Published ({statusCounts.published})
                </Link>
                <Link 
                  href={`/admin/sites/${siteId}/pages?status=draft`}
                  className={`text-sm ${status === 'draft' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Draft ({statusCounts.draft})
                </Link>
                {statusCounts.private > 0 && (
                  <Link 
                    href={`/admin/sites/${siteId}/pages?status=private`}
                    className={`text-sm ${status === 'private' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Private ({statusCounts.private})
                  </Link>
                )}
                {statusCounts.trash > 0 && (
                  <Link 
                    href={`/admin/sites/${siteId}/pages?status=trash`}
                    className={`text-sm ${status === 'trash' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Trash ({statusCounts.trash})
                  </Link>
                )}
              </div>

              {/* Search */}
              <div className="flex items-center space-x-2">
                <form method="GET" className="flex items-center space-x-2">
                  <input
                    type="hidden"
                    name="status"
                    value={status}
                  />
                  <input
                    type="text"
                    name="search"
                    placeholder="Search pages..."
                    defaultValue={search}
                    className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Search
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Pages Table */}
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pages?.map((page: any) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/sites/${siteId}/pages/${page.id}/edit`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {page.title}
                        </Link>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            /{page.slug}
                          </span>
                          <span className="text-gray-300">•</span>
                          <Link
                            href={`http://${site?.domain}/${page.slug}`}
                            target="_blank"
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            View
                          </Link>
                          <span className="text-gray-300">•</span>
                          <Link
                            href={`/admin/sites/${siteId}/pages/${page.id}/edit`}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        page.post_status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : page.post_status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : page.post_status === 'private'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {page.post_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {page.author?.full_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span>
                          {new Date(page.updated_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs">
                          {new Date(page.updated_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/sites/${siteId}/pages/${page.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                        <button className="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!pages || pages.length === 0) && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <div className="text-4xl mb-4">📄</div>
                  <h3 className="text-lg font-medium mb-2">No pages found</h3>
                  <p className="text-sm mb-4">
                    {search ? 'No pages match your search.' : 'Get started by creating your first page.'}
                  </p>
                  <Link
                    href={`/admin/sites/${siteId}/pages/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create First Page
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CMSAdminLayout>
  )
}