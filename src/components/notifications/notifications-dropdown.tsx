// src/components/notifications/notifications-dropdown.tsx (UPDATED VERSION)
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useRealtime } from '@/hooks/useRealtime'

interface Notification {
  id: string
  type: string
  title: string
  content: string | null
  action_url: string | null
  is_read: boolean
  priority: string
  created_at: string
  sender: {
    id: string
    full_name: string | null
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface NotificationsDropdownProps {
  userId?: string
}

export default function NotificationsDropdown({ userId }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Mount check
  useEffect(() => {
    setMounted(true)
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Real-time subscription with the updated hook
  const realtimeState = useRealtime([
    {
      event: 'INSERT',
      schema: 'notifications',
      table: 'notifications',
      filter: userId ? `recipient_id=eq.${userId}` : undefined,
      callback: (payload) => {
        const newNotification = payload.new as Notification
        setNotifications(prev => {
          // Avoid duplicates
          if (prev.some(n => n.id === newNotification.id)) return prev
          return [newNotification, ...prev]
        })
        setUnreadCount(prev => prev + 1)
      }
    },
    {
      event: 'UPDATE',
      schema: 'notifications',
      table: 'notifications',
      filter: userId ? `recipient_id=eq.${userId}` : undefined,
      callback: (payload) => {
        const updatedNotification = payload.new as Notification
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === updatedNotification.id ? updatedNotification : notif
          )
        )
        
        // Update unread count if read status changed
        if (updatedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    }
  ], {
    enabled: !!userId && mounted,
    debug: process.env.NODE_ENV === 'development',
    
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (mounted) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mounted])

  // Fetch notifications with abort controller
  const fetchNotifications = useCallback(async (reset = false) => {
    if (!userId || !mounted) return

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const offset = reset ? 0 : notifications.length
      const response = await fetch(
        `/api/notifications?limit=10&offset=${offset}`,
        { signal: abortControllerRef.current.signal }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (reset) {
        setNotifications(data.notifications || [])
      } else {
        setNotifications(prev => [...prev, ...(data.notifications || [])])
      }
      
      setUnreadCount(data.unread_count || 0)
      setHasMore(data.hasMore || false)
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching notifications:', error)
        setError('Failed to load notifications')
      }
    } finally {
      setLoading(false)
    }
  }, [userId, mounted, notifications.length])

  // Mark notifications as read with optimistic updates
  const markAsRead = useCallback(async (notificationIds?: string[]) => {
    if (!mounted) return
    
    // Optimistic update
    const originalNotifications = notifications
    const originalUnreadCount = unreadCount

    setNotifications(prev => 
      prev.map(notif => 
        !notificationIds || notificationIds.includes(notif.id) 
          ? { ...notif, is_read: true }
          : notif
      )
    )
    
    if (!notificationIds) {
      setUnreadCount(0)
    } else {
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
    }

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_ids: notificationIds,
          mark_all_read: !notificationIds
        })
      })

      if (!response.ok) {
        throw new Error('Failed to mark as read')
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      // Revert optimistic update
      setNotifications(originalNotifications)
      setUnreadCount(originalUnreadCount)
    }
  }, [mounted, notifications, unreadCount])

  // Handle notification click
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead([notification.id])
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
    
    setIsOpen(false)
  }, [markAsRead])

  // Initial fetch
  useEffect(() => {
    if (userId && mounted) {
      fetchNotifications(true)
    }
  }, [userId, mounted, fetchNotifications])

  // Get notification icon
  const getNotificationIcon = useCallback((type: string) => {
    const iconClasses = "w-4 h-4"
    const containerClasses = "w-8 h-8 rounded-full flex items-center justify-center"

    switch (type) {
      case 'message_received':
        return (
          <div className={`${containerClasses} bg-blue-100`}>
            <svg className={`${iconClasses} text-blue-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        )
      case 'business_approved':
        return (
          <div className={`${containerClasses} bg-green-100`}>
            <svg className={`${iconClasses} text-green-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'business_rejected':
        return (
          <div className={`${containerClasses} bg-red-100`}>
            <svg className={`${iconClasses} text-red-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'review_posted':
      case 'review_response':
        return (
          <div className={`${containerClasses} bg-yellow-100`}>
            <svg className={`${iconClasses} text-yellow-600`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className={`${containerClasses} bg-gray-100`}>
            <svg className={`${iconClasses} text-gray-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 17h9a2 2 0 002-2V9a2 2 0 00-2-2H4a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
        )
    }
  }, [])

  if (!userId || !mounted) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
</svg>

        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {/* Connection Status
              {realtimeState.error && (
                <button
                  onClick={realtimeState.forceReconnect}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center"
                  title={`Connection error: ${realtimeState.error}`}
                >
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </button>
              )} */}
              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => fetchNotifications(true)}
                className="text-sm text-red-700 underline mt-1 hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5v-5zM4 17h9a2 2 0 002-2V9a2 2 0 00-2-2H4a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className={`text-sm font-medium text-gray-900 ${
                            !notification.is_read ? 'font-semibold' : ''
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        {notification.content && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {notification.content}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <div className="p-4 text-center">
                    <button
                      onClick={() => fetchNotifications(false)}
                      disabled={loading}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Loading...' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <Link
              href="/notifications"
              className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}