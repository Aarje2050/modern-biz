// src/app/api/crm/integration/contact-from-review/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper function to get comprehensive user data
async function getUserData(supabase: any, profileId: string) {
  let firstName = 'Customer'
  let lastName = ''
  let email = `user-${profileId.substring(0, 8)}@platform.local`
  let displayName = 'Customer'

  try {
    // Method 1: Try to get from profiles table first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, avatar_url, account_type')
      .eq('id', profileId)
      .single()

    if (profile && !profileError) {
      if (profile.full_name) {
        const nameParts = profile.full_name.trim().split(' ')
        firstName = nameParts[0] || 'Customer'
        lastName = nameParts.slice(1).join(' ') || ''
        displayName = profile.full_name
      } else if (profile.display_name) {
        const nameParts = profile.display_name.trim().split(' ')
        firstName = nameParts[0] || 'Customer'
        lastName = nameParts.slice(1).join(' ') || ''
        displayName = profile.display_name
      }
    }

    // Method 2: Try to get email from auth.users
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profileId)
      
      if (authUser?.user?.email && !authError) {
        email = authUser.user.email
        
        // If we don't have name from profiles, try to get from auth metadata
        if (firstName === 'Customer' && authUser.user.user_metadata) {
          const metadata = authUser.user.user_metadata
          if (metadata.full_name) {
            const nameParts = metadata.full_name.trim().split(' ')
            firstName = nameParts[0] || 'Customer'
            lastName = nameParts.slice(1).join(' ') || ''
            displayName = metadata.full_name
          } else if (metadata.name) {
            const nameParts = metadata.name.trim().split(' ')
            firstName = nameParts[0] || 'Customer'
            lastName = nameParts.slice(1).join(' ') || ''
            displayName = metadata.name
          } else if (metadata.first_name || metadata.last_name) {
            firstName = metadata.first_name || 'Customer'
            lastName = metadata.last_name || ''
            displayName = `${firstName} ${lastName}`.trim()
          }
        }
      }
    } catch (authErr) {
      console.warn(`Could not fetch auth user data for ${profileId}:`, authErr)
    }

    // Method 3: If we still don't have email, try contact_info table
    if (email.includes('@platform.local')) {
      try {
        const { data: contactInfo } = await supabase
          .from('contact_info')
          .select('value')
          .eq('profile_id', profileId)
          .eq('type', 'email')
          .eq('is_primary', true)
          .single()

        if (contactInfo?.value) {
          email = contactInfo.value
        }
      } catch (contactErr) {
        console.warn(`Could not fetch contact info for ${profileId}:`, contactErr)
      }
    }

  } catch (err) {
    console.error(`Error fetching user data for ${profileId}:`, err)
  }

  return { firstName, lastName, email, displayName }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { review_id, business_id } = await request.json()

    if (!review_id || !business_id) {
      return NextResponse.json({ 
        error: 'Review ID and business ID required' 
      }, { status: 400 })
    }

    // Verify business ownership
    const { data: businessAccess } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', business_id)
      .eq('profile_id', user.id)
      .single()

    if (!businessAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get review details
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', review_id)
      .eq('business_id', business_id)
      .single()

    if (reviewError || !review) {
      console.error('Error fetching review:', reviewError)
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (!review.profile_id) {
      return NextResponse.json({ error: 'Review has no associated user' }, { status: 404 })
    }

    // Check if contact already exists
    const { data: existingContact } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('business_id', business_id)
      .eq('profile_id', review.profile_id)
      .single()

    if (existingContact) {
      return NextResponse.json({ 
        message: 'Contact already exists',
        contact_id: existingContact.id 
      })
    }

    // Get comprehensive user data
    const userData = await getUserData(supabase, review.profile_id)
    
    console.log(`Creating contact from review ${review_id}:`, userData)

    // Create contact from review
    const { data: contact, error: contactError } = await supabase
      .from('crm_contacts')
      .insert({
        business_id,
        profile_id: review.profile_id,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        source: 'review',
        source_details: {
          review_id: review.id,
          review_rating: review.rating,
          review_date: review.created_at
        },
        lifecycle_stage: 'customer', // They've already used the service
        notes: `Customer who left a ${review.rating}-star review: "${review.title || review.content}"`,
        created_by: user.id
      })
      .select()
      .single()

    if (contactError) {
      console.error('Error creating contact:', contactError)
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
    }

    // Create interaction record
    await supabase
      .from('crm_interactions')
      .insert({
        contact_id: contact.id,
        business_id,
        type: 'review',
        subject: `Review: ${review.rating} stars`,
        description: review.content || review.title || 'Customer review',
        interaction_date: review.created_at,
        external_id: review.id,
        external_metadata: {
          rating: review.rating,
          title: review.title,
          helpful_count: review.helpful_count || 0
        },
        created_by: user.id
      })

    return NextResponse.json({ 
      contact,
      message: 'Contact created from review successfully',
      debug: userData // Remove this in production
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}