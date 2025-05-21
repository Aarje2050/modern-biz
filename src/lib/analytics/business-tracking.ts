// src/lib/analytics/business-tracking.ts

import { Analytics } from './client'

// Track specific business interactions
export const BusinessTracking = {
  // Track when a user views business details
  viewBusiness: (businessId: string) => {
    Analytics.trackBusinessInteraction(businessId, 'view_details')
  },
  
  // Track when a user clicks to contact a business
  contactBusiness: (businessId: string, method: 'phone' | 'email' | 'website') => {
    Analytics.trackBusinessInteraction(businessId, 'contact', { method })
  },
  
  // Track when a user saves a business
  saveBusiness: (businessId: string) => {
    Analytics.trackBusinessInteraction(businessId, 'save')
  },
  
  // Track when a user shares a business
  shareBusiness: (businessId: string, platform: string) => {
    Analytics.trackBusinessInteraction(businessId, 'share', { platform })
  },
  
  // Track when a user views business photos
  viewBusinessPhotos: (businessId: string) => {
    Analytics.trackBusinessInteraction(businessId, 'view_photos')
  }
}