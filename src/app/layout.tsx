// src/app/layout.tsx (EMERGENCY FIX - Simplified)
import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
// TEMPORARILY REMOVED: SiteAwareLayout and SiteAwareAuthProvider
import AuthProvider from '@/providers/auth-provider'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import SiteAwareLayout from '@/components/layout/SiteAwareLayout'
import {SiteAwareAuthProvider} from '@/providers/SiteAwareAuthProvider'




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
      
        <AuthProvider>
        <SiteAwareAuthProvider>

        <SiteAwareLayout>
        
        
          {/* SIMPLIFIED: No site-aware wrappers for now */}
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
              {children}
            </main>
          </div>
          
          </SiteAwareLayout>
          </SiteAwareAuthProvider>
        </AuthProvider>
        
      </body>
    </html>
  )
}