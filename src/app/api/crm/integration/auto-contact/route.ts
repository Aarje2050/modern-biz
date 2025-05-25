// src/app/api/crm/integration/auto-contact/route.ts
// REPLACE YOUR EXISTING AUTO-CONTACT ROUTE

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Simple function to get real user data using SERVICE ROLE
async function getUserDataWithServiceRole(serviceSupabase: any, profileId: string) {
  let firstName = 'Customer'
  let lastName = ''
  let email = `user-${profileId.substring(0, 8)}@platform.local`

  try {
    // Get name from profiles table
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('full_name, display_name')
      .eq('id', profileId)
      .single()

    if (profile?.full_name) {
      const nameParts = profile.full_name.trim().split(' ')
      firstName = nameParts[0] || 'Customer'
      lastName = nameParts.slice(1).join(' ') || ''
    }

    // Get email from auth.users using SERVICE ROLE
    const { data: authUser, error: authError } = await serviceSupabase.auth.admin.getUserById(profileId)
    
    if (authUser?.user?.email && !authError) {
      email = authUser.user.email
      return { firstName, lastName, email, success: true }
    }

  } catch (err) {
    console.error(`Error getting user data for ${profileId}:`, err)
  }

  return { firstName, lastName, email, success: false }
}

export async function POST(request: NextRequest) {
  try {
    const serviceSupabase = createServiceClient()
    const { business_id, profile_id, rating, title, content } = await request.json()

    if (!business_id || !profile_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log(`🔄 Auto-creating contact for review by ${profile_id}`)

    // Check if contact already exists
    const { data: existingContact } = await serviceSupabase
      .from('crm_contacts')
      .select('id, email')
      .eq('business_id', business_id)
      .eq('profile_id', profile_id)
      .single()

    if (existingContact) {
      console.log(`✅ Contact already exists: ${existingContact.id}`)
      return NextResponse.json({ 
        success: true, 
        message: 'Contact already exists',
        contact_id: existingContact.id,
        email: existingContact.email
      })
    }

    // Get user data with real email
    const userData = await getUserDataWithServiceRole(serviceSupabase, profile_id)

    // Create contact
    const { data: contact, error: createError } = await serviceSupabase
      .from('crm_contacts')
      .insert({
        business_id,
        profile_id,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        source: 'review',
        lifecycle_stage: 'customer', // They just used the service
        notes: `Customer who left a ${rating}-star review: "${title || content?.substring(0, 50) || 'Review'}"`,
        created_by: profile_id // Self-created
      })
      .select('id, first_name, last_name, email')
      .single()

    if (createError) {
      console.error('❌ Error creating contact:', createError)
      // Don't fail the review if contact creation fails
      return NextResponse.json({ 
        success: false, 
        error: 'Contact creation failed',
        continue_review: true // Tell caller to continue with review anyway
      })
    }

    console.log(`✅ Created contact: ${contact.first_name} ${contact.last_name} (${contact.email})`)

    // Optional: Create interaction record
    await serviceSupabase
      .from('crm_interactions')
      .insert({
        contact_id: contact.id,
        business_id,
        type: 'review',
        subject: `Review: ${rating} stars`,
        description: content || title || 'Customer review',
        interaction_date: new Date().toISOString(),
        created_by: profile_id
      })

    return NextResponse.json({ 
      success: true, 
      contact_created: true,
      contact: {
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`,
        email: contact.email,
        real_email: userData.success
      }
    })

  } catch (error) {
    console.error('❌ Auto contact creation error:', error)
    // Don't fail the review if contact creation fails
    return NextResponse.json({ 
      success: false, 
      error: 'Internal error',
      continue_review: true
    })
  }
}