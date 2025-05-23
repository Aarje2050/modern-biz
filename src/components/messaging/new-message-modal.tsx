// src/components/messaging/new-message-modal.tsx (FIXED VERSION)
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface User {
  id: string
  full_name: string | null
  display_name: string | null
  avatar_url: string | null
}

interface Business {
  id: string
  name: string
  slug: string
  logo_url: string | null
  profile_id: string
}

interface NewMessageModalProps {
  userId: string
  onClose: () => void
  onConversationCreated: (conversationId: string) => void
}

export default function NewMessageModal({ 
  userId, 
  onClose, 
  onConversationCreated 
}: NewMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<(User | Business)[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<User | Business | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [creatingForId, setCreatingForId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    // Auto-focus search input
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }, [])

  // Search for users and businesses
  const searchRecipients = async (query: string) => {
    if (!query.trim() || query.length < 2 || !mounted) {
      setSearchResults([])
      return
    }

    const supabase = createClient()
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    setLoading(true)
    try {
      // Search users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, avatar_url')
        .neq('id', userId)
        .or(`full_name.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(8)

      if (usersError) {
        console.error('Error searching users:', usersError)
      }

      // Search businesses
      const { data: businesses, error: businessesError } = await supabase
        .from('businesses')
        .select('id, name, slug, logo_url, profile_id')
        .eq('status', 'active')
        .ilike('name', `%${query}%`)
        .limit(8)

      if (businessesError) {
        console.error('Error searching businesses:', businessesError)
      }

      const results = [
        ...(users || []),
        ...(businesses || [])
      ]

      setSearchResults(results)
    } catch (error) {
      console.error('Error searching recipients:', error)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (!mounted) return

    const timer = setTimeout(() => {
      searchRecipients(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, mounted])

  // Check if item is a business
  const isBusiness = (item: User | Business): item is Business => {
    return 'name' in item && 'slug' in item
  }

  // Get display name
  const getDisplayName = (item: User | Business) => {
    if (isBusiness(item)) {
      return item.name
    }
    return item.display_name || item.full_name || 'Unknown User'
  }

  // Get avatar URL
  const getAvatarUrl = (item: User | Business) => {
    if (isBusiness(item)) {
      return item.logo_url
    }
    return item.avatar_url
  }

  // Get initials
  const getInitials = (item: User | Business) => {
    const name = getDisplayName(item)
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  // Create conversation and start chatting immediately (FIXED)
  const startConversation = async (recipient: User | Business) => {
    if (!mounted || creating) return

    setCreating(true)
    setCreatingForId(recipient.id)
    try {
      const conversationType = isBusiness(recipient) ? 'business_inquiry' : 'direct'
      const participantIds = isBusiness(recipient) 
        ? [recipient.profile_id] 
        : [recipient.id]

      console.log('Starting conversation with:', {
        recipient: getDisplayName(recipient),
        type: conversationType,
        participantIds,
        business_id: isBusiness(recipient) ? recipient.id : null
      })

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_ids: participantIds,
          business_id: isBusiness(recipient) ? recipient.id : null,
          type: conversationType
          // Removed subject and initial_message - let user type first message
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create conversation')
      }

      const data = await response.json()
      
      console.log('Conversation created successfully:', data)
      
      // Close modal and navigate to conversation
      onConversationCreated(data.conversation_id)
      
    } catch (error) {
      console.error('Error creating conversation:', error)
      alert(`Failed to start conversation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreating(false)
      setCreatingForId(null)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          {/* Header */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Start a conversation
              </h3>
              <button
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Search people and businesses..."
              />
            </div>

            {/* Search Results */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-3 p-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((item) => {
                    const avatarUrl = getAvatarUrl(item)
                    const displayName = getDisplayName(item)
                    const initials = getInitials(item)
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => startConversation(item)}
                        disabled={creating}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {/* Avatar */}
                        <div className="relative">
                          {avatarUrl ? (
                            <div className="relative h-10 w-10 rounded-full overflow-hidden">
                              <Image
                                src={avatarUrl}
                                alt={displayName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {initials}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isBusiness(item) ? 'Business' : 'User'}
                          </p>
                        </div>

                        {/* Loading indicator - only for this specific item */}
                        {creatingForId === item.id && (
                          <div className="h-4 w-4">
                            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                            </svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <p className="text-sm">No people or businesses found</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <p className="text-sm">Type to search for people and businesses</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer hint */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6">
            <p className="text-xs text-gray-500 text-center">
              Select someone to start a conversation. You can send your first message after creating the chat.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}