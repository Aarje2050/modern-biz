// src/app/api/cms/sites/[siteId]/menus/[menuId]/route.ts - INDIVIDUAL MENU API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/middleware/admin-access'

export async function PUT(
  request: NextRequest,
  { params }: { params: { siteId: string; menuId: string } }
) {
  try {
    const { success, response } = await verifyAdminAccess()
    if (!success) return response

    const body = await request.json()
    const {
      name,
      label,
      locations,
      settings
    } = body

    const supabase = createClient()

    // Check if menu exists
    const { data: existingMenu } = await supabase
      .from('site_menus')
      .select('id, name')
      .eq('site_id', params.siteId)
      .eq('id', params.menuId)
      .single()

    if (!existingMenu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    // Check name uniqueness (exclude current menu)
    if (name && name !== existingMenu.name) {
      const { data: duplicateMenu } = await supabase
        .from('site_menus')
        .select('id')
        .eq('site_id', params.siteId)
        .eq('name', name.trim())
        .neq('id', params.menuId)
        .single()

      if (duplicateMenu) {
        return NextResponse.json({ error: 'Menu name already exists' }, { status: 400 })
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name.trim()
    if (label !== undefined) updateData.label = label?.trim() || name?.trim()
    if (locations !== undefined) updateData.locations = locations
    if (settings !== undefined) updateData.settings = settings

    const { data: menu, error } = await supabase
      .from('site_menus')
      .update(updateData)
      .eq('id', params.menuId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(menu)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update menu' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string; menuId: string } }
) {
  try {
    const { success, response } = await verifyAdminAccess()
    if (!success) return response

    const supabase = createClient()

    // Check if menu exists
    const { data: existingMenu } = await supabase
      .from('site_menus')
      .select('id, name')
      .eq('site_id', params.siteId)
      .eq('id', params.menuId)
      .single()

    if (!existingMenu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    // Delete menu (cascade will delete menu items)
    const { error } = await supabase
      .from('site_menus')
      .delete()
      .eq('id', params.menuId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Menu "${existingMenu.name}" deleted successfully`
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete menu' }, { status: 500 })
  }
}