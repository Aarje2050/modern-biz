// src/app/api/auth/google-direct/route.ts - DIRECT GOOGLE CALLBACK
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
}

interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  id_token: string
  refresh_token?: string
  scope: string
  token_type: string
}

function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] Direct Google OAuth: ${message}`, data || '')
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const error = requestUrl.searchParams.get('error')

  debugLog('Direct Google OAuth callback received', {
    hasCode: !!code,
    hasState: !!state,
    hasError: !!error
  })

  // Handle OAuth error
  if (error) {
    debugLog('OAuth error from Google', { error })
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'google_oauth_error')
    errorUrl.searchParams.set('message', error)
    return NextResponse.redirect(errorUrl)
  }

  // Validate required parameters
  if (!code || !state) {
    debugLog('Missing required OAuth parameters')
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'invalid_oauth_response')
    return NextResponse.redirect(errorUrl)
  }

  try {
    // Step 1: Exchange authorization code for access token
    debugLog('Exchanging authorization code for tokens')
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${requestUrl.origin}/api/auth/google-direct`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      debugLog('Token exchange failed', { status: tokenResponse.status, error: errorData })
      throw new Error(`Token exchange failed: ${tokenResponse.status}`)
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()
    debugLog('Tokens received successfully', { hasAccessToken: !!tokens.access_token })

    // Step 2: Get user information from Google
    debugLog('Fetching user info from Google')
    
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      debugLog('User info fetch failed', { status: userResponse.status })
      throw new Error(`User info fetch failed: ${userResponse.status}`)
    }

    const googleUser: GoogleUserInfo = await userResponse.json()
    debugLog('Google user info received', {
      email: googleUser.email,
      name: googleUser.name,
      verified: googleUser.verified_email
    })

    // Step 3: Create or get user in Supabase
    debugLog('Creating Supabase session')
    
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

    // Check if user exists in auth.users
    const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserById(googleUser.id)
    
    let user
    if (getUserError || !existingUser.user) {
      debugLog('Creating new user in Supabase Auth')
      
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: googleUser.email,
        email_confirm: true,
        user_metadata: {
          full_name: googleUser.name,
          avatar_url: googleUser.picture,
          provider: 'google',
          google_id: googleUser.id
        }
      })

      if (createError) {
        debugLog('User creation failed', createError)
        throw createError
      }

      user = newUser.user
      debugLog('New user created successfully', { userId: user?.id?.substring(0, 8) + '...' })
    } else {
      user = existingUser.user
      debugLog('Existing user found', { userId: user?.id?.substring(0, 8) + '...' })
    }

    if (!user) {
      throw new Error('Failed to create or retrieve user')
    }

    // Step 4: Create session manually
    debugLog('Creating session for user')
    
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
      options: {
        redirectTo: `${requestUrl.origin}/dashboard`
      }
    })

    if (sessionError) {
      debugLog('Session creation failed', sessionError)
      throw sessionError
    }

    debugLog('Session created successfully')

    // Step 5: Update user profile
    debugLog('Updating user profile')
    
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: googleUser.email,
        full_name: googleUser.name,
        avatar_url: googleUser.picture,
        is_verified: true,
        provider: 'google',
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      debugLog('Profile update failed (non-critical)', profileError)
      // Don't block the flow for profile updates
    } else {
      debugLog('Profile updated successfully')
    }

    // Step 6: Redirect to success page
    const successUrl = new URL('/login', request.url)
    successUrl.searchParams.set('google_auth_success', 'true')
    successUrl.searchParams.set('email', googleUser.email)
    successUrl.searchParams.set('redirect_to', '/dashboard')

    debugLog('Direct Google OAuth completed successfully', {
      email: googleUser.email,
      redirectUrl: successUrl.toString()
    })

    return NextResponse.redirect(successUrl)

  } catch (error: any) {
    debugLog('Direct Google OAuth failed', {
      message: error.message,
      name: error.name
    })

    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'google_auth_failed')
    errorUrl.searchParams.set('message', error.message || 'Google authentication failed')
    return NextResponse.redirect(errorUrl)
  }
}