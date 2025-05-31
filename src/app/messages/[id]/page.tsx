// src/app/messages/[id]/page.tsx (MODERN VERSION)
'use client'

import { useState, useEffect } from 'react'
import { useAuth, useSiteContext, useUnifiedAuth } from '@/providers/app-provider'
import { useParams, useRouter } from 'next/navigation'
import MessageThread from '@/components/messaging/message-thread'
import Link from 'next/link'

export default function MessageThreadPage() {
  const { id: conversationId } = useParams()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Fix for SSR/hydration
  useEffect(() => {
    setMounted(true)
    
    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-12 w-12"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col">
        {/* Loading Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="animate-pulse flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
        
        {/* Loading Content */}
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-gray-200"></div>
            <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Sign in required</h3>
          <p className="text-gray-600 mb-6">Please sign in to access your messages.</p>
          <a
            href="/login"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  if (!conversationId || typeof conversationId !== 'string') {
    router.push('/messages')
    return null
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                href="/messages"
                className="inline-flex items-center p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="sr-only sm:not-sr-only sm:ml-2 text-sm font-medium">
                  {isMobile ? '' : 'Back to Messages'}
                </span>
              </Link>
              <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Conversation</h1>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              {/* Mobile menu button */}
              <button className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors sm:hidden">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {/* Desktop actions */}
              <div className="hidden sm:flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors" title="Search in conversation">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors" title="Conversation info">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MessageThread
          conversationId={conversationId}
          userId={user.id}
        />
      </div>
    </div>
  )
}