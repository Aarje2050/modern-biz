// src/app/api/cms/sites/[siteId]/menus/[menuId]/items/[itemId]/route.ts - INDIVIDUAL MENU ITEM API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/middleware/admin-access'

export async function PUT(
  request: NextRequest,
  { params }: { params: { siteId: string; menuId: string; itemId: string } }
) {
  try {
    const { success, response } = await verifyAdminAccess()
    if (!success) return response

    const body = await request.json()
    const {
      title,
      url,
      link_type,
      target_id,
      parent_id,
      css_classes,
      display_order,
      settings
    } = body

    const supabase = createClient()

    // Check if menu item exists
    const { data: existingItem } = await supabase
      .from('menu_items')
      .select('id, menu_id, title')
      .eq('menu_id', params.menuId)
      .eq('id', params.itemId)
      .single()

    if (!existingItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    // Validate parent item if provided (prevent circular references)
    if (parent_id && parent_id !== params.itemId) {
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

    // Prevent setting self as parent
    if (parent_id === params.itemId) {
      return NextResponse.json({ error: 'Menu item cannot be its own parent' }, { status: 400 })
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title.trim()
    if (url !== undefined) updateData.url = url.trim() || '#'
    if (link_type !== undefined) updateData.link_type = link_type
    if (target_id !== undefined) updateData.target_id = target_id || null
    if (parent_id !== undefined) updateData.parent_id = parent_id || null
    if (css_classes !== undefined) updateData.css_classes = css_classes?.trim() || null
    if (display_order !== undefined) updateData.display_order = display_order
    if (settings !== undefined) updateData.settings = settings

    const { data: item, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', params.itemId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string; menuId: string; itemId: string } }
) {
  try {
    const { success, response } = await verifyAdminAccess()
    if (!success) return response

    const supabase = createClient()

    // Check if menu item exists
    const { data: existingItem } = await supabase
      .from('menu_items')
      .select('id, title')
      .eq('menu_id', params.menuId)
      .eq('id', params.itemId)
      .single()

    if (!existingItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    // Check for child items
    const { data: childItems } = await supabase
      .from('menu_items')
      .select('id')
      .eq('parent_id', params.itemId)
      .limit(1)

    if (childItems && childItems.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete menu item with child items. Please delete or reassign child items first.' 
      }, { status: 400 })
    }

    // Delete the menu item
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', params.itemId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Menu item "${existingItem.title}" deleted successfully`
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
  }
}