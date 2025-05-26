// src/app/layout.tsx (Mobile App-Style Layout)
import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import AuthProvider from '@/providers/auth-provider'
import ClientLayout from './client-layout'

const inter = Inter({ subsets: ['latin'] })

// Move metadata generation to a separate function
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
          <ClientLayout>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow pb-16 md:pb-0">
                {children}
              </main>
              {/* Footer - hidden on mobile, shown on desktop */}
              <div className="hidden md:block">
                <Footer />
              </div>
            </div>
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  )
}