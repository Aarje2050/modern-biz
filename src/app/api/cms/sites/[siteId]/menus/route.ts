// src/app/api/cms/sites/[siteId]/menus/route.ts - MENUS API
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

    const { data: menus, error } = await supabase
      .rpc('get_site_menus_with_items', {
        p_site_id: params.siteId
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(menus || [])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch menus' }, { status: 500 })
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
      label,
      locations = [],
      settings = {}
    } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Menu name is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Check name uniqueness
    const { data: existingMenu } = await supabase
      .from('site_menus')
      .select('id')
      .eq('site_id', params.siteId)
      .eq('name', name.trim())
      .single()

    if (existingMenu) {
      return NextResponse.json({ error: 'Menu name already exists' }, { status: 400 })
    }

    const { data: menu, error } = await supabase
      .from('site_menus')
      .insert({
        site_id: params.siteId,
        name: name.trim(),
        label: label?.trim() || name.trim(),
        locations: locations,
        menu_type: 'navigation',
        settings: settings,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(menu, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create menu' }, { status: 500 })
  }
}