// src/app/api/admin/unassigned-stats/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()

    // Count unassigned businesses
    const { count: businessCount } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .is('site_id', null)

    // Count unassigned categories  
    const { count: categoryCount } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .is('site_id', null)

    // Count unassigned profiles
    const { count: profileCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .is('site_id', null)

    return NextResponse.json({
      businesses: businessCount || 0,
      categories: categoryCount || 0,
      profiles: profileCount || 0
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}