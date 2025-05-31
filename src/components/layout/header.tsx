// src/components/layout/header.tsx (Enhanced Mobile App-Like)
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth, useSiteContext, useUnifiedAuth } from '@/providers/app-provider'
import { usePathname } from 'next/navigation'
import UserMenu from '@/components/auth/user-menu'
import NotificationsDropdown from '@/components/notifications/notifications-dropdown'
import SearchInput from '@/components/search/search-input'
import { createClient } from '@/lib/supabase/client'
import { useRealtime } from '@/hooks/useRealtime'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const { user, loading } = useAuth()
  const [notificationCount, setNotificationCount] = useState(0)
  const [messageCount, setMessageCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Handle scroll for desktop sticky search only
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY
      setScrolled(offset > 100) // Show search after scrolling 100px
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch notification counts
  useEffect(() => {
    setMounted(true)
    if (!user) return
    
    fetch('/api/notifications?count_only=true')
      .then(res => res.json())
      .then(data => setNotificationCount(data.unread_count || 0))
      .catch(() => {})
    
    fetch('/api/messages/unread-count')
      .then(res => res.json())
      .then(data => setMessageCount(data.unread_count || 0))
      .catch(() => {})
  }, [user])

  // Real-time subscriptions
  useRealtime([
    {
      event: 'INSERT',
      schema: 'messaging', 
      table: 'messages',
      callback: () => {
        if (user && mounted) {
          fetch('/api/messages/unread-count')
            .then(res => res.json())
            .then(data => setMessageCount(data.unread_count || 0))
            .catch(() => {})
        }
      }
    },
  ], { enabled: !!user && mounted })

  // Check if current page is homepage
  const isHomepage = pathname === '/'

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block bg-white shadow-sm relative z-50">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">BusinessDir</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="flex items-center space-x-8">
              <Link 
                href="/businesses" 
                className={`font-medium transition-colors ${
                  pathname.startsWith('/businesses') 
                    ? 'text-red-600' 
                    : 'text-gray-700 hover:text-red-600'
                }`}
              >
                Browse Services
              </Link>
              <Link 
                href="/categories" 
                className={`font-medium transition-colors ${
                  pathname.startsWith('/categories') 
                    ? 'text-red-600' 
                    : 'text-gray-700 hover:text-red-600'
                }`}
              >
                Categories
              </Link>
              <Link 
                href="/search" 
                className={`font-medium transition-colors ${
                  pathname.startsWith('/search') 
                    ? 'text-red-600' 
                    : 'text-gray-700 hover:text-red-600'
                }`}
              >
                Search
              </Link>
            </div>
            
            {/* Desktop User Actions */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <Link
                    href="/messages"
                    className="relative p-2 text-gray-600 hover:text-red-600 rounded-lg transition-colors"
                    title="Messages"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8m-8 4h5m9-2c0 5.523-4.477 10-10 10a9.953 9.953 0 01-5.284-1.47L3 21l1.47-3.716A9.953 9.953 0 013 12C3 6.477 7.477 2 13 2s10 4.477 10 10z" />
                    </svg>
                    {messageCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {messageCount > 99 ? '99+' : messageCount}
                      </span>
                    )}
                  </Link>
                  <NotificationsDropdown userId={user.id} />
                </>
              )}

              {loading ? (
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : user ? (
                <UserMenu user={{
                  id: user.id,
                  email: user.email,
                  fullName: user.user_metadata?.full_name,
                  avatarUrl: user.user_metadata?.avatar_url
                }} />
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    href="/login" 
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link 
                    href="/register" 
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Desktop Sticky Search Bar (appears on scroll, hidden on homepage) */}
        {scrolled && !isHomepage && (
          <div className="bg-red-600 border-t border-red-500 py-3 shadow-lg">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto">
                <SearchInput 
                  placeholder="Search services..."
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Header - Enhanced Native App Design */}
      <header className="md:hidden bg-white shadow-sm relative z-50 border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">BusinessDir</span>
            </Link>

            {/* Mobile Actions - Enhanced with notifications */}
            <div className="flex items-center space-x-1">
              {/* Search Toggle */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  showMobileSearch 
                    ? 'bg-red-100 text-red-600' 
                    : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                }`}
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Notifications (if logged in) */}
              {user && (
                <div className="relative">
                  <NotificationsDropdown userId={user.id} />
                </div>
              )}

              {/* Messages (if logged in) */}
              {user && (
                <Link
                  href="/messages"
                  className="relative p-2.5 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-all duration-200"
                  aria-label="Messages"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8m-8 4h5m9-2c0 5.523-4.477 10-10 10a9.953 9.953 0 01-5.284-1.47L3 21l1.47-3.716A9.953 9.953 0 013 12C3 6.477 7.477 2 13 2s10 4.477 10 10z" />
                  </svg>
                  {messageCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium text-[10px]">
                      {messageCount > 9 ? '9+' : messageCount}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar (toggleable) - Enhanced Design */}
        {showMobileSearch && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
            <SearchInput 
              placeholder="Search businesses, services..."
              className="w-full"
            />
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation - Enhanced Native App Design */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="grid grid-cols-5 py-1">
          {/* Home */}
          <Link
            href="/"
            className={`flex flex-col items-center py-2 px-1 transition-all duration-200 ${
              pathname === '/' 
                ? 'text-red-600' 
                : 'text-gray-500 hover:text-gray-700 active:text-red-600'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all duration-200 ${
              pathname === '/' ? 'bg-red-50' : ''
            }`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className={`text-xs font-medium mt-0.5 ${
              pathname === '/' ? 'font-semibold' : ''
            }`}>Home</span>
          </Link>

          {/* Browse */}
          <Link
            href="/businesses"
            className={`flex flex-col items-center py-2 px-1 transition-all duration-200 ${
              pathname.startsWith('/businesses') 
                ? 'text-red-600' 
                : 'text-gray-500 hover:text-gray-700 active:text-red-600'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all duration-200 ${
              pathname.startsWith('/businesses') ? 'bg-red-50' : ''
            }`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0h3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className={`text-xs font-medium mt-0.5 ${
              pathname.startsWith('/businesses') ? 'font-semibold' : ''
            }`}>Browse</span>
          </Link>

          {/* Categories */}
          <Link
            href="/categories"
            className={`flex flex-col items-center py-2 px-1 transition-all duration-200 ${
              pathname.startsWith('/categories') 
                ? 'text-red-600' 
                : 'text-gray-500 hover:text-gray-700 active:text-red-600'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all duration-200 ${
              pathname.startsWith('/categories') ? 'bg-red-50' : ''
            }`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className={`text-xs font-medium mt-0.5 ${
              pathname.startsWith('/categories') ? 'font-semibold' : ''
            }`}>Categories</span>
          </Link>

          {/* Profile/Login */}
          {user ? (
            <Link
              href="/dashboard"
              className={`flex flex-col items-center py-2 px-1 transition-all duration-200 ${
                pathname.startsWith('/dashboard') 
                  ? 'text-red-600' 
                  : 'text-gray-500 hover:text-gray-700 active:text-red-600'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all duration-200 ${
                pathname.startsWith('/dashboard') ? 'bg-red-50' : ''
              }`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className={`text-xs font-medium mt-0.5 ${
                pathname.startsWith('/dashboard') ? 'font-semibold' : ''
              }`}>Profile</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex flex-col items-center py-2 px-1 text-gray-500 hover:text-gray-700 active:text-red-600 transition-all duration-200"
            >
              <div className="p-1 rounded-lg">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="text-xs font-medium mt-0.5">Login</span>
            </Link>
          )}

          {/* Add Business - Enhanced with better visual prominence */}
          <Link
            href="/businesses/add"
            className="flex flex-col items-center py-2 px-1 transition-all duration-200"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-sm transform hover:scale-105 active:scale-95 transition-transform duration-200">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-red-600 mt-0.5">Add</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Padding for Bottom Nav - Increased for better spacing */}
      {/* <div className="md:hidden h-20"></div> */}
    </>
  )
}