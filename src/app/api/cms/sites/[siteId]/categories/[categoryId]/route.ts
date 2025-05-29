// src/app/api/cms/sites/[siteId]/categories/[categoryId]/route.ts - INDIVIDUAL CATEGORY API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/middleware/admin-access'

export async function PUT(
  request: NextRequest,
  { params }: { params: { siteId: string; categoryId: string } }
) {
  try {
    const { success, response } = await verifyAdminAccess()
    if (!success) return response

    const body = await request.json()
    const {
      name,
      slug,
      description,
      color,
      parent_id,
      display_order,
      is_featured
    } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if category exists
    const { data: existingCategory } = await supabase
      .from('blog_categories')
      .select('id, slug')
      .eq('site_id', params.siteId)
      .eq('id', params.categoryId)
      .single()

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Generate slug if changed
    const finalSlug = slug?.trim() || name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Check slug uniqueness (exclude current category)
    if (finalSlug !== existingCategory.slug) {
      const { data: duplicateCategory } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('site_id', params.siteId)
        .eq('slug', finalSlug)
        .neq('id', params.categoryId)
        .single()

      if (duplicateCategory) {
        return NextResponse.json({ error: 'Category slug already exists' }, { status: 400 })
      }
    }

    // Validate parent category if provided
    if (parent_id && parent_id !== params.categoryId) {
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

    // Prevent setting self as parent
    if (parent_id === params.categoryId) {
      return NextResponse.json({ error: 'Category cannot be its own parent' }, { status: 400 })
    }

    const { data: category, error } = await supabase
      .from('blog_categories')
      .update({
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        color: color || '#3B82F6',
        parent_id: parent_id || null,
        display_order: display_order || 0,
        is_featured: is_featured || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.categoryId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string; categoryId: string } }
) {
  try {
    const { success, response } = await verifyAdminAccess()
    if (!success) return response

    const supabase = createClient()

    // Check if category exists
    const { data: existingCategory } = await supabase
      .from('blog_categories')
      .select('id, name, post_count')
      .eq('site_id', params.siteId)
      .eq('id', params.categoryId)
      .single()

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check for child categories
    const { data: childCategories } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('parent_id', params.categoryId)
      .limit(1)

    if (childCategories && childCategories.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with child categories. Please delete or reassign child categories first.' 
      }, { status: 400 })
    }

    // Check for posts in this category
    const { data: categoryPosts } = await supabase
      .from('post_categories')
      .select('post_id')
      .eq('category_id', params.categoryId)
      .limit(1)

    if (categoryPosts && categoryPosts.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category that contains posts. Please move posts to another category first.' 
      }, { status: 400 })
    }

    // Delete the category
    const { error } = await supabase
      .from('blog_categories')
      .delete()
      .eq('id', params.categoryId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Category "${existingCategory.name}" deleted successfully`
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}