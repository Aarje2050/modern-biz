// src/components/auth/SiteAwareRegisterForm.tsx - CLEAN ENTERPRISE VERSION
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUnifiedAuth, useSiteContext } from '@/providers/app-provider'
import { createClient } from '@/lib/supabase/client'

export default function SiteAwareRegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUnifiedAuth()
  const { siteConfig } = useSiteContext()
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Handle OAuth errors from callback
  const oauthError = searchParams.get('error')
  const oauthMessage = searchParams.get('message')

  useEffect(() => {
    if (oauthError) {
      console.log('🔐 OAuth Error detected:', {
        error: oauthError,
        message: oauthMessage
      })
      
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

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validateForm = () => {
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (!formData.fullName.trim()) {
      setError('Full name is required')
      return false
    }
    return true
  }

  // Google Sign-Up handler (CLEAN VERSION)
  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError('')

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error('Unable to connect to authentication service')
      }

      console.log('🔐 Google Register: Starting OAuth flow')

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
        console.error('❌ Google Register error:', authError)
        throw authError
      }

      console.log('✅ Google OAuth initiated successfully')
      // OAuth flow will redirect automatically

    } catch (err: any) {
      console.error('❌ Google Register error:', err)
      setError(err.message || 'Google sign-up failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  // Email registration handler (UNCHANGED - works fine)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) return
    
    setLoading(true)

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error('Unable to connect to authentication service')
      }

      console.log('🔐 Email Register: Creating account for:', formData.email)

      const { error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
          }
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          setError(authError.message)
        }
        return
      }

      console.log('✅ Email registration successful')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading if already authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Show success state for email registration
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border-t-4 border-green-500">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Account Created Successfully!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We've sent you a confirmation email. Please check your inbox and click the verification link to activate your account.
              </p>
              <div className="mt-6 space-y-4">
                <a
                  href="/login"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Sign In to Your Account
                </a>
                <a
                  href="/"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Return to Homepage
                </a>
              </div>
            </div>
          </div>
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
            Join {siteConfig?.name || 'BusinessDir'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Discover great businesses and connect with your community
          </p>
        </div>
      </div>

      {/* Register Form */}
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

          {/* GOOGLE SIGN-UP BUTTON (PRIMARY) */}
          <div className="mb-6">
            <button
              onClick={handleGoogleSignUp}
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
                  Creating account with Google...
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
              <span className="px-2 bg-white text-gray-500">Or create account with email</span>
            </div>
          </div>

          {/* EMAIL REGISTRATION FORM */}
          <form className="mt-6 space-y-6" onSubmit={handleEmailSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="Create a password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <a href="/terms" className="text-red-600 hover:text-red-500">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="/privacy" className="text-red-600 hover:text-red-500">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || googleLoading}
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
                    Creating Account...
                  </>
                ) : (
                  'Create account with email'
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="/login"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sign in to your account
              </a>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
              Why Join {siteConfig?.name}?
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Discover local businesses</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Write and read reviews</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Save favorite places</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Connect with community</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}