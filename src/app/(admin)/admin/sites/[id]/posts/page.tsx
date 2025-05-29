// src/app/(admin)/admin/sites/[id]/posts/page.tsx - POSTS MANAGEMENT
import { createClient } from '@/lib/supabase/server'
import CMSAdminLayout from '@/components/cms/CMSAdminLayout'
import Link from 'next/link'
import { verifyAdminAccess } from '@/lib/middleware/admin-access'

interface Post {
  id: string
  title: string
  slug: string
  post_status: string
  created_at: string
  updated_at: string
  published_at: string
  author_id: string
  excerpt: string
  seo_keywords: string[]
}

interface PostsListProps {
  params: { id: string }
  searchParams: { status?: string, search?: string }
}

export default async function PostsManagement({ params, searchParams }: PostsListProps) {
  const { success, response } = await verifyAdminAccess()
  if (!success) return response

  const siteId = params.id
  const status = searchParams.status || 'all'
  const search = searchParams.search || ''
  
  const supabase = createClient()
  
  // Get posts for this site (using security definer function)
  const { data: allPosts } = await supabase
    .rpc('get_site_posts', {
      p_site_id: siteId,
      p_post_type: 'post'
    })

  // Filter posts based on search params
  let posts = allPosts || []
  
  if (status !== 'all') {
    posts = posts.filter((p: Post) => p.post_status === status)
  }
  
  if (search) {
    posts = posts.filter((p: Post) => 
      p.title.toLowerCase().includes(search.toLowerCase())
    )
  }

  // Get site info
  const { data: site } = await supabase
    .from('sites')
    .select('name, domain, site_type')
    .eq('id', siteId)
    .single()

  const statusCounts = {
    all: allPosts?.length || 0,
    published: allPosts?.filter((p: Post) => p.post_status === 'published').length || 0,
    draft: allPosts?.filter((p: Post) => p.post_status === 'draft').length || 0,
    private: allPosts?.filter((p: Post) => p.post_status === 'private').length || 0,
    trash: allPosts?.filter((p: Post) => p.post_status === 'trash').length || 0
  }

  return (
    <CMSAdminLayout siteId={siteId}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
            <p className="text-gray-600">
              Manage blog posts for {site?.name}
            </p>
          </div>
          <Link
            href={`/admin/sites/${siteId}/posts/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            ✏️ Add New Post
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {/* Status Filters */}
              <div className="flex space-x-4">
                <Link 
                  href={`/admin/sites/${siteId}/posts`}
                  className={`text-sm ${status === 'all' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  All ({statusCounts.all})
                </Link>
                <Link 
                  href={`/admin/sites/${siteId}/posts?status=published`}
                  className={`text-sm ${status === 'published' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Published ({statusCounts.published})
                </Link>
                <Link 
                  href={`/admin/sites/${siteId}/posts?status=draft`}
                  className={`text-sm ${status === 'draft' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Draft ({statusCounts.draft})
                </Link>
                {statusCounts.private > 0 && (
                  <Link 
                    href={`/admin/sites/${siteId}/posts?status=private`}
                    className={`text-sm ${status === 'private' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Private ({statusCounts.private})
                  </Link>
                )}
                {statusCounts.trash > 0 && (
                  <Link 
                    href={`/admin/sites/${siteId}/posts?status=trash`}
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
                    placeholder="Search posts..."
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

          {/* Posts Table */}
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
                    Tags
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
                {posts?.map((post: Post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/sites/${siteId}/posts/${post.id}/edit`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {post.title}
                        </Link>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            /{post.slug}
                          </span>
                          <span className="text-gray-300">•</span>
                          <Link
                            href={`http://${site?.domain}/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            View
                          </Link>
                          <span className="text-gray-300">•</span>
                          <Link
                            href={`/admin/sites/${siteId}/posts/${post.id}/edit`}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Edit
                          </Link>
                        </div>
                        {post.excerpt && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        post.post_status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : post.post_status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : post.post_status === 'private'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {post.post_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {post.seo_keywords?.slice(0, 3).map((tag, index) => (
                          <span 
                            key={index}
                            className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {(post.seo_keywords?.length || 0) > 3 && (
                          <span className="text-xs text-gray-500">
                            +{(post.seo_keywords?.length || 0) - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {post.post_status === 'published' && post.published_at
                            ? new Date(post.published_at).toLocaleDateString()
                            : new Date(post.updated_at).toLocaleDateString()
                          }
                        </span>
                        <span className="text-xs">
                          {post.post_status === 'published' ? 'Published' : 'Last modified'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/sites/${siteId}/posts/${post.id}/edit`}
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

            {(!posts || posts.length === 0) && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <div className="text-4xl mb-4">✏️</div>
                  <h3 className="text-lg font-medium mb-2">No posts found</h3>
                  <p className="text-sm mb-4">
                    {search ? 'No posts match your search.' : 'Start sharing your thoughts with your first blog post.'}
                  </p>
                  <Link
                    href={`/admin/sites/${siteId}/posts/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create First Post
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Posts Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">📝</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Posts</p>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.all}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">✅</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Published</p>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.published}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">📄</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Drafts</p>
                <p className="text-2xl font-semibold text-gray-900">{statusCounts.draft}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">👁️</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Views</p>
                <p className="text-2xl font-semibold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CMSAdminLayout>
  )
}