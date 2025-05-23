// src/app/api/notifications/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/notifications/preferences - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('profile_id', session.user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      const defaultPreferences = {
        profile_id: session.user.id,
        email_notifications: {
          message_received: true,
          review_posted: true,
          business_approved: true,
          business_rejected: true,
          review_response: true,
          marketing: false
        },
        push_notifications: {
          message_received: true,
          review_posted: true,
          business_approved: true,
          business_rejected: true,
          review_response: true
        },
        in_app_notifications: {
          message_received: true,
          review_posted: true,
          business_approved: true,
          business_rejected: true,
          review_response: true
        },
        quiet_hours_start: null,
        quiet_hours_end: null,
        timezone: 'UTC'
      }

      return NextResponse.json({ preferences: defaultPreferences })
    }

    return NextResponse.json({ preferences })

  } catch (error) {
    console.error('Get preferences API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/notifications/preferences - Update user's notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      email_notifications,
      push_notifications,
      in_app_notifications,
      quiet_hours_start,
      quiet_hours_end,
      timezone
    } = body

    // Validate quiet hours format if provided
    if (quiet_hours_start && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quiet_hours_start)) {
      return NextResponse.json({ error: 'Invalid quiet hours start format' }, { status: 400 })
    }
    
    if (quiet_hours_end && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(quiet_hours_end)) {
      return NextResponse.json({ error: 'Invalid quiet hours end format' }, { status: 400 })
    }

    // Check if preferences exist
    const { data: existingPrefs } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('profile_id', session.user.id)
      .single()

    const updateData = {
      profile_id: session.user.id,
      ...(email_notifications && { email_notifications }),
      ...(push_notifications && { push_notifications }),
      ...(in_app_notifications && { in_app_notifications }),
      ...(quiet_hours_start !== undefined && { quiet_hours_start }),
      ...(quiet_hours_end !== undefined && { quiet_hours_end }),
      ...(timezone && { timezone }),
      updated_at: new Date().toISOString()
    }

    let result
    if (existingPrefs) {
      // Update existing preferences
      result = await supabase
        .from('user_preferences')
        .update(updateData)
        .eq('profile_id', session.user.id)
        .select()
        .single()
    } else {
      // Create new preferences
      result = await supabase
        .from('user_preferences')
        .insert(updateData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error updating preferences:', result.error)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences: result.data })

  } catch (error) {
    console.error('Update preferences API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}