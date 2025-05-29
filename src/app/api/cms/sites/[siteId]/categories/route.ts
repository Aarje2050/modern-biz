// src/app/api/cms/sites/[siteId]/categories/route.ts - CATEGORIES API
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

    const supabase = createClient()

    const { data: categories, error } = await supabase
      .rpc('get_site_categories', {
        p_site_id: params.siteId
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(categories || [])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
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
      name,
      slug,
      description,
      color = '#3B82F6',
      parent_id,
      display_order = 0,
      is_featured = false
    } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // Generate slug if not provided
    const finalSlug = slug?.trim() || name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const supabase = createClient()

    // Check slug uniqueness
    const { data: existingCategory } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('site_id', params.siteId)
      .eq('slug', finalSlug)
      .single()

    if (existingCategory) {
      return NextResponse.json({ error: 'Category slug already exists' }, { status: 400 })
    }

    // Validate parent category if provided
    if (parent_id) {
      const { data: parentCategory } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('site_id', params.siteId)
        .eq('id', parent_id)
        .single()

      if (!parentCategory) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 })
      }
    }

    const { data: category, error } = await supabase
      .from('blog_categories')
      .insert({
        site_id: params.siteId,
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        color,
        parent_id: parent_id || null,
        display_order,
        is_featured,
        post_count: 0
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}