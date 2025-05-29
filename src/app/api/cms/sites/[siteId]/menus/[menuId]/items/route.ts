// src/app/api/cms/sites/[siteId]/menus/[menuId]/items/route.ts - MENU ITEMS API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/middleware/admin-access'

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string; menuId: string } }
) {
  try {
    const { success, response } = await verifyAdminAccess()
    if (!success) return response

    const supabase = createClient()

    const { data: items, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('menu_id', params.menuId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(items || [])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { siteId: string; menuId: string } }
) {
  try {
    const { success, response, user } = await verifyAdminAccess()
    if (!success) return response

    const body = await request.json()
    const {
      title,
      url,
      link_type = 'custom',
      target_id,
      parent_id,
      css_classes,
      display_order = 0,
      settings = {}
    } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Menu item title is required' }, { status: 400 })
    }

    if (!url?.trim() && link_type === 'custom') {
      return NextResponse.json({ error: 'URL is required for custom links' }, { status: 400 })
    }

    const supabase = createClient()

    // Verify menu exists and belongs to site
    const { data: menu } = await supabase
      .from('site_menus')
      .select('id')
      .eq('site_id', params.siteId)
      .eq('id', params.menuId)
      .single()

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    // Validate parent item if provided
    if (parent_id) {
      const { data: parentItem } = await supabase
        .from('menu_items')
        .select('id')
        .eq('menu_id', params.menuId)
        .eq('id', parent_id)
        .single()

      if (!parentItem) {
        return NextResponse.json({ error: 'Parent menu item not found' }, { status: 400 })
      }
    }

    // If display_order is 0, set it to the end
    let finalDisplayOrder = display_order
    if (finalDisplayOrder === 0) {
      const { data: lastItem } = await supabase
        .from('menu_items')
        .select('display_order')
        .eq('menu_id', params.menuId)
        .order('display_order', { ascending: false })
        .limit(1)
        .single()

      finalDisplayOrder = (lastItem?.display_order || 0) + 1
    }

    const { data: item, error } = await supabase
      .from('menu_items')
      .insert({
        menu_id: params.menuId,
        title: title.trim(),
        url: url?.trim() || '#',
        link_type,
        target_id: target_id || null,
        parent_id: parent_id || null,
        css_classes: css_classes?.trim() || null,
        display_order: finalDisplayOrder,
        settings,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}