// src/app/layout.tsx - FIXED TO USE UNIFIED PROVIDER
import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import AppProvider from '@/providers/app-provider'
import SiteAwareLayout from '@/components/layout/SiteAwareLayout'
import ClientLayout from './client-layout'

// CRITICAL: Force dynamic rendering for multi-tenant architecture
export const dynamic = 'force-dynamic'
export const revalidate = 0

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      template: '%s | BusinessDir',
      default: 'BusinessDir - Find Local Business Services',
    },
    description: 'Discover and connect with local business services in your area.',
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    keywords: ['business directory', 'local services', 'reviews', 'business listings'],
    authors: [{ name: 'BusinessDir' }],
    creator: 'BusinessDir',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: 'BusinessDir',
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@businessdir',
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
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-gray-50`}>
        {/* FIXED: Using unified AppProvider instead of AuthProvider */}
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