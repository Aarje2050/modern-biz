// CORRECTED: Uses account_type instead of is_admin
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { siteId, type } = await request.json()

    if (!siteId || !type) {
      return NextResponse.json({ error: 'siteId and type required' }, { status: 400 })
    }

    // Verify admin permissions (CORRECTED)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single()
    
    if (profile?.account_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
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