// src/app/api/auth/callback/route.ts - ENHANCED WITH SESSION REFRESH
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard'
  
  console.log('🔐 OAuth Callback: Processing request', {
    hasCode: !!code,
    redirectTo,
    origin: requestUrl.origin
  })

  if (code) {
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
    
    try {
      console.log('🔐 OAuth Callback: Exchanging code for session')
      
      // Exchange code for session
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('❌ OAuth Callback: Exchange error:', exchangeError)
        // Redirect to login with error
        const errorUrl = new URL('/login', request.url)
        errorUrl.searchParams.set('error', 'oauth_exchange_failed')
        return NextResponse.redirect(errorUrl)
      }

      console.log('✅ OAuth Callback: Session exchange successful')
      
      // Get the user after exchange - with retry for reliability
      let user = null
      let attempts = 0
      const maxAttempts = 3
      
      while (!user && attempts < maxAttempts) {
        attempts++
        console.log(`🔐 OAuth Callback: Getting user (attempt ${attempts})`)
        
        const { data: userData, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error(`❌ OAuth Callback: User fetch error (attempt ${attempts}):`, userError)
          if (attempts < maxAttempts) {
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 500))
            continue
          }
        } else {
          user = userData.user
        }
      }

      if (!user) {
        console.error('❌ OAuth Callback: No user found after session exchange')
        const errorUrl = new URL('/login', request.url)
        errorUrl.searchParams.set('error', 'user_not_found')
        return NextResponse.redirect(errorUrl)
      }

      console.log('✅ OAuth Callback: User authenticated:', {
        userId: user.id.substring(0, 8) + '...',
        email: user.email,
        provider: user.app_metadata?.provider
      })
      
      // Check if this is the first time user is verifying (new user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('id', user.id)
        .single()

      const isNewUser = !profile?.is_verified

      console.log('🔐 OAuth Callback: User profile check:', {
        hasProfile: !!profile,
        isNewUser,
        isVerified: profile?.is_verified
      })

      // Update verification status for new users
      if (isNewUser) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', user.id)
          
        if (updateError) {
          console.warn('⚠️ OAuth Callback: Profile update failed:', updateError)
          // Don't block auth flow for this
        } else {
          console.log('✅ OAuth Callback: Profile verification updated')
        }
      }
      
      // Send welcome email for new users - using dynamic import to avoid build issues
      if (isNewUser) {
        try {
          const { AuthEmailIntegrations } = await import('@/lib/email/integrations/auth')
          await AuthEmailIntegrations.sendWelcomeEmail(user.id)
          console.log(`✅ OAuth Callback: Welcome email sent to user: ${user.id}`)
        } catch (emailError) {
          console.error('⚠️ OAuth Callback: Welcome email failed:', emailError)
          // Don't block the auth flow if email fails
        }
      }
      
      // Check if user has any businesses
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('profile_id', user.id)
        .limit(1)
      
      console.log('🔐 OAuth Callback: Business check:', {
        hasBusinesses: !!(businesses && businesses.length > 0),
        businessCount: businesses?.length || 0
      })

      // ENHANCED: Build redirect URL with session refresh flag
      const finalRedirectUrl = new URL(redirectTo, request.url)
      
      // Add a session refresh flag to help frontend detect OAuth completion
      finalRedirectUrl.searchParams.set('auth_refresh', 'true')
      finalRedirectUrl.searchParams.set('auth_provider', user.app_metadata?.provider || 'unknown')
      
      // Redirect based on whether user has businesses
      if (businesses && businesses.length > 0) {
        console.log('✅ OAuth Callback: Redirecting business owner to dashboard')
        const dashboardUrl = new URL('/dashboard', request.url)
        dashboardUrl.searchParams.set('auth_refresh', 'true')
        dashboardUrl.searchParams.set('auth_provider', user.app_metadata?.provider || 'unknown')
        return NextResponse.redirect(dashboardUrl)
      } else {
        console.log('✅ OAuth Callback: Redirecting new user to:', finalRedirectUrl.toString())
        return NextResponse.redirect(finalRedirectUrl)
      }
      
    } catch (error) {
      console.error('❌ OAuth Callback: Unexpected error:', error)
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'oauth_callback_error')
      errorUrl.searchParams.set('details', error instanceof Error ? error.message : 'unknown')
      return NextResponse.redirect(errorUrl)
    }
  }

  // If no code or other errors, redirect to homepage with error
  console.error('❌ OAuth Callback: No authorization code received')
  const errorUrl = new URL('/login', request.url)
  errorUrl.searchParams.set('error', 'no_authorization_code')
  return NextResponse.redirect(errorUrl)
}