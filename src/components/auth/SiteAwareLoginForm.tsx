'use client'
import { useState } from 'react'
import { useSiteAuth } from '@/providers/SiteAwareAuthProvider'
import { useSiteContext } from '@/hooks/useSiteContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SiteAwareLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signInToSite } = useSiteAuth()
  const { siteConfig } = useSiteContext()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signInError } = await signInToSite(email, password)

    if (signInError) {
      setError(signInError)
      setLoading(false)
    } else {
      // Redirect based on site type
      if (siteConfig?.site_type === 'directory') {
        router.push('/dashboard')
      } else {
        router.push('/')
      }
    }
  }

  const siteName = siteConfig?.name || 'Website'
  const primaryColor = siteConfig?.config?.theme?.primaryColor || '#2563eb'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to {siteName}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your account on this site
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:ring-offset-2 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:z-10 sm:text-sm"
                // style={{ focusRingColor: primaryColor }}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {siteConfig?.site_type === 'directory' && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/register"
                  className="font-medium hover:underline"
                  style={{ color: primaryColor }}
                >
                  Sign up here
                </Link>
              </p>
            </div>
          )}
        </form>
        
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to {siteName}
          </Link>
        </div>
      </div>
    </div>
  )
}