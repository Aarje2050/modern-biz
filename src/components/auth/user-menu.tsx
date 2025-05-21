// src/components/auth/user-menu.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Avatar from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

type UserMenuProps = {
  user: {
    id: string
    email?: string
    fullName?: string | null
    avatarUrl?: string | null
  }
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <Avatar 
          src={user.avatarUrl} 
          name={user.fullName || user.email || 'User'} 
          size="sm" 
        />
        <span className="hidden md:inline text-sm font-medium text-gray-700">
          {user.fullName || user.email?.split('@')[0] || 'User'}
        </span>
        <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-md shadow-lg z-10">
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.fullName || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Listings Dashboard
          </Link>
          
          <Link
            // src/components/auth/user-menu.tsx (continued)
           href="/profile"
           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
           onClick={() => setIsOpen(false)}
         >
           Profile
         </Link>
         
         <Link
           href="/admin/dashboard"
           className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
           onClick={() => setIsOpen(false)}
         >
           Switch to Admin Role
         </Link>
         
         <button
           onClick={handleSignOut}
           className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
         >
           Sign out
         </button>
       </div>
     )}
   </div>
 )
}