// src/components/auth/SiteAwareLoginForm.tsx - CLEAN VERSION (NO OAUTH PARAMS)
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUnifiedAuth, useSiteContext } from '@/providers/app-provider'
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
  const [showRedirectButton, setShowRedirectButton] = useState(false)

  const redirectTo = searchParams.get('redirect_to') || '/dashboard'
  const oauthError = searchParams.get('error')
  const oauthMessage = searchParams.get('message')
  
  const redirectedRef = useRef(false)

  // Handle OAuth errors from callback (keep this for error handling)
  useEffect(() => {
    if (oauthError) {
      console.log('🔐 OAuth Error detected:', { error: oauthError, message: oauthMessage })
      
      const errorMessages: Record<string, string> = {
        'oauth_failed': `OAuth authentication failed: ${oauthMessage}`,
        'session_failed': `Session creation failed: ${oauthMessage}`,
        'no_session': 'Authentication completed but session not created',
        'callback_exception': `Authentication error: ${oauthMessage}`,
        'invalid_callback': 'Invalid authentication callback'
      }
      
      setError(errorMessages[oauthError] || oauthMessage || 'Authentication failed')
      
      // Clean up URL
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('error')
      cleanUrl.searchParams.delete('message')
      window.history.replaceState({}, '', cleanUrl.toString())
    }
  }, [oauthError, oauthMessage])

  // Show redirect button when user is authenticated
  useEffect(() => {
    if (user && !authLoading && !loading && !googleLoading && !redirectedRef.current) {
      console.log('🔄 Login: User authenticated, showing redirect option')
      setShowRedirectButton(true)
    }
  }, [user, authLoading, loading, googleLoading])

  // Manual redirect function
  const handleRedirect = () => {
    if (user && !redirectedRef.current) {
      console.log('🔄 Login: Manual redirect to:', redirectTo)
      redirectedRef.current = true
      router.push(redirectTo)
    }
  }

  // Google Sign-In - Simple OAuth initiation
  const handleGoogleSignIn = async () => {
    if (googleLoading) return
    
    setGoogleLoading(true)
    setError('')

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error('Unable to connect to authentication service')
      }

      console.log('🔐 Starting Google OAuth - will redirect to dashboard after completion')

      const { error: authError } = await supabase.auth.signInWithOAuth({
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

      console.log('✅ Google OAuth initiated - user will be redirected to Google')
      // User will be redirected to Google, then callback will handle the rest

    } catch (err: any) {
      console.error('❌ Google OAuth failed:', err)
      setError(err.message || 'Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  // Email login handler (unchanged - works fine)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

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

  // Show success state when user is authenticated
  if (showRedirectButton && user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Welcome back!</h3>
          <p className="mt-2 text-sm text-gray-600">
            You're successfully signed in as <strong>{user.email}</strong>
          </p>
          <div className="mt-6 space-y-3">
            <button
              onClick={handleRedirect}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Continue to Dashboard →
            </button>
            <a
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Go to Homepage
            </a>
          </div>
        </div>
      </div>
    )
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

          {/* GOOGLE SIGN-IN BUTTON */}
          <div className="mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {googleLoading ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  Redirecting to Google...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

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