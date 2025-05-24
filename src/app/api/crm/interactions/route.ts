// src/app/api/crm/interactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      contact_id,
      business_id,
      type,
      subject,
      description,
      interaction_date = new Date().toISOString(),
      duration_minutes,
      outcome
    } = body

    if (!contact_id || !business_id || !type || !subject) {
      return NextResponse.json({ 
        error: 'Contact ID, business ID, type, and subject are required' 
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

    // Create interaction
    const { data: interaction, error } = await supabase
      .from('crm_interactions')
      .insert({
        contact_id,
        business_id,
        type,
        subject,
        description,
        interaction_date,
        duration_minutes,
        outcome,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating interaction:', error)
      return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 })
    }

    // Update contact's last_contact_date
    await supabase
      .from('crm_contacts')
      .update({ 
        last_contact_date: interaction_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', contact_id)

    return NextResponse.json({ interaction }, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
