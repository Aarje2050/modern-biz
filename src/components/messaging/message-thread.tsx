// src/components/messaging/message-thread.tsx (MODERN WHATSAPP-LIKE VERSION)
'use client'

import { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import Image from 'next/image'
import { useRealtime } from '@/hooks/useRealtime'

interface Message {
  id: string
  content: string
  message_type: string
  attachments: any[]
  reply_to_id: string | null
  is_edited: boolean
  edited_at: string | null
  created_at: string
  updated_at: string
  sender: {
    id: string
    full_name: string | null
    display_name: string | null
    avatar_url: string | null
  }
}

interface MessageThreadProps {
  conversationId: string
  userId: string
}

export default function MessageThread({ conversationId, userId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Mount check
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [newMessage])

  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    })
  }

  // Fetch messages
  const fetchMessages = async (reset = false) => {
    if (!conversationId || !mounted) return

    setLoading(true)
    try {
      const offset = reset ? 0 : messages.length
      const response = await fetch(
        `/api/messages?conversation_id=${conversationId}&limit=50&offset=${offset}`
      )
      
      if (!response.ok) throw new Error('Failed to fetch messages')
      
      const data = await response.json()
      
      if (reset) {
        setMessages(data.messages || [])
        setTimeout(() => scrollToBottom(false), 100)
      } else {
        setMessages(prev => [...(data.messages || []), ...prev])
      }
      
      setHasMore(data.hasMore || false)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !mounted) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    setSending(true)

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      message_type: 'text',
      attachments: [],
      reply_to_id: null,
      is_edited: false,
      edited_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: {
        id: userId,
        full_name: 'You',
        display_name: 'You',
        avatar_url: null
      }
    }
    
    setMessages(prev => [...prev, tempMessage])
    setTimeout(() => scrollToBottom(), 50)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: messageContent,
          message_type: 'text'
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      // Replace temp message with real one
      setMessages(prev => 
        prev.map(msg => msg.id === tempMessage.id ? data.message : msg)
      )
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      setNewMessage(messageContent) // Restore message
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // Real-time subscription for new messages
  const realtimeState = useRealtime([
    {
      event: 'INSERT',
      schema: 'messaging',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
      callback: (payload) => {
        const newMessage = payload.new as Message
        setMessages(prev => {
          // Avoid duplicates and don't add if it's a temp message
          if (prev.some(msg => msg.id === newMessage.id) || newMessage.sender.id === userId) {
            return prev
          }
          return [...prev, newMessage]
        })
        setTimeout(() => scrollToBottom(), 50)
      }
    }
  ], {
    enabled: !!conversationId && mounted,
    debug: process.env.NODE_ENV === 'development',
    reconnectOnError: true,
    maxRetries: 3
  })

  // Helper functions
  const getSenderDisplayName = (sender: Message['sender']) => {
    return sender.display_name || sender.full_name || 'Unknown User'
  }

  const getSenderInitials = (sender: Message['sender']) => {
    const name = getSenderDisplayName(sender)
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  const getMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`
    } else {
      return format(date, 'MMM d, HH:mm')
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    
    return groups
  }

  // Initial fetch
  useEffect(() => {
    if (conversationId && mounted) {
      setMessages([])
      setHasMore(true)
      fetchMessages(true)
    }
  }, [conversationId, mounted])

  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-white">
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

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {/* Load More Button */}
        {hasMore && messages.length > 0 && (
          <div className="text-center">
            <button
              onClick={() => fetchMessages(false)}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 bg-white rounded-full px-4 py-2 shadow-sm"
            >
              {loading ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="space-y-4">
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
        ) : Object.keys(messageGroups).length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full bg-gray-200"></div>
              <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <p className="text-lg font-medium mb-1">No messages yet</p>
            <p className="text-sm text-gray-400">Send a message to start the conversation</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="text-center my-6">
                <div className="inline-block px-3 py-1 bg-white rounded-full shadow-sm">
                  <span className="text-xs font-medium text-gray-600">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3">
                {dateMessages.map((message, index) => {
                  const isCurrentUser = message.sender.id === userId
                  const showAvatar = !isCurrentUser && (
                    index === 0 || 
                    dateMessages[index - 1].sender.id !== message.sender.id
                  )
                  const isLastInGroup = index === dateMessages.length - 1 || 
                    dateMessages[index + 1].sender.id !== message.sender.id

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                    >
                      {/* Avatar for other users */}
                      {!isCurrentUser && (
                        <div className="flex-shrink-0">
                          {showAvatar ? (
                            message.sender.avatar_url ? (
                              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                <Image
                                  src={message.sender.avatar_url}
                                  alt={getSenderDisplayName(message.sender)}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {getSenderInitials(message.sender)}
                                </span>
                              </div>
                            )
                          ) : (
                            <div className="w-8 h-8"></div>
                          )}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={`max-w-xs sm:max-w-sm lg:max-w-md ${
                        isCurrentUser ? 'order-last' : 'order-first'
                      }`}>
                        {/* Sender Name (for groups) */}
                        {!isCurrentUser && showAvatar && (
                          <p className="text-xs text-gray-500 mb-1 px-3">
                            {getSenderDisplayName(message.sender)}
                          </p>
                        )}

                        {/* Message Content */}
                        <div className={`relative rounded-2xl px-4 py-2 max-w-full break-words ${
                          isCurrentUser
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-white text-gray-900 shadow-sm rounded-bl-md'
                        } ${
                          !isLastInGroup 
                            ? isCurrentUser 
                              ? 'rounded-br-lg' 
                              : 'rounded-bl-lg'
                            : ''
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                          
                          {/* Time */}
                          <div className={`flex items-center justify-end mt-1 space-x-1 ${
                            isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">
                              {getMessageTime(message.created_at)}
                            </span>
                            {message.is_edited && (
                              <span className="text-xs opacity-70">edited</span>
                            )}
                            {/* Delivery status for current user messages */}
                            {isCurrentUser && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Spacer for current user to push avatar space */}
                      {isCurrentUser && <div className="w-8"></div>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={sendMessage} className="flex items-end space-x-3">
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              rows={1}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 max-h-32 overflow-y-auto"
              style={{ minHeight: '44px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(e)
                }
              }}
            />
          </div>
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              newMessage.trim() && !sending
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}