// src/components/layout/SiteLayout.tsx - ENHANCED LAYOUT WITH MENU SYSTEM
import { getCurrentSiteId } from '@/lib/site-context'
import MenuRenderer from './MenuRenderer'
import Link from 'next/link'

interface SiteLayoutProps {
  children: React.ReactNode
}

export default async function SiteLayout({ children }: SiteLayoutProps) {
  const siteConfig = getCurrentSiteId()
  
  if (!siteConfig) {
    return <div className="min-h-screen bg-gray-100">{children}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Enterprise Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Site Name */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {siteConfig.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block">
                  {siteConfig.name}
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <MenuRenderer 
                location="header" 
                style="horizontal"
                className="flex items-center space-x-6"
              />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                className="p-2 text-gray-600 hover:text-gray-900"
                onClick={() => {
                  const mobileMenu = document.getElementById('mobile-menu')
                  mobileMenu?.classList.toggle('hidden')
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div id="mobile-menu" className="hidden md:hidden pb-4">
            <MenuRenderer 
              location="mobile" 
              style="dropdown"
              className="border-t pt-4"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Enterprise Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Site Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {siteConfig.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-xl font-bold">{siteConfig.name}</span>
              </div>
              <p className="text-gray-300 mb-4">
                {getSiteDescription(siteConfig)}
              </p>
              <div className="flex items-center space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Footer Menu */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <MenuRenderer 
                location="footer" 
                style="vertical"
                className="space-y-2"
              />
            </div>

            {/* Additional Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                {siteConfig.site_type === 'directory' && (
                  <>
                    <li><Link href="/businesses/add" className="hover:text-white">Add Business</Link></li>
                    <li><Link href="/categories" className="hover:text-white">Categories</Link></li>
                  </>
                )}
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
              </p>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <span className="text-gray-400 text-sm">
                  Powered by Enterprise CMS
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper function to get site description based on type and config
function getSiteDescription(siteConfig: any) {
  const { site_type, config } = siteConfig
  const niche = config?.niche || 'business'
  const location = config?.location || ''
  
  switch (site_type) {
    case 'directory':
      return `Find the best ${niche} services${location ? ` in ${location}` : ''}. Browse reviews, compare options, and connect with local professionals.`
    case 'service':
      return `Professional ${niche} services${location ? ` in ${location}` : ''}. Licensed, insured, and committed to excellence.`
    case 'landing':
      return `Transform your business with our premium ${niche} solutions. Get started today.`
    default:
      return `Welcome to ${siteConfig.name}. Discover our services and connect with us.`
  }
}