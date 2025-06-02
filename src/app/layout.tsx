// src/app/layout.tsx - UPDATED WITH SITE-AWARE SEO
import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import AppProvider from '@/providers/app-provider'
import SiteAwareLayout from '@/components/layout/SiteAwareLayout'
import ClientLayout from './client-layout'
import { Toaster } from 'react-hot-toast'
import { getCurrentSite } from '@/lib/site-context'
import { generateSiteMetadata } from '@/lib/seo/service'

// CRITICAL: Force dynamic rendering for multi-tenant architecture
export const dynamic = 'force-dynamic'
export const revalidate = 0

const inter = Inter({ subsets: ['latin'] })

// ENTERPRISE: Site-aware metadata generation
export async function generateMetadata(): Promise<Metadata> {
  try {
    // Get current site context
    const siteConfig = getCurrentSite()
    
    // Use centralized SEO service
    const metadata = generateSiteMetadata(siteConfig)
    
    // Add global defaults that work for all sites
    const enhancedMetadata: Metadata = {
      ...metadata,
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
      },
      // Additional meta tags for better SEO
      other: {
        'theme-color': siteConfig?.config?.theme?.primaryColor || '#dc2626',
        'color-scheme': 'light',
        'mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'default',
        'apple-mobile-web-app-title': siteConfig?.name || 'Business Directory',
        'application-name': siteConfig?.name || 'Business Directory',
        'msapplication-TileColor': siteConfig?.config?.theme?.primaryColor || '#dc2626',
        'msapplication-config': '/browserconfig.xml',
      }
    }
    
    return enhancedMetadata
  } catch (error) {
    console.error('Layout metadata generation error:', error)
    
    // Fallback metadata
    return {
      title: {
        template: '%s | Business Directory',
        default: 'Business Directory - Find Local Services',
      },
      description: 'Discover and connect with local business services in your area.',
      keywords: ['business directory', 'local services', 'reviews', 'business listings'],
      authors: [{ name: 'Business Directory' }],
      creator: 'Business Directory',
      openGraph: {
        type: 'website',
        locale: 'en_US',
        siteName: 'Business Directory',
      },
      twitter: {
        card: 'summary_large_image',
      },
      robots: {
        index: true,
        follow: true,
      },
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preload critical fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured data will be injected by pages */}
      </head>
      <body className={`${inter.className} bg-gray-50 antialiased`}>
        {/* Toast notifications */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />

        {/* App providers */}
        <AppProvider>
          <SiteAwareLayout>
            <ClientLayout>
              <div className="flex flex-col min-h-screen">
                <main className="flex-grow">
                  {children}
                </main>
              </div>
            </ClientLayout>
          </SiteAwareLayout>
        </AppProvider>
      </body>
    </html>
  )
}