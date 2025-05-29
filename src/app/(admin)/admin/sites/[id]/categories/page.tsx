// src/app/(admin)/admin/sites/[id]/categories/page.tsx - CATEGORIES MANAGEMENT
import { createClient } from '@/lib/supabase/server'
import CMSAdminLayout from '@/components/cms/CMSAdminLayout'
import Link from 'next/link'
import { verifyAdminAccess } from '@/lib/middleware/admin-access'
import CategoryManager from '@/components/cms/CategoryManager'

interface CategoriesManagementProps {
  params: { id: string }
}

export default async function CategoriesManagement({ params }: CategoriesManagementProps) {
  const { success, response } = await verifyAdminAccess()
  if (!success) return response

  const siteId = params.id
  const supabase = createClient()
  
  // Get site info
  const { data: site } = await supabase
    .from('sites')
    .select('name, domain, site_type')
    .eq('id', siteId)
    .single()

  // Get categories for this site
  const { data: categories } = await supabase
    .rpc('get_site_categories', {
      p_site_id: siteId
    })

  return (
    <CMSAdminLayout siteId={siteId}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600">
              Organize your blog posts with categories for {site?.name}
            </p>
          </div>
        </div>

        {/* Category Manager Component */}
        <CategoryManager siteId={siteId} initialCategories={categories || []} />

        {/* Categories Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">📂</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Categories</p>
                <p className="text-2xl font-semibold text-gray-900">{categories?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">⭐</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Featured</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {categories?.filter((c: any) => c.is_featured).length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">📝</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Posts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {categories?.reduce((sum: number, c: any) => sum + (c.post_count || 0), 0) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href={`/admin/sites/${siteId}/posts/new`}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <span className="text-2xl mr-3">📝</span>
              <div>
                <h4 className="font-medium text-gray-900">New Post</h4>
                <p className="text-sm text-gray-500">Create a blog post</p>
              </div>
            </Link>
            
            <Link
              href={`/blog`}
              target="_blank"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <span className="text-2xl mr-3">👁️</span>
              <div>
                <h4 className="font-medium text-gray-900">View Blog</h4>
                <p className="text-sm text-gray-500">See public blog</p>
              </div>
            </Link>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <h4 className="font-medium text-gray-900">Analytics</h4>
                <p className="text-sm text-gray-500">View blog stats</p>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <span className="text-2xl mr-3">🎨</span>
              <div>
                <h4 className="font-medium text-gray-900">Customize</h4>
                <p className="text-sm text-gray-500">Blog appearance</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </CMSAdminLayout>
  )
}