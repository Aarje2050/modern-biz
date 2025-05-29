import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { id } = params
    
    const { domain, name, site_type, template, config } = body
    
    if (!domain || !name) {
      return NextResponse.json(
        { error: 'Domain and name are required' }, 
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

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

    // Check if site exists
    const { data: existingSite, error: checkError } = await supabase
      .from('sites')
      .select('id, domain, name')
      .eq('id', id)
      .single()

    if (checkError || !existingSite) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Update site with new fields
    const { data: updatedSites, error } = await supabase
      .from('sites')
      .update({
        domain,
        name,
        slug,
        site_type: site_type || 'directory',
        template: template || 'directory-modern',
        config: config || {}
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!updatedSites || updatedSites.length === 0) {
      return NextResponse.json({ error: 'Failed to update site' }, { status: 500 })
    }

    return NextResponse.json(updatedSites[0])
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

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

    // Delete site
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message }, 
      { status: 500 }
    )
  }
}