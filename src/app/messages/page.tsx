// src/app/messages/page.tsx (MODERN MOBILE-FIRST VERSION)
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import ConversationsList from '@/components/messaging/conversations-list'
import MessageThread from '@/components/messaging/message-thread'
import NewMessageModal from '@/components/messaging/new-message-modal'

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { user, loading } = useAuth()

  // Fix for SSR/hydration and mobile detection
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

  // Handle conversation selection with mobile behavior
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    // On mobile, selecting a conversation should show only the thread
  }

  // Handle back to conversations list on mobile
  const handleBackToConversations = () => {
    setSelectedConversationId(null)
  }

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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Loading Header */}
          <div className="bg-white shadow-sm border-b">
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              <div className="animate-pulse flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
          
          {/* Loading Content */}
          <div className="flex h-[calc(100vh-140px)]">
            <div className="w-1/3 bg-white border-r border-gray-200">
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 bg-gray-50 flex items-center justify-center">
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
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
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Sign in to chat</h3>
          <p className="text-gray-600 mb-6">Please sign in to access your messages and start conversations.</p>
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

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header - Only show on desktop or when no conversation selected on mobile */}
      {(!isMobile || !selectedConversationId) && (
        <div className="bg-white shadow-sm border-b flex-shrink-0">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                <p className="mt-1 text-sm text-gray-600 hidden sm:block">
                  Connect with businesses and other users
                </p>
              </div>
              <button
                onClick={() => setShowNewMessage(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">New Message</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Layout */}
        {!isMobile && (
          <>
            {/* Conversations Sidebar */}
            <div className="w-80 border-r border-gray-200 bg-white flex-shrink-0">
              <ConversationsList
                userId={user.id}
                selectedConversationId={selectedConversationId}
                onSelectConversation={handleSelectConversation}
              />
            </div>

            {/* Message Thread */}
            <div className="flex-1 flex flex-col">
              {selectedConversationId ? (
                <MessageThread
                  conversationId={selectedConversationId}
                  userId={user.id}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center max-w-md">
                    <div className="relative mx-auto w-20 h-20 mb-6">
                      <div className="absolute inset-0 rounded-full bg-gray-100"></div>
                      <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Select a conversation</h3>
                    <p className="text-gray-600 mb-6">Choose a conversation from the list to start messaging</p>
                    <button
                      onClick={() => setShowNewMessage(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Start new conversation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <div className="flex-1 flex flex-col">
            {!selectedConversationId ? (
              /* Show Conversations List */
              <ConversationsList
                userId={user.id}
                selectedConversationId={selectedConversationId}
                onSelectConversation={handleSelectConversation}
              />
            ) : (
              /* Show Message Thread with Back Button */
              <div className="flex-1 flex flex-col">
                {/* Mobile Message Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3">
                  <button
                    onClick={handleBackToConversations}
                    className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex-1 truncate">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">Conversation</h2>
                  </div>
                  <button
                    onClick={() => setShowNewMessage(true)}
                    className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Message Thread */}
                <MessageThread
                  conversationId={selectedConversationId}
                  userId={user.id}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <NewMessageModal
          userId={user.id}
          onClose={() => setShowNewMessage(false)}
          onConversationCreated={(conversationId) => {
            setSelectedConversationId(conversationId)
            setShowNewMessage(false)
          }}
        />
      )}
    </div>
  )
}