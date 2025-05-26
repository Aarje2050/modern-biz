// src/components/businesses/contact-info.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

interface BusinessContact {
  type: string
  value: string
  is_primary: boolean
}

interface ContactInfoProps {
  contacts: BusinessContact[]
  session: any
  businessSlug: string
}

export default function ContactInfo({ contacts, session, businessSlug }: ContactInfoProps) {
  const contactsByType: Record<string, string> = {}
  contacts?.forEach(contact => {
    contactsByType[contact.type] = contact.value
  })

  const ContactItem = ({ type, value, icon, label, href }: {
    type: string
    value: string
    icon: React.ReactNode
    label: string
    href?: string
  }) => {
    const isPrivate = type === 'phone' || type === 'email'
    const showBlur = isPrivate && !session
    const [showLogin, setShowLogin] = useState(false)

    const handleClick = () => {
      if (showBlur) {
        setShowLogin(true)
      }
    }

    return (
      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
        <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
          {showBlur ? (
            <div className="relative">
              <div 
                className="filter blur-sm select-none text-gray-900 font-medium cursor-pointer"
                onClick={handleClick}
              >
                {value}
              </div>
              {showLogin ? (
                <Link 
                  href={`/login?redirect_to=${encodeURIComponent(`/businesses/${businessSlug}`)}`}
                  className="absolute inset-0 flex items-center justify-center bg-red-600 bg-opacity-90 text-white text-xs font-medium rounded hover:bg-opacity-100 transition-all"
                >
                  Login to see {type}
                </Link>
              ) : (
                <button
                  onClick={handleClick}
                  className="absolute inset-0 flex items-center justify-center bg-red-600 bg-opacity-90 text-white text-xs font-medium rounded hover:bg-opacity-100 transition-all mobile-touch-feedback"
                >
                  Click to see {type}
                </button>
              )}
            </div>
          ) : href ? (
            <a href={href} className="text-gray-900 font-medium hover:text-red-600 transition-colors break-all">
              {type === 'website' ? value.replace(/^https?:\/\//, '') : value}
            </a>
          ) : (
            <span className="text-gray-900 font-medium break-all">{value}</span>
          )}
        </div>
      </div>
    )
  }

  if (Object.keys(contactsByType).length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">No contact information available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {contactsByType.phone && (
        <ContactItem
          type="phone"
          value={contactsByType.phone}
          label="Phone"
          href={session ? `tel:${contactsByType.phone}` : undefined}
          icon={<svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
        />
      )}
      
      {contactsByType.email && (
        <ContactItem
          type="email"
          value={contactsByType.email}
          label="Email"
          href={session ? `mailto:${contactsByType.email}` : undefined}
          icon={<svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        />
      )}
      
      {contactsByType.website && (
        <ContactItem
          type="website"
          value={contactsByType.website}
          label="Website"
          href={contactsByType.website}
          icon={<svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s1.343-9-3-9m-9 9a9 9 0 019-9" /></svg>}
        />
      )}
    </div>
  )
}