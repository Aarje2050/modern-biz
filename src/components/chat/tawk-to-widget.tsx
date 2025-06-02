// src/components/chat/tawk-to-widget.tsx (UPDATED FOR MULTI-SITE)
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSiteContext } from '@/providers/app-provider'
import { getTawkConfigForSite } from '@/config/tawk-config'

declare global {
  interface Window {
    Tawk_API?: any
    Tawk_LoadStart?: Date
  }
}

export default function TawkToWidget() {
  const { siteConfig } = useSiteContext()
  const pathname = usePathname()
  
  // Define paths where widget should NOT appear
  const excludedPaths = [
    '/admin',
    '/login', 
    '/register',
    '/dashboard',
    '/api',
    '/auth',
    '/verify'
  ]
  
  // Check if current path should show widget
  const shouldShowWidget = () => {
    // Don't show on excluded paths
    if (excludedPaths.some(excluded => pathname.startsWith(excluded))) {
      return false
    }
    
    // Show on all other paths (homepage, businesses, categories, etc.)
    return true
  }
  
  useEffect(() => {
    // Get site-specific Tawk configuration
    const tawkConfig = siteConfig?.id ? getTawkConfigForSite(siteConfig.id) : null
    
    // Only proceed if all conditions are met
    if (!shouldShowWidget() || !tawkConfig || !siteConfig?.id) {
      return
    }
    
    const { propertyId, widgetId } = tawkConfig
    
    // Prevent multiple instances
    if (window.Tawk_API) {
      return
    }
    
    // Initialize Tawk.to
    window.Tawk_API = window.Tawk_API || {}
    window.Tawk_LoadStart = new Date()
    
    // Create and inject script with site-specific widget
    const script = document.createElement('script')
    script.async = true
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`
    script.charset = 'UTF-8'
    script.setAttribute('crossorigin', '*')
    
    // Add mobile-responsive styles for bottom navigation
    const style = document.createElement('style')
    style.id = 'tawk-mobile-styles'
    style.textContent = `
      /* Mobile: Move entire Tawk iframe up */
      @media (max-width: 768px) {
        iframe[src*="tawk.to"] {
          bottom: 80px !important;
          position: fixed !important;
        }
      }
    `
    
    // Append styles and script
    document.head.appendChild(style)
    document.head.appendChild(script)
    
    // Optional: Configure Tawk.to settings
    window.Tawk_API.onLoad = function() {
      console.log(`Tawk.to chat widget loaded for site: ${siteConfig.name}`)
    }
    
    // Cleanup function
    return () => {
      // Remove Tawk.to elements
      const tawkElements = document.querySelectorAll('[id*="tawk"], [class*="tawk"]')
      tawkElements.forEach(element => element.remove())
      
      // Remove script
      const existingScript = document.querySelector(`script[src*="${propertyId}"]`)
      if (existingScript) {
        existingScript.remove()
      }
      
      // Remove styles
      const existingStyle = document.getElementById('tawk-mobile-styles')
      if (existingStyle) {
        existingStyle.remove()
      }
      
      // Clear Tawk.to globals
      if (window.Tawk_API) {
        delete window.Tawk_API
        delete window.Tawk_LoadStart
      }
    }
  }, [pathname, siteConfig?.id, siteConfig?.name])
  
  // Component doesn't render anything visible
  return null
}