// src/components/auth/SiteAwareLoginForm.tsx - WITH OAUTH DEBUG INFO
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useSiteContext, useUnifiedAuth } from '@/providers/app-provider'
import { createClient } from '@/lib/supabase/client'

export default function SiteAwareLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useUnifiedAuth()
  const { siteConfig } = useSiteContext()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const redirectTo = searchParams.get('redirect_to') || '/dashboard'
  const authSuccess = searchParams.get('auth_success')
  const authProvider = searchParams.get('auth_provider')
  const userEmail = searchParams.get('user_email')
  const oauthError = searchParams.get('error')
  const oauthMessage = searchParams.get('message')
  
  // Refs to prevent multiple redirects
  const redirectedRef = useRef(false)

  // Handle OAuth success
  // In your SiteAwareLoginForm.tsx, replace the OAuth success useEffect:

useEffect(() => {
  if (authSuccess) {
    console.log('🔐 OAuth Success detected:', {
      provider: authProvider,
      email: userEmail
    })
    
    setSuccessMessage(`OAuth successful with ${authProvider}! Email: ${userEmail}`)
    
    // FORCE SESSION REFRESH TO GET COOKIES
    const refreshSession = async () => {
      try {
        console.log('🔄 Forcing session refresh to sync cookies...')
        const supabase = createClient()
        if (!supabase) {
          throw new Error('Supabase client is not initialized')
        }
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('🔍 Session after refresh:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email
        })
        
        if (session?.user) {
          console.log('✅ Session refreshed successfully, redirecting...')
          setTimeout(() => {
            window.location.href = redirectTo
          }, 1000)
        } else {
          console.log('❌ Session refresh failed')
          setError('Session sync failed. Please try signing in again.')
        }
      } catch (err) {
        console.error('❌ Session refresh error:', err)
        setError('Session sync failed. Please try signing in again.')
      }
    }
    
    refreshSession()
    return
  }
}, [authSuccess, authProvider, userEmail, redirectTo])


// Add this to your login form - handle OAuth code on frontend

useEffect(() => {
  const oauthCode = searchParams.get('oauth_code')
  
  if (oauthCode) {
    console.log('🔐 OAuth code detected, creating session on frontend...')
    
    const createSession = async () => {
      try {
        const supabase = createClient()
        if (!supabase) {
          throw new Error('Supabase client is not initialized')
        }
        const { data, error } = await supabase.auth.exchangeCodeForSession(oauthCode)
        
        if (error) {
          console.error('❌ Frontend session creation failed:', error)
          setError('Session creation failed: ' + error.message)
          return
        }
        
        if (data.session?.user) {
          console.log('✅ Frontend session created successfully:', data.session.user.email)
          
          // Clean URL and redirect
          const cleanUrl = new URL(window.location.href)
          cleanUrl.searchParams.delete('oauth_code')
          
          setTimeout(() => {
            window.location.href = redirectTo
          }, 500)
        }
      } catch (err: any) {
        console.error('❌ Frontend session error:', err)
        setError('Session creation failed: ' + err.message)
      }
    }
    
    createSession()
  }
}, [searchParams, redirectTo])

// Add this to your login form
useEffect(() => {
  const oauthSuccess = searchParams.get('oauth_success')
  const refreshNeeded = searchParams.get('refresh_needed')
  
  if (oauthSuccess && refreshNeeded) {
    console.log('🔄 OAuth completed - forcing page refresh to sync cookies')
    
    // Remove parameters and force complete page reload
    const cleanUrl = window.location.origin + '/dashboard'
    window.location.replace(cleanUrl)
  }
}, [searchParams])

  // Handle OAuth errors
  useEffect(() => {
    if (oauthError) {
      console.log('🔐 OAuth Error detected:', {
        error: oauthError,
        message: oauthMessage
      })
      
      const errorMessages: Record<string, string> = {
        'oauth_provider_error': `OAuth provider error: ${oauthMessage}`,
        'no_auth_code': 'No authorization code received from OAuth provider',
        'session_exchange_failed': `Session creation failed: ${oauthMessage}`,
        'get_user_failed': `User retrieval failed: ${oauthMessage}`,
        'no_user_after_exchange': 'Session created but user not found',
        'callback_exception': `Authentication error: ${oauthMessage}`
      }
      
      setError(errorMessages[oauthError] || oauthMessage || 'OAuth authentication failed')
      
      // Clean up URL
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('error')
      cleanUrl.searchParams.delete('message')
      window.history.replaceState({}, '', cleanUrl.toString())
    }
  }, [oauthError, oauthMessage])

  // Handle regular user redirect
  useEffect(() => {
    if (user && !authLoading && !loading && !googleLoading && !redirectedRef.current && !authSuccess) {
      console.log('🔄 Login: User authenticated, redirecting to:', redirectTo)
      redirectedRef.current = true
      
      setTimeout(() => {
        window.location.href = redirectTo
      }, 100)
    }
  }, [user, authLoading, loading, googleLoading, redirectTo, authSuccess])

  // Show OAuth success state
  if (authSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">OAuth Successful!</h3>
          <p className="mt-2 text-sm text-gray-600">{successMessage}</p>
          <p className="mt-1 text-xs text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  // Show loading if already authenticated
  if (user && !authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  // Google Sign-In handler
  const handleGoogleSignIn = async () => {
    if (googleLoading) return
    
    setGoogleLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error('Unable to connect to authentication service')
      }

      console.log('🔐 Starting Google OAuth via Supabase')

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (authError) {
        console.error('❌ Google OAuth initiation error:', authError)
        throw authError
      }

      console.log('✅ Google OAuth initiated successfully')
      // OAuth flow will redirect automatically

    } catch (err: any) {
      console.error('❌ Google OAuth failed:', err)
      setError(err.message || 'Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  // Email login handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error('Unable to connect to authentication service')
      }

      console.log('🔐 Email Login: Attempting login for:', email)

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        console.error('❌ Email Login error:', authError)
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.')
        } else {
          setError(authError.message)
        }
        return
      }

      if (data.session && data.user) {
        console.log('✅ Email Login successful, user:', data.user.email)
      } else {
        setError('Login failed - please try again')
      }
    } catch (err: any) {
      console.error('❌ Email Login error:', err)
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show form loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {siteConfig?.config?.theme?.primaryColor ? (
            <div 
              className="mx-auto h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: siteConfig.config.theme.primaryColor }}
            >
              {siteConfig.name.charAt(0)}
            </div>
          ) : (
            <div className="mx-auto h-12 w-12 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              B
            </div>
          )}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome back to {siteConfig?.name || 'BusinessDir'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage your business and connect with customers
          </p>
        </div>
      </div>

      {/* Login Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border-t-4 border-red-600">
          
          {/* SUCCESS MESSAGE */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* ERROR DISPLAY */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* DEBUG INFO (Development Only) */}
          {process.env.NODE_ENV === 'development' && (authSuccess || oauthError) && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Debug Info:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Current URL: {window.location.href}</div>
                <div>Auth Success: {authSuccess || 'false'}</div>
                <div>Auth Provider: {authProvider || 'none'}</div>
                <div>User Email: {userEmail || 'none'}</div>
                <div>OAuth Error: {oauthError || 'none'}</div>
                <div>Error Message: {oauthMessage || 'none'}</div>
              </div>
            </div>
          )}

        

          {/* DIVIDER */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* EMAIL LOGIN FORM */}
          <form className="mt-6 space-y-6" onSubmit={handleEmailSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="/forgot-password" className="font-medium text-red-600 hover:text-red-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || googleLoading || !email || !password}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-white">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    Signing in...
                  </>
                ) : (
                  'Sign in with email'
                )}
              </button>
            </div>
          </form>

          {/* Register Link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to {siteConfig?.name}?</span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="/register"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Create your account
              </a>
            </div>
          </div>
        </div>

        {/* Business Owner CTA */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Business Owner?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Get more customers by listing your business on {siteConfig?.name}
            </p>
            <a
              href="/businesses/add"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
            >
              List Your Business
              <svg className="ml-2 -mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}