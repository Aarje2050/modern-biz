// src/components/layout/header.tsx (REPLACE YOUR EXISTING)
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import UserMenu from '@/components/auth/user-menu'
import NotificationsDropdown from '@/components/notifications/notifications-dropdown'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isLoading } = useAuth()

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-gray-800">
            BusinessDir
          </Link>
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/businesses" className="text-gray-700 hover:text-gray-900">
            Businesses
          </Link>
          <Link href="/categories" className="text-gray-700 hover:text-gray-900">
            Categories
          </Link>
          <Link href="/search" className="text-gray-700 hover:text-gray-900">
            Search
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-4">
          {/* Messages Link (for authenticated users) */}
          {user && (
            <Link
              href="/messages"
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-lg transition-colors"
              title="Messages"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
          )}

          {/* Notifications */}
          {user && <NotificationsDropdown userId={user.id} />}

          {isLoading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          ) : user ? (
            <UserMenu user={{
              id: user.id,
              email: user.email,
              fullName: user.user_metadata?.full_name,
              avatarUrl: user.user_metadata?.avatar_url
            }} />
          ) : (
            <>
              <Link 
                href="/login" 
                className="py-2 px-4 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Log in
              </Link>
              <Link 
                href="/register" 
                className="py-2 px-4 bg-gray-900 border border-transparent rounded-md text-sm font-medium text-white hover:bg-gray-800"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
        
        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            )}
          </svg>
        </button>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 py-2 pb-4 bg-white border-t">
          <div className="space-y-2 py-2">
            <Link
              href="/businesses"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Businesses
            </Link>
            <Link
              href="/categories"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Categories
            </Link>
            <Link
              href="/search"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Search
            </Link>
            
            {/* Mobile-specific links for authenticated users */}
            {user && (
              <>
                <Link
                  href="/messages"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  href="/notifications"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Notifications
                </Link>
              </>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {isLoading ? (
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={async () => {
                    const supabase = createClient()
// Add null check
if (!supabase) {
  
  return
}
                    await supabase.auth.signOut()
                    window.location.href = '/'
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block w-full py-2 px-3 text-center border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="block w-full py-2 px-3 text-center border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}