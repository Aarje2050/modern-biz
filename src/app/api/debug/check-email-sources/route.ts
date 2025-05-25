// src/app/api/debug/check-email-sources/route.ts
// CREATE THIS NEW FILE
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const testUserId = searchParams.get('user_id') || user.id

    console.log(`Testing email sources for user: ${testUserId}`)

    const results: any = {
      user_id: testUserId,
      sources: {}
    }

    // Test 1: profiles_with_email view
    try {
      const { data, error } = await supabase
        .from('profiles_with_email')
        .select('*')
        .eq('id', testUserId)
        .single()
      
      results.sources.profiles_with_email = {
        available: !error,
        data: data || null,
        error: error?.message || null,
        has_email: !!data?.email
      }
    } catch (e: any) {
      results.sources.profiles_with_email = {
        available: false,
        error: e.message
      }
    }

    // Test 2: user_emails view  
    try {
      const { data, error } = await supabase
        .from('user_emails')
        .select('*')
        .eq('id', testUserId)
        .single()
      
      results.sources.user_emails = {
        available: !error,
        data: data || null,
        error: error?.message || null,
        has_email: !!data?.email
      }
    } catch (e: any) {
      results.sources.user_emails = {
        available: false,
        error: e.message
      }
    }

    // Test 3: profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single()
      
      results.sources.profiles = {
        available: !error,
        data: data || null,
        error: error?.message || null,
        has_name: !!(data?.full_name || data?.display_name)
      }
    } catch (e: any) {
      results.sources.profiles = {
        available: false,
        error: e.message
      }
    }

    // Test 4: contact_info table
    try {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .eq('profile_id', testUserId)
      
      const emailEntries = data?.filter(item => item.type === 'email') || []
      
      results.sources.contact_info = {
        available: !error,
        data: emailEntries,
        error: error?.message || null,
        email_count: emailEntries.length,
        has_primary_email: emailEntries.some(item => item.is_primary && item.value)
      }
    } catch (e: any) {
      results.sources.contact_info = {
        available: false,
        error: e.message
      }
    }

    // Summary and recommendation
    const hasEmail = results.sources.profiles_with_email?.has_email ||
                     results.sources.user_emails?.has_email ||
                     results.sources.contact_info?.has_primary_email

    results.summary = {
      can_get_real_email: hasEmail,
      best_source: hasEmail ? 
        (results.sources.profiles_with_email?.has_email ? 'profiles_with_email' :
         results.sources.user_emails?.has_email ? 'user_emails' : 'contact_info') : 
        'none',
      recommendation: hasEmail ? 
        '✅ Email available! Your contacts should get real emails.' :
        '❌ No email found. Check your database setup or views.'
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}