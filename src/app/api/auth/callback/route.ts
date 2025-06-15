// src/app/api/auth/callback/route.ts - FIXED SESSION SYNC VERSION
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  
  console.log('🔐 OAuth Callback:', {
    hasCode: !!code,
    hasError: !!error,
    url: request.url
  })

  // Handle OAuth errors
  if (error) {
    console.error('❌ OAuth Error:', error, errorDescription)
    const errorUrl = new URL('/login', requestUrl.origin)
    errorUrl.searchParams.set('error', 'oauth_failed')
    errorUrl.searchParams.set('message', errorDescription || 'OAuth authentication failed')
    return NextResponse.redirect(errorUrl)
  }

  // Handle OAuth success
  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name) {
              return cookieStore.get(name)?.value
            },
            set(name, value, options) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name, options) {
              cookieStore.set({ name, value: '', ...options })
            },
          },
        }
      )

      // Exchange code for session
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('❌ Session exchange failed:', sessionError)
        const errorUrl = new URL('/login', requestUrl.origin)
        errorUrl.searchParams.set('error', 'session_failed')
        errorUrl.searchParams.set('message', sessionError.message)
        return NextResponse.redirect(errorUrl)
      }

      if (!sessionData.session || !sessionData.user) {
        console.error('❌ No session/user after exchange')
        const errorUrl = new URL('/login', requestUrl.origin)
        errorUrl.searchParams.set('error', 'no_session')
        errorUrl.searchParams.set('message', 'Authentication completed but session not created')
        return NextResponse.redirect(errorUrl)
      }

      console.log('✅ OAuth Success:', {
        userId: sessionData.user.id,
        email: sessionData.user.email,
        provider: sessionData.user.app_metadata?.provider
      })

      // Create/update profile with proper schema
      try {
        // Get the user's display name from various sources
        const displayName = sessionData.user.user_metadata?.full_name || 
                           sessionData.user.user_metadata?.name || 
                           sessionData.user.email?.split('@')[0] || 
                           'User'

        
        // First, check if user already exists
const { data: existingProfile } = await supabase
.from('profiles')
.select('account_type')
.eq('id', sessionData.user.id)
.single()

// Use existing account_type or default to 'standard' for new users
const accountType = existingProfile?.account_type || 'standard'

                           // FIXED: Use correct profile schema (no email column)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: sessionData.user.id,
            full_name: displayName,
            avatar_url: sessionData.user.user_metadata?.avatar_url || null,
            account_type: accountType, // Preserve existing or set default
            metadata: {
              oauth_provider: sessionData.user.app_metadata?.provider,
              created_via: 'oauth',
              google_data: sessionData.user.user_metadata
            },
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id',
            ignoreDuplicates: false // Update existing profiles
          })

        if (profileError && !profileError.message.includes('duplicate')) {
          console.warn('⚠️ Profile creation warning:', profileError)
        } else {
          console.log('✅ Profile created/updated successfully')
        }
      } catch (profileErr) {
        console.warn('⚠️ Profile creation failed (non-critical):', profileErr)
      }

      // IMPORTANT: Instead of direct redirect, use a special auth success page
      // that will handle client-side session sync
      const successUrl = new URL('/login', requestUrl.origin)
      successUrl.searchParams.set('oauth_success', 'true')
      successUrl.searchParams.set('session_token', sessionData.session.access_token.substring(0, 20)) // Partial token for verification
      
      console.log('🎉 Redirecting to login with OAuth success flag')
      return NextResponse.redirect(successUrl)

    } catch (error: any) {
      console.error('❌ OAuth Callback Exception:', error)
      const errorUrl = new URL('/login', requestUrl.origin)
      errorUrl.searchParams.set('error', 'callback_exception')
      errorUrl.searchParams.set('message', error.message || 'Authentication failed')
      return NextResponse.redirect(errorUrl)
    }
  }

  // No code, no error - something's wrong
  console.error('❌ OAuth Callback: No code or error parameter')
  const errorUrl = new URL('/login', requestUrl.origin)
  errorUrl.searchParams.set('error', 'invalid_callback')
  errorUrl.searchParams.set('message', 'Invalid authentication callback')
  return NextResponse.redirect(errorUrl)
}