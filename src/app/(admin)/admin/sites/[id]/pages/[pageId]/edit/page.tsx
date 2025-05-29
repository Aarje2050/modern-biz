// src/app/admin/sites/[id]/pages/[pageId]/edit/page.tsx - FIXED EDIT ROUTE
import { verifyAdminAccess } from '@/lib/middleware/admin-access'
import { createClient } from '@/lib/supabase/server'
import PageEditor from '@/components/cms/PageEditor'
import { redirect } from 'next/navigation'

interface EditPageProps {
  params: { id: string; pageId: string }
}

export default async function EditPagePage({ params }: EditPageProps) {
  const { success, response } = await verifyAdminAccess()
  if (!success) return response

  const { id: siteId, pageId } = params
  const supabase = createClient()
  
  // Verify site exists and user has access
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('id, name, domain, site_type')
    .eq('id', siteId)
    .single()

  if (siteError || !site) {
    redirect('/admin/sites')
  }

  // Get existing page data
  const { data: page, error: pageError } = await supabase
    .from('site_posts')
    .select(`
      id, title, slug, content, excerpt, post_type, post_status,
      seo_title, seo_description, seo_keywords, featured_image_url,
      menu_order, template, meta_data, created_at, updated_at, published_at
    `)
    .eq('site_id', siteId)
    .eq('id', pageId)
    .eq('post_type', 'page')
    .single()

  if (pageError || !page) {
    console.error('Page not found:', pageError)
    redirect(`/admin/sites/${siteId}/pages`)
  }

  // Transform data for the editor
  const initialData = {
    title: page.title,
    slug: page.slug,
    content: page.content || '',
    excerpt: page.excerpt || '',
    post_status: page.post_status as 'draft' | 'published' | 'private',
    seo_title: page.seo_title || '',
    seo_description: page.seo_description || '',
    seo_keywords: page.seo_keywords || [],
    featured_image_url: page.featured_image_url || '',
    menu_order: page.menu_order || 0,
    template: page.template || '',
    meta_data: page.meta_data || {}
  }

  return (
    <PageEditor 
      siteId={siteId} 
      pageId={pageId} 
      initialData={initialData}
    />
  )
}