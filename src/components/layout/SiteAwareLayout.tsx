// src/components/layout/SiteAwareLayout.tsx (MINIMAL FIX - Keep your existing code)
'use client'
import { useSiteContext } from '@/hooks/useSiteContext'
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react' // ADD THIS
import Link from 'next/link'
import Header from '@/components/layout/header'

// ADD THIS: Safe hook wrapper to prevent provider errors
function useSafeAuth() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  try {
    const auth = useUnifiedAuth()
    return mounted ? auth : { user: null, isAuthenticated: false, signOut: async () => {}, loading: true }
  } catch (error) {
    // Fallback if provider not available
    return { user: null, isAuthenticated: false, signOut: async () => {}, loading: false }
  }
}

// Directory header (your existing header functionality) - ONLY CHANGED: useSiteAuth → useSafeAuth
function DirectoryHeader() {
  const { user, isAuthenticated, signOut } = useSafeAuth() // CHANGED THIS LINE
  
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Business Directory
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/businesses" className="text-gray-600 hover:text-gray-900">
                Businesses
              </Link>
              <Link href="/categories" className="text-gray-600 hover:text-gray-900">
                Categories
              </Link>
              <Link href="/search" className="text-gray-600 hover:text-gray-900">
                Search
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <button
                  onClick={signOut}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

// Landing page header - ONLY CHANGED: useSiteAuth → useSafeAuth
function LandingHeader({ siteName, primaryColor }: { siteName: string, primaryColor: string }) {
  const { user, isAuthenticated, signOut } = useSafeAuth() // CHANGED THIS LINE
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold" style={{ color: primaryColor }}>
            {siteName}
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900">
              Contact
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={signOut}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Sign Out
              </button>
            ) : null}
            <button 
              className="text-white px-6 py-2 rounded-lg font-medium hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

// Service business header - ONLY CHANGED: useSiteAuth → useSafeAuth
function ServiceHeader({ siteName, primaryColor, location }: { siteName: string, primaryColor: string, location?: string }) {
  const { user, isAuthenticated, signOut } = useSafeAuth() // CHANGED THIS LINE
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div>
            <Link href="/" className="text-xl font-bold" style={{ color: primaryColor }}>
              {siteName}
            </Link>
            {location && (
              <div className="text-xs text-gray-500">Serving {location}</div>
            )}
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/services" className="text-gray-600 hover:text-gray-900">
              Services
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900">
              Contact
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <button
                onClick={signOut}
                className="text-gray-600 hover:text-gray-900 text-sm mr-2"
              >
                Sign Out
              </button>
            )}
            <a 
              href="tel:(555)123-4567"
              className="text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              📞 Call Now
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

// Directory footer (your existing footer) - NO CHANGES
function DirectoryFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h3 className="text-lg font-bold mb-4">Business Directory</h3>
            <p className="text-gray-400">Find and connect with local businesses.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Browse</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/businesses" className="hover:text-white">All Businesses</Link></li>
              <li><Link href="/categories" className="hover:text-white">Categories</Link></li>
              <li><Link href="/search" className="hover:text-white">Search</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Account</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-white">Sign Up</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/about" className="hover:text-white">About</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; 2025 Business Directory. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// Landing/Service footer - NO CHANGES
function SimpleFooter({ siteName }: { siteName: string }) {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h3 className="text-lg font-bold mb-4">{siteName}</h3>
          <div className="flex justify-center space-x-6 text-gray-400 mb-4">
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </div>
          <div className="text-gray-500 text-sm">
            © 2024 {siteName}. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}

interface SiteAwareLayoutProps {
  children: React.ReactNode
}

// Main component - ONLY CHANGED: useSiteAuth → useSafeAuth
export default function SiteAwareLayout({ children }: SiteAwareLayoutProps) {
  const { siteConfig, loading } = useSiteContext()
  const { loading: authLoading } = useSafeAuth() // CHANGED THIS LINE
  const pathname = usePathname()
  
  // Skip layout for admin and API routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    return <>{children}</>
  }
  
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  // No site config or directory site = use directory layout
  if (!siteConfig || siteConfig.site_type === 'directory') {
    return (
      <>
        <Header />
        {children}
        <DirectoryFooter />
      </>
    )
  }
  
  // Get theme colors
  const primaryColor = siteConfig.config?.theme?.primaryColor || '#2563eb'
  const siteName = siteConfig.name
  const location = siteConfig.config?.location
  
  // Landing site layout
  if (siteConfig.site_type === 'landing') {
    return (
      <>
        <LandingHeader siteName={siteName} primaryColor={primaryColor} />
        {children}
        <SimpleFooter siteName={siteName} />
      </>
    )
  }
  
  // Service site layout
  if (siteConfig.site_type === 'service') {
    return (
      <>
        <ServiceHeader siteName={siteName} primaryColor={primaryColor} location={location} />
        {children}
        <SimpleFooter siteName={siteName} />
      </>
    )
  }
  
  // Fallback to directory layout
  return (
    <>
      <DirectoryHeader />
      {children}
      <DirectoryFooter />
    </>
  )
}