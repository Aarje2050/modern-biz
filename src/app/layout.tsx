// src/app/layout.tsx (REPLACE YOUR CURRENT)
'use client'
import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import AuthProvider from '@/providers/auth-provider'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { track } from '@/lib/analytics'
import EmailProcessorStarter from '@/components/email-processor-starter'


const inter = Inter({ subsets: ['latin'] })

function SimpleTracker() {
  const pathname = usePathname()
  
  useEffect(() => {
    if (pathname.startsWith('/businesses/')) {
      const slug = pathname.split('/')[2]
      if (slug) track.pageView('business', slug)
    }
    if (pathname.startsWith('/categories/')) {
      const slug = pathname.split('/')[2] 
      if (slug) track.pageView('category', slug)
    }
  }, [pathname])
  
  return null
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SimpleTracker />
          <EmailProcessorStarter />
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}