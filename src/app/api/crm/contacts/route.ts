import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const lifecycle_stage = searchParams.get('lifecycle_stage')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    // Verify business access
    const { data: businessAccess } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('profile_id', user.id)
      .single()

    if (!businessAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build query with profile join
    let query = supabase
      .from('crm_contacts')
      .select(`
        *,
        profile:profiles!profile_id (
          id,
          full_name,
          display_name,
          avatar_url,
          account_type,
          is_verified
        ),
        interactions:crm_interactions(count),
        leads:crm_leads(count),
        tasks:crm_tasks(count)
      `, { count: 'exact' })
      .eq('business_id', businessId)

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (lifecycle_stage) {
      query = query.eq('lifecycle_stage', lifecycle_stage)
    }

    // Get total count first
    const { count: totalCount } = await query

    // Apply pagination and get data
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data: contacts, error } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    // Transform data to include computed fields
    const transformedContacts = contacts?.map(contact => ({
      ...contact,
      // Add computed display name from profile or fallback to contact data
      display_name: contact.profile?.display_name || 
                   contact.profile?.full_name || 
                   `${contact.first_name} ${contact.last_name}`.trim(),
      // Add profile avatar
      avatar_url: contact.profile?.avatar_url,
      // Add verification status
      is_verified: contact.profile?.is_verified || false,
      // Add interaction counts
      interactions_count: contact.interactions?.[0]?.count || 0,
      leads_count: contact.leads?.[0]?.count || 0,
      tasks_count: contact.tasks?.[0]?.count || 0
    })) || []

    return NextResponse.json({
      contacts: transformedContacts,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in contacts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      business_id,
      profile_id, // Optional - for linking to existing profile
      first_name,
      last_name,
      email,
      phone,
      company,
      job_title,
      source = 'manual',
      lifecycle_stage = 'lead',
      notes
    } = body

    if (!business_id || !first_name || !email) {
      return NextResponse.json({ 
        error: 'Business ID, first name, and email are required' 
      }, { status: 400 })
    }

    // Verify business access
    const { data: businessAccess } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', business_id)
      .eq('profile_id', user.id)
      .single()

    if (!businessAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check for duplicate email in same business
    const { data: existingContact } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('business_id', business_id)
      .eq('email', email)
      .single()

    if (existingContact) {
      return NextResponse.json({ 
        error: 'Contact with this email already exists' 
      }, { status: 409 })
    }

    // If profile_id is provided, verify it exists
    if (profile_id) {
      const { data: profileExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profile_id)
        .single()

      if (!profileExists) {
        return NextResponse.json({ 
          error: 'Profile not found' 
        }, { status: 404 })
      }
    }

    // Create contact
    const { data: contact, error } = await supabase
      .from('crm_contacts')
      .insert({
        business_id,
        profile_id: profile_id || null,
        first_name,
        last_name,
        email,
        phone: phone || '',
        company: company || '',
        job_title: job_title || '',
        source,
        lifecycle_stage,
        notes: notes || '',
        created_by: user.id
      })
      .select(`
        *,
        profile:profiles!profile_id (
          id,
          full_name,
          display_name,
          avatar_url,
          account_type,
          is_verified
        )
      `)
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
    }

    return NextResponse.json({ contact }, { status: 201 })

  } catch (error) {
    console.error('Error in contacts POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}