// src/app/api/cms/sites/[siteId]/posts/[postId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/middleware/admin-access'

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string; postId: string } }
) {
  try {
    const { success, response } = await verifyAdminAccess()
    if (!success) return response

    const supabase = createClient()

    const { data: post, error } = await supabase
      .from('site_posts')
      .select(`
        *, 
        author:profiles(full_name, display_name),
        parent:site_posts!parent_id(title, slug)
      `)
      .eq('site_id', params.siteId)
      .eq('id', params.postId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { siteId: string; postId: string } }
) {
  try {
    const { success, response, user } = await verifyAdminAccess()
    if (!success) return response

    // Check if post exists
    const supabase = createClient()
    
    const { data: existingPost } = await supabase
  .from('site_posts')
  .select('id, slug, post_status, title, content, meta_data') // Add the missing fields
  .eq('site_id', params.siteId)
  .eq('id', params.postId)
  .single()

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      slug,
      content,
      excerpt,
      post_status,
      menu_order,
      parent_id,
      template,
      featured_image_url,
      seo_title,
      seo_description,
      seo_keywords,
      meta_data,
      save_revision = true
    } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate slug if changed
    const finalSlug = slug?.trim() || title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Check slug uniqueness (exclude current post)
    if (finalSlug !== existingPost.slug) {
      const { data: duplicatePost } = await supabase
        .from('site_posts')
        .select('id')
        .eq('site_id', params.siteId)
        .eq('slug', finalSlug)
        .neq('id', params.postId)
        .single()

      if (duplicatePost) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
      }
    }

    // Save revision if requested
    if (save_revision && existingPost) {

      await supabase
        .from('site_post_revisions')
        .insert({
          post_id: params.postId,
          title: existingPost.title,
          content: existingPost.content,
          meta_data: existingPost.meta_data || {},
          revision_note: 'Auto-save before update',
          created_by: user?.id
        })
    }

    // Prepare update data
    const updateData: any = {
      title: title.trim(),
      slug: finalSlug,
      content,
      excerpt,
      menu_order,
      parent_id,
      template,
      featured_image_url,
      seo_title,
      seo_description,
      seo_keywords,
      meta_data: meta_data || {}
    }

    // Handle status change
    if (post_status && post_status !== existingPost.post_status) {
      updateData.post_status = post_status
      if (post_status === 'published' && existingPost.post_status !== 'published') {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data: post, error } = await supabase
      .from('site_posts')
      .update(updateData)
      .eq('id', params.postId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(post)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string; postId: string } }
) {
  try {
    const { success, response } = await verifyAdminAccess()
    if (!success) return response

    const supabase = createClient()

    // Check for child pages
    const { data: childPages } = await supabase
      .from('site_posts')
      .select('id')
      .eq('parent_id', params.postId)
      .limit(1)

    if (childPages && childPages.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete page with child pages. Delete child pages first.' 
      }, { status: 400 })
    }

    // Soft delete by changing status to 'trash'
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    let deleteError = null  // Declare error variable outside


    if (permanent) {
      // Permanent delete
      const { error } = await supabase
        .from('site_posts')
        .delete()
        .eq('id', params.postId)
      deleteError = error  // Assign to outer variable
    } else {
      // Soft delete
      const { error } = await supabase
        .from('site_posts')
        .update({ post_status: 'trash' })
        .eq('id', params.postId)
      deleteError = error  // Assign to outer variable
    }
    
    if (deleteError) {  // Use the outer variable
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: permanent ? 'Post permanently deleted' : 'Post moved to trash'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}