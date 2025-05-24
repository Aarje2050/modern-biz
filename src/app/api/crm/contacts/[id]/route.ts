// src/app/api/crm/contacts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contactId = params.id

    // Get contact with profile data and relationships
    const { data: contact, error } = await supabase
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
        interactions:crm_interactions(
          id,
          type,
          subject,
          description,
          interaction_date,
          duration_minutes,
          outcome,
          created_at
        ),
        leads:crm_leads(
          id,
          title,
          stage,
          value_estimate,
          currency,
          probability,
          expected_close_date,
          created_at
        ),
        tasks:crm_tasks(
          id,
          title,
          type,
          priority,
          due_date,
          status,
          created_at
        ),
        business:businesses!business_id(
          id,
          name,
          profile_id
        )
      `)
      .eq('id', contactId)
      .single()

    if (error) {
      console.error('Error fetching contact:', error)
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Verify user has access to this contact (business owner or admin)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('account_type, metadata')
      .eq('id', user.id)
      .single()

    const isAdmin = userProfile?.account_type === 'admin' || 
                   userProfile?.metadata?.role === 'admin'

    if (!isAdmin && contact.business?.[0]?.profile_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Transform data to include computed fields
    const transformedContact = {
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
      interactions_count: contact.interactions?.length || 0,
      leads_count: contact.leads?.length || 0,
      tasks_count: contact.tasks?.length || 0
    }

    return NextResponse.json({ contact: transformedContact })

  } catch (error) {
    console.error('Error in contact detail API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contactId = params.id
    const updates = await request.json()

    // Remove read-only fields
    const { id, created_at, updated_at, profile, business, interactions, leads, tasks, ...updateData } = updates

    // Verify user has access to this contact
    const { data: contact } = await supabase
      .from('crm_contacts')
      .select(`
        business_id,
        business:businesses!business_id(profile_id)
      `)
      .eq('id', contactId)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('account_type, metadata')
      .eq('id', user.id)
      .single()

    const isAdmin = userProfile?.account_type === 'admin' || 
                   userProfile?.metadata?.role === 'admin'

    if (!isAdmin && contact.business?.[0]?.profile_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update contact
    const { data: updatedContact, error } = await supabase
      .from('crm_contacts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
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
      console.error('Error updating contact:', error)
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
    }

    return NextResponse.json({ contact: updatedContact })

  } catch (error) {
    console.error('Error in contact update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contactId = params.id

    // Verify user has access to this contact
    const { data: contact } = await supabase
      .from('crm_contacts')
      .select(`
        business_id,
        business:businesses!business_id(profile_id)
      `)
      .eq('id', contactId)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('account_type, metadata')
      .eq('id', user.id)
      .single()

    const isAdmin = userProfile?.account_type === 'admin' || 
                   userProfile?.metadata?.role === 'admin'

    if (!isAdmin && contact.business?.[0]?.profile_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete contact (this will cascade to related data if FK constraints are set up properly)
    const { error } = await supabase
      .from('crm_contacts')
      .delete()
      .eq('id', contactId)

    if (error) {
      console.error('Error deleting contact:', error)
      return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Contact deleted successfully' })

  } catch (error) {
    console.error('Error in contact delete API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}