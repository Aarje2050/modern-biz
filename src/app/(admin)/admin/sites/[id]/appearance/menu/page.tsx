// src/app/(admin)/admin/sites/[id]/appearance/menu/page.tsx - ENTERPRISE MENU MANAGEMENT
import { createClient } from '@/lib/supabase/server'
import CMSAdminLayout from '@/components/cms/CMSAdminLayout'
import { verifyAdminAccess } from '@/lib/middleware/admin-access'
import MenuBuilder from '@/components/cms/MenuBuilder'

interface MenuManagementProps {
  params: { id: string }
}

export default async function MenuManagement({ params }: MenuManagementProps) {
  const { success, response } = await verifyAdminAccess()
  if (!success) return response

  const siteId = params.id
  const supabase = createClient()
  
  // Get site info
  const { data: site } = await supabase
    .from('sites')
    .select('name, domain, site_type, template')
    .eq('id', siteId)
    .single()

  // Get all menus with items for this site
  const { data: menusData } = await supabase
    .rpc('get_site_menus_with_items', {
      p_site_id: siteId
    })

  // Get available content for linking (pages, posts, categories)
  const [
    { data: pages },
    { data: posts },
    { data: categories }
  ] = await Promise.all([
    supabase.rpc('get_site_posts', { p_site_id: siteId, p_post_type: 'page' }),
    supabase.rpc('get_site_posts', { p_site_id: siteId, p_post_type: 'post' }),
    supabase.rpc('get_site_categories', { p_site_id: siteId })
  ])

  // Transform menu data for easier handling
  const menus = menusData ? transformMenuData(menusData) : []

  return (
    <CMSAdminLayout siteId={siteId}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-gray-600">
              Create and manage navigation menus for {site?.name}
            </p>
          </div>
        </div>

        {/* Menu Builder Component */}
        <MenuBuilder 
          siteId={siteId}
          initialMenus={menus}
          availableContent={{
            pages: pages || [],
            posts: posts || [],
            categories: categories || []
          }}
          siteType={site?.site_type || 'directory'}
        />

        {/* Menu Locations Info */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Menu Locations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Available Locations</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <span>Primary Navigation</span>
                  <span className="text-gray-500">header</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <span>Footer Menu</span>
                  <span className="text-gray-500">footer</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <span>Mobile Menu</span>
                  <span className="text-gray-500">mobile</span>
                </div>
                {site?.site_type === 'directory' && (
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <span>Directory Sidebar</span>
                    <span className="text-gray-500">sidebar</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Menu Guidelines</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Primary navigation appears in the header</p>
                <p>• Footer menu shows at the bottom of pages</p>
                <p>• Mobile menu is used on smaller screens</p>
                <p>• Keep menu items concise and descriptive</p>
                <p>• Test menus on different screen sizes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              // onClick={() => window.open(`http://${site?.domain}`, '_blank')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <span className="text-2xl mr-3">👁️</span>
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Preview Site</h4>
                <p className="text-sm text-gray-500">See how menus look</p>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <span className="text-2xl mr-3">🎨</span>
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Customize Design</h4>
                <p className="text-sm text-gray-500">Menu styling options</p>
              </div>
            </button>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <span className="text-2xl mr-3">📱</span>
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Mobile Preview</h4>
                <p className="text-sm text-gray-500">Test responsive design</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </CMSAdminLayout>
  )
}

// Helper function to transform menu data
function transformMenuData(menusData: any[]) {
  const menusMap = new Map()
  
  menusData.forEach(row => {
    if (!menusMap.has(row.menu_id)) {
      menusMap.set(row.menu_id, {
        id: row.menu_id,
        name: row.menu_name,
        label: row.menu_label,
        locations: row.menu_locations || [],
        settings: row.menu_settings || {},
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