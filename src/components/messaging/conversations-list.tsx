// src/components/messaging/conversations-list.tsx (ENHANCED VERSION)
'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import Image from 'next/image'
import { useRealtime } from '@/hooks/useRealtime'

interface Participant {
  profile: {
    id: string
    full_name: string | null
    display_name: string | null
    avatar_url: string | null
  } | null
  business: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    profile_id: string
  } | null
}

interface Conversation {
  id: string
  type: string
  status: string
  last_message_at: string
  created_at: string
  participants: Participant[]
  latest_message: {
    id: string
    content: string
    message_type: string
    created_at: string
    sender: {
      id: string
      full_name: string | null
      display_name: string | null
      avatar_url: string | null
    }
  } | null
  unread_count: number
  is_muted: boolean
}

interface ConversationsListProps {
  userId: string
  selectedConversationId: string | null
  onSelectConversation: (id: string) => void
}

type FilterType = 'all' | 'business' | 'users'

export default function ConversationsList({ 
  userId, 
  selectedConversationId, 
  onSelectConversation 
}: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Mount check
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch conversations
  const fetchConversations = async (reset = false) => {
    if (!userId || !mounted) return

    setLoading(true)
    try {
      const offset = reset ? 0 : conversations.length
      const response = await fetch(`/api/conversations?limit=20&offset=${offset}`)
      
      if (!response.ok) throw new Error('Failed to fetch conversations')
      
      const data = await response.json()
      
      if (reset) {
        setConversations(data.conversations || [])
      } else {
        setConversations(prev => [...prev, ...(data.conversations || [])])
      }
      
      setHasMore(data.hasMore || false)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Real-time subscriptions
  const realtimeState = useRealtime([
    {
      event: 'INSERT',
      schema: 'messaging',
      table: 'messages',
      callback: () => {
        fetchConversations(true)
      }
    },
    {
      event: 'UPDATE',
      schema: 'messaging',
      table: 'conversations',
      callback: () => {
        fetchConversations(true)
      }
    }
  ], {
    enabled: !!userId && mounted
  })

  // Helper functions
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(participant => {
      if (participant.profile && participant.profile.id !== userId) {
        return true
      }
      if (participant.business && participant.business.profile_id !== userId) {
        return true
      }
      return false
    }) || conversation.participants[0]
  }

  const getConversationDisplayName = (conversation: Conversation) => {
    const otherParticipant = getOtherParticipant(conversation)
    
    if (conversation.type === 'business_inquiry' && otherParticipant?.business) {
      return otherParticipant.business.name
    }
    
    if (otherParticipant?.profile) {
      return otherParticipant.profile.display_name || 
             otherParticipant.profile.full_name || 
             'Unknown User'
    }
    
    return conversation.type === 'business_inquiry' ? 'Business Chat' : 'Direct Message'
  }

  const getConversationAvatar = (conversation: Conversation) => {
    const otherParticipant = getOtherParticipant(conversation)
    
    if (conversation.type === 'business_inquiry' && otherParticipant?.business?.logo_url) {
      return otherParticipant.business.logo_url
    }
    
    if (otherParticipant?.profile?.avatar_url) {
      return otherParticipant.profile.avatar_url
    }
    
    return null
  }

  const getConversationInitials = (conversation: Conversation) => {
    const name = getConversationDisplayName(conversation)
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  const getLastMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM d')
    }
  }

  const truncateMessage = (text: string, maxLength = 50) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Delete conversation
  const deleteConversation = async (conversationId: string) => {
    if (!mounted) return

    setDeletingConversation(conversationId)
    
    // Optimistic update
    setConversations(prev => prev.filter(conv => conv.id !== conversationId))
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete conversation')
      }

      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting conversation:', error)
      // Revert optimistic update
      fetchConversations(true)
      alert('Failed to delete conversation. Please try again.')
    } finally {
      setDeletingConversation(null)
    }
  }

  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations

    // Apply filter
    if (activeFilter === 'business') {
      filtered = filtered.filter(conv => conv.type === 'business_inquiry')
    } else if (activeFilter === 'users') {
      filtered = filtered.filter(conv => conv.type === 'direct')
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(conv => {
        const displayName = getConversationDisplayName(conv).toLowerCase()
        const lastMessage = conv.latest_message?.content?.toLowerCase() || ''
        return displayName.includes(query) || lastMessage.includes(query)
      })
    }

    return filtered
  }, [conversations, activeFilter, searchQuery])

  // Initial fetch
  useEffect(() => {
    if (userId && mounted) {
      fetchConversations(true)
    }
  }, [userId, mounted])

  if (!mounted) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 p-4 space-y-4">
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
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Chats</h2>
          {realtimeState.isConnected && (
            <div className="flex items-center text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Connected
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all' as FilterType, label: 'All', count: conversations.length },
            { key: 'business' as FilterType, label: 'Business', count: conversations.filter(c => c.type === 'business_inquiry').length },
            { key: 'users' as FilterType, label: 'Users', count: conversations.filter(c => c.type === 'direct').length }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                activeFilter === filter.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className="ml-1 text-xs opacity-75">({filter.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="p-4 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-3 p-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full bg-gray-100"></div>
                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                  {searchQuery ? (
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No results found' : 'No conversations yet'}
              </h3>
              <p className="text-sm text-gray-500">
                {searchQuery 
                  ? `No conversations match "${searchQuery}"`
                  : 'Start chatting with businesses and other users'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredConversations.map((conversation) => {
              const avatarUrl = getConversationAvatar(conversation)
              const displayName = getConversationDisplayName(conversation)
              const initials = getConversationInitials(conversation)
              const isSelected = selectedConversationId === conversation.id
              
              return (
                <div
                  key={conversation.id}
                  className={`group relative px-4 py-3 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                    isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : 'border-r-4 border-transparent'
                  }`}
                >
                  <div 
                    className="flex items-center space-x-3"
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {avatarUrl ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                          <Image
                            src={avatarUrl}
                            alt={displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-600">
                            {initials}
                          </span>
                        </div>
                      )}
                      
                      {/* Unread indicator */}
                      {conversation.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1">
                          <span className="text-xs text-white font-medium">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-medium truncate ${
                          conversation.unread_count > 0 ? 'text-gray-900 font-semibold' : 'text-gray-700'
                        }`}>
                          {displayName}
                        </p>
                        <div className="flex items-center space-x-1">
                          <span className={`text-xs flex-shrink-0 ${
                            conversation.unread_count > 0 ? 'text-blue-600 font-medium' : 'text-gray-500'
                          }`}>
                            {getLastMessageTime(conversation.last_message_at)}
                          </span>
                          {conversation.is_muted && (
                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.817L4.875 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.875l3.508-2.817a1 1 0 011.617.817zM15 8a3 3 0 11-6 0 3 3 0 016 0zM17 8a5 5 0 11-10 0 5 5 0 0110 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {conversation.latest_message && (
                        <div className="flex items-center space-x-1">
                          {conversation.latest_message.sender.id === userId && (
                            <span className="text-gray-400 text-xs font-medium">You:</span>
                          )}
                          <p className={`text-xs truncate ${
                            conversation.unread_count > 0 ? 'text-gray-600 font-medium' : 'text-gray-500'
                          }`}>
                            {truncateMessage(conversation.latest_message.content)}
                          </p>
                        </div>
                      )}

                      {/* Type indicator */}
                      {conversation.type === 'business_inquiry' && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v8h12V6H4z" clipRule="evenodd" />
                            </svg>
                            Business
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete Button - Show on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteConfirm(conversation.id)
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                    title="Delete conversation"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )
            })}
            
            {/* Load More */}
            {hasMore && !searchQuery && (
              <div className="p-4 text-center border-t border-gray-100">
                <button
                  onClick={() => fetchConversations(false)}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors"
                >
                  {loading ? 'Loading...' : 'Load more conversations'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteConfirm(null)} />
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Delete conversation
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this conversation? This action cannot be undone and you will lose all messages.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={() => deleteConversation(showDeleteConfirm)}
                  disabled={deletingConversation === showDeleteConfirm}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingConversation === showDeleteConfirm ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}