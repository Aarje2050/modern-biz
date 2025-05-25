// src/app/api/crm/integration/sync-directory-data/route.ts
// REPLACE YOUR ENTIRE FILE WITH THIS PERMANENT SOLUTION

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'         // For auth verification
import { createServiceClient } from '@/lib/supabase/service'  // For data operations

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

    // Get email from auth.users using SERVICE ROLE (this will work!)
    const { data: authUser, error: authError } = await serviceSupabase.auth.admin.getUserById(profileId)
    
    if (authUser?.user?.email && !authError) {
      email = authUser.user.email
      console.log(`✅ SUCCESS: Found real email ${email} for ${firstName} ${lastName}`)
      return { firstName, lastName, email, method: 'service_role_auth', success: true }
    } else {
      console.log(`⚠️ WARNING: No email found in auth.users for ${profileId}`)
      console.log('Auth error:', authError)
    }

  } catch (err) {
    console.error(`❌ ERROR: Failed to get user data for ${profileId}:`, err)
  }

  return { firstName, lastName, email, method: 'fallback', success: false }
}

export async function POST(request: NextRequest) {
  try {
    // Use regular client for auth verification
    const authSupabase = createClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { business_id } = await request.json()
    if (!business_id) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    // Verify business ownership using regular client
    const { data: businessAccess } = await authSupabase
      .from('businesses')
      .select('id')
      .eq('id', business_id)
      .eq('profile_id', user.id)
      .single()

    if (!businessAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // NOW use service client for data operations
    const serviceSupabase = createServiceClient()

    const results = {
      reviews_processed: 0,
      contacts_created: 0,
      duplicates_skipped: 0,
      real_emails_found: 0,
      placeholder_emails: 0,
      errors: [] as string[],
      sample_contacts: [] as any[]
    }

    console.log(`🚀 Starting sync for business: ${business_id}`)
    console.log('💡 Using SERVICE ROLE client for data access')

    // Get reviews using SERVICE CLIENT
    const { data: reviewsData, error: reviewsError } = await serviceSupabase
      .from('reviews')
      .select('id, profile_id, rating, title, content, created_at')
      .eq('business_id', business_id)

    if (reviewsError) {
      console.error('❌ Error fetching reviews:', reviewsError)
      return NextResponse.json({ error: reviewsError.message }, { status: 500 })
    }

    console.log(`📋 Found ${reviewsData?.length || 0} reviews to process`)

    if (reviewsData && reviewsData.length > 0) {
      for (const review of reviewsData) {
        results.reviews_processed++
        
        if (!review.profile_id) {
          console.log(`⏭️ Skipping review ${review.id} - no profile_id`)
          continue
        }

        // Check if contact already exists
        const { data: existingContact } = await serviceSupabase
          .from('crm_contacts')
          .select('id')
          .eq('business_id', business_id)
          .eq('profile_id', review.profile_id)
          .single()

        if (existingContact) {
          results.duplicates_skipped++
          continue
        }

        // Get user data with REAL email using SERVICE ROLE
        const userData = await getUserDataWithServiceRole(serviceSupabase, review.profile_id)

        // Track email quality
        if (userData.success && !userData.email.includes('@platform.local')) {
          results.real_emails_found++
        } else {
          results.placeholder_emails++
        }

        // Create contact using SERVICE CLIENT
        try {
          const { data: contact, error: contactError } = await serviceSupabase
            .from('crm_contacts')
            .insert({
              business_id,
              profile_id: review.profile_id,
              first_name: userData.firstName,
              last_name: userData.lastName,
              email: userData.email,
              source: 'review_sync',
              lifecycle_stage: 'customer',
              notes: `Customer who left a ${review.rating}-star review. Data from: ${userData.method}`,
              created_by: user.id
            })
            .select('id, first_name, last_name, email')
            .single()

          if (!contactError && contact) {
            results.contacts_created++
            
            // Add sample for verification
            if (results.sample_contacts.length < 3) {
              results.sample_contacts.push({
                name: `${contact.first_name} ${contact.last_name}`,
                email: contact.email,
                real_email: !contact.email.includes('@platform.local'),
                method: userData.method
              })
            }

            console.log(`✅ Created contact: ${contact.first_name} ${contact.last_name} (${contact.email})`)
          } else {
            console.error(`❌ Failed to create contact for review ${review.id}:`, contactError)
            results.errors.push(`Failed to create contact for review ${review.id}: ${contactError?.message}`)
          }
        } catch (createErr: any) {
          console.error(`❌ Error creating contact for review ${review.id}:`, createErr)
          results.errors.push(`Error creating contact for review ${review.id}: ${createErr.message}`)
        }
      }
    }

    // Final results
    const successMessage = results.real_emails_found > 0 ? 
      `🎉 SUCCESS! Found ${results.real_emails_found} real emails out of ${results.contacts_created} contacts!` :
      `⚠️ No real emails found. All ${results.placeholder_emails} contacts have placeholder emails. Check your auth.users table.`

    console.log('📊 Sync completed:', results)

    return NextResponse.json({ 
      message: 'Sync completed',
      results,
      email_status: successMessage,
      summary: {
        total_contacts_created: results.contacts_created,
        real_emails: results.real_emails_found,
        placeholder_emails: results.placeholder_emails,
        success_rate: results.contacts_created > 0 ? 
          Math.round((results.real_emails_found / results.contacts_created) * 100) + '%' : '0%'
      },
      sample_contacts: results.sample_contacts,
      lesson: "Using SERVICE ROLE client to access auth.users table"
    })

  } catch (error) {
    console.error('❌ Sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}