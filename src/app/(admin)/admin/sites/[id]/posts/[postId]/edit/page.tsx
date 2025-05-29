// src/app/(admin)/admin/sites/[id]/posts/[postId]/edit/page.tsx - EDIT POST
import { verifyAdminAccess } from '@/lib/middleware/admin-access'
import { createClient } from '@/lib/supabase/server'
import PostEditor from '@/components/cms/PostEditor'
import { redirect } from 'next/navigation'

interface EditPostProps {
  params: { id: string; postId: string }
}

export default async function EditPostPage({ params }: EditPostProps) {
  const { success, response } = await verifyAdminAccess()
  if (!success) return response

  const { id: siteId, postId } = params
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

  // Get existing post data
  const { data: post, error: postError } = await supabase
    .from('site_posts')
    .select(`
      id, title, slug, content, excerpt, post_type, post_status,
      seo_title, seo_description, seo_keywords, featured_image_url,
      menu_order, template, meta_data, created_at, updated_at, published_at
    `)
    .eq('site_id', siteId)
    .eq('id', postId)
    .eq('post_type', 'post')
    .single()

  if (postError || !post) {
    console.error('Post not found:', postError)
    redirect(`/admin/sites/${siteId}/posts`)
  }

  // Transform data for the editor
  const initialData = {
    title: post.title,
    slug: post.slug,
    content: post.content || '',
    excerpt: post.excerpt || '',
    post_status: post.post_status as 'draft' | 'published' | 'private',
    seo_title: post.seo_title || '',
    seo_description: post.seo_description || '',
    seo_keywords: post.seo_keywords || [],
    featured_image_url: post.featured_image_url || '',
    menu_order: post.menu_order || 0,
    template: post.template || 'blog-post',
    meta_data: post.meta_data || {},
    categories: post.meta_data?.categories || [],
    tags: post.seo_keywords || []
  }

  return (
    <PostEditor 
      siteId={siteId} 
      postId={postId} 
      initialData={initialData}
    />
  )
}