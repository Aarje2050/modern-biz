// src/middleware.ts - ENTERPRISE OPTIMIZED VERSION
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSiteByDomain } from '@/lib/supabase/tenant-client'

// ENTERPRISE: In-memory cache for site lookups
interface SiteCache {
  siteConfig: any
  timestamp: number
  domain: string
  isFailed?: boolean
}

class SiteCacheManager {
  private cache = new Map<string, SiteCache>()
  private readonly TTL = 10 * 60 * 1000 // 10 minutes
  private readonly FAILURE_TTL = 2 * 60 * 1000 // 2 minutes for failures

  set(domain: string, siteConfig: any | null, isFailed = false) {
    this.cache.set(domain, {
      siteConfig,
      timestamp: Date.now(),
      domain,
      isFailed
    })
  }

  get(domain: string): { siteConfig: any | null; isFailed: boolean } | null {
    const cached = this.cache.get(domain)
    if (!cached) return null

    const ttl = cached.isFailed ? this.FAILURE_TTL : this.TTL
    const isExpired = Date.now() - cached.timestamp > ttl

    if (isExpired) {
      this.cache.delete(domain)
      return null
    }

    return { siteConfig: cached.siteConfig, isFailed: cached.isFailed || false }
  }

  has(domain: string): boolean {
    return this.get(domain) !== null
  }
}

const siteCache = new SiteCacheManager()

// ENTERPRISE: Development mode configuration
const isDevelopment = process.env.NODE_ENV === 'development'
const LOCALHOST_DOMAINS = ['localhost:3000', 'localhost:3001', '127.0.0.1:3000']

const ROUTE_ACCESS: Record<string, string[]> = {
  'directory': [
    '/', '/businesses', '/businesses/*', '/categories', '/categories/*', 
    '/search', '/about', '/contact', '/dashboard', '/dashboard/*', 
    '/profile', '/messages', '/messages/*', '/saved', '/reviews'
  ],
  'landing': [
    '/', '/about', '/contact'
  ],
  'service': [
    '/', '/services', '/about', '/contact', '/book'
  ],
  'static': [
    '/', '/about', '/contact', '/portfolio', '/blog'
  ]
}

function isRouteAllowed(pathname: string, siteType: string): boolean {
  const allowedRoutes = ROUTE_ACCESS[siteType] || ROUTE_ACCESS['directory']
  
  if (allowedRoutes.includes(pathname)) return true
  
  const wildcardMatch = allowedRoutes.some(route => {
    if (route.endsWith('/*')) {
      const basePath = route.slice(0, -2)
      return pathname.startsWith(basePath)
    }
    return false
  })
  if (wildcardMatch) return true
  
  return allowedRoutes.some(route => {
    if (route.includes('[') && route.includes(']')) {
      const routeParts = route.split('/')
      const pathParts = pathname.split('/')
      
      if (routeParts.length !== pathParts.length) return false
      
      return routeParts.every((part, i) => {
        if (part.startsWith('[') && part.endsWith(']')) return true
        return part === pathParts[i]
      })
    }
    return false
  })
}

function shouldSkipSiteDetection(pathname: string): boolean {
  const skipRoutes = [
    '/api/', '/_next/', '/favicon.ico', '/robots.txt', '/sitemap.xml',
    '/admin/login', '/login', '/register', '/auth/', '/verify', '/debug'
  ]
  
  return skipRoutes.some(route => pathname.startsWith(route))
}

function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = ['/dashboard', '/businesses/add', '/profile', '/saved', '/messages']
  
  if (pathname === '/admin/login') return false
  if (pathname.startsWith('/admin')) return true
  
  return protectedRoutes.some(route => pathname.startsWith(route))
}

function isAuthRoute(pathname: string): boolean {
  return ['/login', '/register', '/auth/verify', '/forgot-password'].includes(pathname)
}

// ENTERPRISE: Optimized session detection
function hasValidSession(request: NextRequest): boolean {
  try {
    const cookies = request.cookies.getAll()
    
    // Look for Supabase auth cookies
    const supabaseAuthCookie = cookies.find(cookie => 
      cookie.name.startsWith('sb-') && 
      cookie.name.endsWith('-auth-token') &&
      cookie.value && 
      cookie.value.length > 100
    )
    
    if (!supabaseAuthCookie) return false
    
    try {
      const cookieValue = decodeURIComponent(supabaseAuthCookie.value)
      let authData
      
      if (cookieValue.startsWith('[')) {
        const parsed = JSON.parse(cookieValue)
        if (Array.isArray(parsed) && parsed[0] && typeof parsed[0] === 'string') {
          authData = { access_token: parsed[0] }
        }
      } else if (cookieValue.startsWith('{')) {
        authData = JSON.parse(cookieValue)
      }
      
      if (authData?.access_token) {
        const tokenParts = authData.access_token.split('.')
        return tokenParts.length === 3
      }
      
      return false
    } catch {
      return false
    }
  } catch {
    return false
  }
}

// ENTERPRISE: Optimized site lookup with caching
async function getSiteConfigCached(hostname: string): Promise<any | null> {
  const searchDomain = hostname.replace(/^www\./, '')
  
  // ENTERPRISE: Handle localhost in development
  if (isDevelopment && LOCALHOST_DOMAINS.includes(searchDomain)) {
    return {
      id: 'localhost-dev',
      name: 'Development Site',
      domain: searchDomain,
      site_type: 'directory',
      template: 'modern',
      settings: {},
      is_active: true
    }
  }

  // Check cache first
  const cached = siteCache.get(searchDomain)
  if (cached) {
    return cached.siteConfig
  }

  try {
    const siteConfig = await getSiteByDomain(searchDomain)
    
    // Cache successful result
    siteCache.set(searchDomain, siteConfig, false)
    
    return siteConfig
  } catch (error) {
    console.log('⚠️ Middleware: Site lookup failed for', searchDomain)
    
    // Cache failure to prevent repeated lookups
    siteCache.set(searchDomain, null, true)
    
    return null
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // ENTERPRISE: Skip middleware for static files and API routes (except auth)
  if (pathname.startsWith('/_next/') || 
      pathname.includes('.') ||
      (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/'))) {
    return NextResponse.next()
  }
  
  console.log('🔄 Middleware: Processing', pathname)
  
  let response = NextResponse.next({
    request: { headers: request.headers }
  })

  // === ENTERPRISE: SMART SITE DETECTION ===
  let siteConfig: any = null
  
  // Only do site detection if we need it for route validation
  if (!shouldSkipSiteDetection(pathname)) {
    const hostname = request.headers.get('host') || ''
    
    try {
      siteConfig = await getSiteConfigCached(hostname)
      
      if (siteConfig) {
        const siteType = siteConfig.site_type || 'directory'
        
        // Only validate routes if we have a site config
        if (!isRouteAllowed(pathname, siteType)) {
          console.log('🚫 Middleware: Route not allowed for site type:', pathname, siteType)
          return NextResponse.redirect(new URL('/', request.url))
        }
        
        // Set site headers for the application
        response.headers.set('x-site-id', siteConfig.id)
        response.headers.set('x-site-config', JSON.stringify(siteConfig))
        response.headers.set('x-site-domain', siteConfig.domain)
      } else {
        // No site found - mark as potential CMS page for dynamic routing
        response.headers.set('x-potential-cms-page', 'true')
      }
    } catch (error) {
      console.error('❌ Middleware: Site detection error:', error)
      // Continue without site config on error
    }
  }

  // === ENTERPRISE: SMART AUTH LOGIC ===
  const hasSession = hasValidSession(request)

  // Only check auth for routes that actually need it
  if (isAuthRoute(pathname) || isProtectedRoute(pathname)) {
    if (hasSession && isAuthRoute(pathname)) {
      console.log('🔄 Middleware: Authenticated user accessing auth page, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (!hasSession && isProtectedRoute(pathname)) {
      console.log('🔄 Middleware: Unauthenticated user accessing protected route, redirecting to login')
      
      if (pathname.startsWith('/admin')) {
        const redirectUrl = new URL('/admin/login', request.url)
        redirectUrl.searchParams.set('redirect_to', pathname)
        return NextResponse.redirect(redirectUrl)
      }
      
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect_to', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  console.log('✅ Middleware: Allowing access to', pathname)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}