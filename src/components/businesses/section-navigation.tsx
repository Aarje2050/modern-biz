// src/components/businesses/section-navigation.tsx
'use client'

import { useState, useEffect } from 'react'

const sections = [
  { id: 'about', label: 'About' },
  { id: 'gallery', label: 'Photos' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'location', label: 'Location' }
]

export default function SectionNavigation() {
  const [activeSection, setActiveSection] = useState('about')
  const [availableSections, setAvailableSections] = useState<string[]>([])

  useEffect(() => {
    // Check which sections exist in DOM
    const existing = sections.filter(({ id }) => document.getElementById(id)).map(s => s.id)
    setAvailableSections(existing)

    if (existing.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        threshold: 0.3,
        rootMargin: '-180px 0px -50% 0px' // Account for sticky headers
      }
    )

    existing.forEach((sectionId) => {
      const element = document.getElementById(sectionId)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Account for sticky header + section nav
      const offset = window.innerWidth >= 768 ? 140 : 180 // desktop vs mobile
      const top = element.offsetTop - offset
      window.scrollTo({
        top,
        behavior: 'smooth'
      })
    }
  }

  if (availableSections.length === 0) return null

  return (
    <nav className="flex space-x-8 overflow-x-auto scrollbar-hide px-4 md:px-6">
      {sections.map(({ id, label }) => {
        if (!availableSections.includes(id)) return null
        
        return (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className={`border-b-2 whitespace-nowrap py-4 px-1 font-medium text-sm transition-colors mobile-touch-feedback ${
              activeSection === id
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {label}
          </button>
        )
      })}
    </nav>
  )
}