// src/app/api/admin/bulk-assign/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { siteId, type } = await request.json()

    if (!siteId || !type) {
      return NextResponse.json({ error: 'siteId and type required' }, { status: 400 })
    }

    let totalUpdated = 0

    // Assign businesses
    if (type === 'businesses' || type === 'all') {
      const { data, error } = await supabase
        .from('businesses')
        .update({ site_id: siteId })
        .is('site_id', null)
        .select('id')
      
      if (error) {
        console.error('Business assignment error:', error)
      } else {
        totalUpdated += data?.length || 0
      }
    }

    // Assign categories
    if (type === 'categories' || type === 'all') {
      const { data, error } = await supabase
        .from('categories')
        .update({ site_id: siteId })
        .is('site_id', null)
        .select('id')
      
      if (error) {
        console.error('Category assignment error:', error)
      } else {
        totalUpdated += data?.length || 0
      }
    }

    // Assign profiles (only if 'all')
    if (type === 'all') {
      const { data, error } = await supabase
        .from('profiles')
        .update({ site_id: siteId })
        .is('site_id', null)
        .select('id')
      
      if (error) {
        console.error('Profile assignment error:', error)
      } else {
        totalUpdated += data?.length || 0
      }
    }

    return NextResponse.json({ 
      success: true, 
      updated: totalUpdated 
    })
    
  } catch (error) {
    console.error('Bulk assignment error:', error)
    return NextResponse.json({ error: 'Assignment failed' }, { status: 500 })
  }
}