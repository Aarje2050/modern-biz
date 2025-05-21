// src/components/analytics/business-tracking-script.tsx

'use client'

import { useEffect } from 'react'
import { BusinessTracking } from '@/lib/analytics/business-tracking'

export default function BusinessTrackingScript({ businessId }: { businessId: string }) {
  useEffect(() => {
    // Track page view when component mounts
    BusinessTracking.viewBusiness(businessId)
    
    // Set up event listeners
    const contactButtons = document.querySelectorAll('[data-contact-method]')
    contactButtons.forEach(button => {
      button.addEventListener('click', () => {
        const method = button.getAttribute('data-contact-method')
        if (method === 'phone' || method === 'email' || method === 'website') {
          BusinessTracking.contactBusiness(businessId, method)
        }
      })
    })
    
    // Track save button clicks
    const saveButton = document.querySelector('[data-save-business]')
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        BusinessTracking.saveBusiness(businessId)
      })
    }
    
    // Track photo gallery views
    const photoGallery = document.querySelector('[data-photo-gallery]')
    if (photoGallery) {
      photoGallery.addEventListener('click', () => {
        BusinessTracking.viewBusinessPhotos(businessId)
      })
    }
    
    // Cleanup event listeners on unmount
    return () => {
      contactButtons.forEach(button => {
        button.removeEventListener('click', () => {})
      })
      
      if (saveButton) {
        saveButton.removeEventListener('click', () => {})
      }
      
      if (photoGallery) {
        photoGallery.removeEventListener('click', () => {})
      }
    }
  }, [businessId])
  
  // This component doesn't render anything
  return null
}