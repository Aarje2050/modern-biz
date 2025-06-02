// src/config/tawk-config.ts
// Multi-site Tawk.to widget configuration

export interface TawkConfig {
    propertyId: string
    widgetId: string
    enabled: boolean
  }
  
  export interface SiteTawkMapping {
    [siteId: string]: TawkConfig
  }
  
  // Configure Tawk.to widgets for different sites
  export const TAWK_SITE_CONFIG: SiteTawkMapping = {
    // Example site configurations
    'ddbe72dd-4c87-4b60-8d72-a21b3c9f90cd': {
      propertyId: '663486aea0c6737bd133e0b3',
      widgetId: '1hsuis76m', // Replace with actual widget ID
      enabled: true
    },
    
    'site_id_2': {
      propertyId: 'another_property_id',
      widgetId: 'another_widget_id',
      enabled: true
    },
    
    'site_id_3': {
      propertyId: 'third_property_id', 
      widgetId: 'third_widget_id',
      enabled: false // Temporarily disabled
    },
    
    // Add more sites as needed...
    // 'your_actual_site_id': {
    //   propertyId: 'your_property_id',
    //   widgetId: 'your_widget_id',
    //   enabled: true
    // }
  }
  
  // Helper function to get Tawk config for a site
  export function getTawkConfigForSite(siteId: string): TawkConfig | null {
    const config = TAWK_SITE_CONFIG[siteId]
    
    // Return config only if enabled
    if (config && config.enabled) {
      return config
    }
    
    return null
  }
  
  // Helper function to check if Tawk is enabled for a site
  export function isTawkEnabledForSite(siteId: string): boolean {
    const config = TAWK_SITE_CONFIG[siteId]
    return config ? config.enabled : false
  }