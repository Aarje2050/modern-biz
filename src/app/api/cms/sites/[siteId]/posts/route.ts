// src/app/api/cms/sites/[siteId]/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/middleware/admin-access'

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const { success, response } = await verifyAdminAccess()
    if (!success) return response

    const { searchParams } = new URL(request.url)
    
    const postType = searchParams.get('type') || 'page'
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const supabase = createClient()

    let query = supabase
      .from('site_posts')
      .select(`
        id, title, slug, excerpt, post_type, post_status, 
        menu_order, created_at, updated_at, published_at,
        author:profiles(full_name)
      `, { count: 'exact' })
      .eq('site_id', params.siteId)
      .eq('post_type', postType)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('post_status', status)
    }

    const { data: posts, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const { success, response, user } = await verifyAdminAccess()
    if (!success) return response

    const body = await request.json()
    const {
      title,
      slug,
      content,
      excerpt,
      post_type = 'page',
      post_status = 'draft',
      menu_order = 0,
      parent_id,
      template,
      featured_image_url,
      seo_title,
      seo_description,
      seo_keywords,
      meta_data = {}
    } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate slug if not provided
    const finalSlug = slug?.trim() || title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const supabase = createClient()

    // Check slug uniqueness
    const { data: existingPost } = await supabase
      .from('site_posts')
      .select('id')
      .eq('site_id', params.siteId)
      .eq('slug', finalSlug)
      .single()

    if (existingPost) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    const { data: post, error } = await supabase
      .from('site_posts')
      .insert({
        site_id: params.siteId,
        title: title.trim(),
        slug: finalSlug,
        content,
        excerpt,
        post_type,
        post_status,
        menu_order,
        parent_id,
        template,
        featured_image_url,
        author_id: user?.id,
        seo_title,
        seo_description,
        seo_keywords,
        meta_data,
        published_at: post_status === 'published' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
  
}