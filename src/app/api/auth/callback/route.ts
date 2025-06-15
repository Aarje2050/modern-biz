// src/app/api/auth/callback/route.ts - ENHANCED DEBUG VERSION
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Debug logging that works in production
function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] OAuth Callback: ${message}`
  
  // Always log to console
  console.log(logMessage, data || '')
  
  // In production, you can also log to a file or external service
  // For now, console.log will appear in your server logs
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  
  debugLog('OAuth callback initiated', {
    hasCode: !!code,
    hasError: !!error,
    redirectTo,
    origin: requestUrl.origin,
    fullUrl: requestUrl.toString()
  })

  // Handle OAuth errors from Google
  if (error) {
    debugLog('OAuth error from Google', { error, errorDescription })
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', `oauth_error_${error}`)
    errorUrl.searchParams.set('message', errorDescription || 'OAuth authorization failed')
    return NextResponse.redirect(errorUrl)
  }

  if (!code) {
    debugLog('No authorization code received')
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'no_auth_code')
    errorUrl.searchParams.set('message', 'No authorization code received from Google')
    return NextResponse.redirect(errorUrl)
  }

  debugLog('Authorization code received', { 
    codeLength: code.length,
    codePrefix: code.substring(0, 10) + '...'
  })

  try {
    const cookieStore = cookies()
    
    debugLog('Creating Supabase client')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            const value = cookieStore.get(name)?.value
            debugLog(`Cookie get: ${name}`, { hasValue: !!value })
            return value
          },
          set(name, value, options) {
            debugLog(`Cookie set: ${name}`, { 
              hasValue: !!value,
              options: options 
            })
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            debugLog(`Cookie remove: ${name}`)
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    debugLog('Exchanging code for session')
    
    // Exchange code for session
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      debugLog('Session exchange failed', { 
        error: exchangeError.message,
        status: exchangeError.status,
        name: exchangeError.name
      })
      
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'session_exchange_failed')
      errorUrl.searchParams.set('message', exchangeError.message)
      return NextResponse.redirect(errorUrl)
    }

    debugLog('Session exchange successful', {
      hasSession: !!sessionData.session,
      hasUser: !!sessionData.user,
      userId: sessionData.user?.id?.substring(0, 8) + '...',
      userEmail: sessionData.user?.email,
      provider: sessionData.user?.app_metadata?.provider
    })
    
    if (!sessionData.session || !sessionData.user) {
      debugLog('Session exchange returned no session or user')
      
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'no_session_created')
      errorUrl.searchParams.set('message', 'Session creation failed')
      return NextResponse.redirect(errorUrl)
    }

    const user = sessionData.user
    
    debugLog('Checking user profile')
    
    // Check if this is the first time user is verifying (new user)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 is "not found" error - acceptable for new users
      debugLog('Profile check error (non-critical)', profileError)
    }

    const isNewUser = !profile?.is_verified
    debugLog('User profile status', {
      hasProfile: !!profile,
      isNewUser,
      isVerified: profile?.is_verified
    })

    // Update verification status for new users
    if (isNewUser) {
      debugLog('Updating user verification status')
      
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          is_verified: true,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          updated_at: new Date().toISOString()
        })
        
      if (updateError) {
        debugLog('Profile update failed (non-critical)', updateError)
        // Don't block auth flow for this
      } else {
        debugLog('Profile verification updated successfully')
      }
    }
    
    // Send welcome email for new users
    if (isNewUser) {
      try {
        debugLog('Attempting to send welcome email')
        const { AuthEmailIntegrations } = await import('@/lib/email/integrations/auth')
        await AuthEmailIntegrations.sendWelcomeEmail(user.id)
        debugLog('Welcome email sent successfully')
      } catch (emailError: any) {
        debugLog('Welcome email failed (non-critical)', emailError.message)
        // Don't block the auth flow if email fails
      }
    }
    
    debugLog('Checking user businesses')
    
    // Check if user has any businesses
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('profile_id', user.id)
      .limit(1)
    
    if (businessError) {
      debugLog('Business check failed (non-critical)', businessError)
    }
    
    debugLog('Business check complete', {
      hasBusinesses: !!(businesses && businesses.length > 0),
      businessCount: businesses?.length || 0
    })

    // Build final redirect URL
    const finalRedirectUrl = businesses && businesses.length > 0 
      ? new URL('/dashboard', request.url)
      : new URL(redirectTo, request.url)
    
    // Add success parameters for frontend debugging
    finalRedirectUrl.searchParams.set('auth_success', 'true')
    finalRedirectUrl.searchParams.set('auth_provider', user.app_metadata?.provider || 'google')
    finalRedirectUrl.searchParams.set('auth_time', Date.now().toString())
    
    debugLog('OAuth callback successful - redirecting', {
      redirectUrl: finalRedirectUrl.toString(),
      hasBusinesses: !!(businesses && businesses.length > 0)
    })
    
    return NextResponse.redirect(finalRedirectUrl)
      
  } catch (error: any) {
    debugLog('OAuth callback unexpected error', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500)
    })
    
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'callback_exception')
    errorUrl.searchParams.set('message', error.message || 'Unexpected error during authentication')
    return NextResponse.redirect(errorUrl)
  }
}