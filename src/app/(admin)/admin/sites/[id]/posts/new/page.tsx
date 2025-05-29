// src/app/(admin)/admin/sites/[id]/posts/new/page.tsx - NEW POST
import { verifyAdminAccess } from '@/lib/middleware/admin-access'
import { createClient } from '@/lib/supabase/server'
import PostEditor from '@/components/cms/PostEditor'
import { redirect } from 'next/navigation'

interface NewPostProps {
  params: { id: string }
}

export default async function NewPostPage({ params }: NewPostProps) {
  const { success, response } = await verifyAdminAccess()
  if (!success) return response

  const siteId = params.id
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

  // Default data for new post
  const initialData = {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    post_status: 'draft' as const,
    seo_title: '',
    seo_description: '',
    seo_keywords: [],
    featured_image_url: '',
    menu_order: 0,
    template: 'blog-post',
    meta_data: {},
    categories: [],
    tags: []
  }

  return (
    <PostEditor 
      siteId={siteId} 
      initialData={initialData}
    />
  )
}