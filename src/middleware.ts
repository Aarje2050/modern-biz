// src/middleware.ts - COMPLETE FIXED VERSION WITH DEV FALLBACK
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ===============================
// CONFIGURATION
// ===============================

const isDev = process.env.NODE_ENV === 'development'
const LOCALHOST_DOMAINS = ['localhost:3000', 'localhost:3001', '127.0.0.1:3000']

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/businesses/add', 
  '/profile',
  '/saved',
  '/messages'
]

// Auth routes (redirect to dashboard if already logged in)
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/auth/verify',
  '/forgot-password'
]

// Routes that should skip all middleware processing
const SKIP_ROUTES = [
  '/_next/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/api/' // We'll handle API auth separately
]

// Route access control by site type
const ROUTE_ACCESS: Record<string, string[]> = {
  'directory': [
    '/', '/businesses', '/businesses/*', '/categories', '/categories/*', 
    '/search', '/about', '/contact', '/dashboard', '/dashboard/*', 
    '/profile', '/messages', '/messages/*', '/saved', '/reviews',
    '/login', '/register', '/auth/*', '/admin', '/admin/*', '/locations', '/locations/*'
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

// ===============================
// HELPER FUNCTIONS
// ===============================

function shouldSkipMiddleware(pathname: string): boolean {
  return SKIP_ROUTES.some(route => pathname.startsWith(route)) ||
         pathname.includes('.') // Skip files with extensions
}

function isProtectedRoute(pathname: string): boolean {
  // Admin routes are always protected (except login)
  if (pathname === '/admin/login') return false
  if (pathname.startsWith('/admin')) return true
  
  // Check other protected routes
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname)
}

function isRouteAllowedForSiteType(pathname: string, siteType: string): boolean {
  const allowedRoutes = ROUTE_ACCESS[siteType] || ROUTE_ACCESS['directory']
  
  // Exact match
  if (allowedRoutes.includes(pathname)) return true
  
  // Wildcard match (e.g., '/businesses/*' matches '/businesses/slug')
  const wildcardMatch = allowedRoutes.some(route => {
    if (route.endsWith('/*')) {
      const basePath = route.slice(0, -2)
      return pathname.startsWith(basePath)
    }
    return false
  })
  
  return wildcardMatch
}

function hasValidAuthCookie(request: NextRequest): boolean {
  try {
    const cookies = request.cookies.getAll()
    
    // Look for Supabase auth cookie
    const authCookie = cookies.find(cookie => 
      cookie.name.startsWith('sb-') && 
      cookie.name.endsWith('-auth-token') &&
      cookie.value && 
      cookie.value.length > 50 // Basic length check
    )
    
    return !!authCookie
  } catch {
    return false
  }
}

function createDevSiteHeaders(): Record<string, string> {
  return {
    'x-site-id': 'localhost-dev',
    'x-site-config': JSON.stringify({
      id: 'localhost-dev',
      name: 'Development Site',
      domain: 'localhost:3000',
      site_type: 'directory',
      template: 'modern',
      config: {},
      status: 'active'
    }),
    'x-site-domain': 'localhost:3000'
  }
}

function log(message: string, data?: any) {
  // Always log in production for debugging
  console.log(`🛡️ [MIDDLEWARE] ${message}`, data || '')
}

// ===============================
// MAIN MIDDLEWARE
// ===============================

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hostname = request.headers.get('host') || ''
  
  // Always log in production for debugging
  console.log(`🛡️ [MIDDLEWARE-START] ${hostname}${pathname}`)
  
  // Skip middleware for static files and API routes
  if (shouldSkipMiddleware(pathname)) {
    console.log(`🛡️ [MIDDLEWARE-SKIP] ${pathname}`)
    return NextResponse.next()
  }
  
  log(`Processing request: ${pathname}`)
  
  // Create response
  const response = NextResponse.next({
    request: { headers: request.headers }
  })

  // ===============================
  // SITE HEADERS - TRY DATABASE FIRST
  // ===============================
  
  try {
    // Always try to get real site from database
    const { getSiteByDomain } = await import('@/lib/supabase/tenant-client')
    const searchDomain = hostname.replace(/^www\./, '')
    
    console.log(`🛡️ [MIDDLEWARE-LOOKUP] Searching for domain: ${searchDomain}`)
    const siteConfig = await getSiteByDomain(searchDomain)
    
    if (siteConfig) {
      // Real site found - set real headers
      console.log(`🛡️ [MIDDLEWARE-FOUND] Site: ${siteConfig.name}, Type: ${(siteConfig as any).site_type}`)
      response.headers.set('x-site-id', siteConfig.id)
      response.headers.set('x-site-config', JSON.stringify(siteConfig))
      response.headers.set('x-site-domain', siteConfig.domain)
      
      // ===============================
      // ROUTE ACCESS VALIDATION BY SITE TYPE
      // ===============================
      
      const siteType = (siteConfig as any).site_type || 'directory'
      const routeAllowed = isRouteAllowedForSiteType(pathname, siteType)
      
      console.log(`🛡️ [MIDDLEWARE-ROUTE] Path: ${pathname}, SiteType: ${siteType}, Allowed: ${routeAllowed}`)
      
      if (!routeAllowed) {
        console.log(`🛡️ [MIDDLEWARE-REDIRECT] Route ${pathname} not allowed for site type ${siteType}`)
        return NextResponse.redirect(new URL('/', request.url))
      }
      
    } else {
      // No site found - check for development fallback
      if (isDev && LOCALHOST_DOMAINS.includes(hostname)) {
        console.log(`🛡️ [MIDDLEWARE-DEV-FALLBACK] Trying ductcleaningca.com for localhost`)
        
        try {
          const prodSiteConfig = await getSiteByDomain('ductcleaningca.com')
          
          if (prodSiteConfig) {
            console.log(`🛡️ [MIDDLEWARE-DEV-FOUND] Using production site for development`)
            response.headers.set('x-site-id', prodSiteConfig.id)
            response.headers.set('x-site-config', JSON.stringify(prodSiteConfig))
            response.headers.set('x-site-domain', 'localhost:3000') // Keep localhost for dev
            
            // Apply same route validation for dev fallback
            const siteType = (prodSiteConfig as any).site_type || 'directory'
            const routeAllowed = isRouteAllowedForSiteType(pathname, siteType)
            
            console.log(`🛡️ [MIDDLEWARE-DEV-ROUTE] Path: ${pathname}, SiteType: ${siteType}, Allowed: ${routeAllowed}`)
            
            if (!routeAllowed) {
              console.log(`🛡️ [MIDDLEWARE-DEV-REDIRECT] Route ${pathname} not allowed for site type ${siteType}`)
              return NextResponse.redirect(new URL('/', request.url))
            }
          } else {
            console.log(`🛡️ [MIDDLEWARE-DEV-NOTFOUND] Production site not found either`)
            response.headers.set('x-site-domain', hostname)
          }
        } catch (devError) {
          console.log(`🛡️ [MIDDLEWARE-DEV-ERROR] Development fallback error:`, devError)
          response.headers.set('x-site-domain', hostname)
        }
      } else {
        // Production - no site found
        console.log(`🛡️ [MIDDLEWARE-NOTFOUND] No site found for domain: ${searchDomain}`)
        response.headers.set('x-site-domain', hostname)
      }
    }
  } catch (error) {
    // Database error - fallback
    console.log(`🛡️ [MIDDLEWARE-ERROR] Database error:`, error)
    response.headers.set('x-site-domain', hostname)
  }

  // ===============================
  // SIMPLE AUTH CHECK
  // ===============================
  
  const hasSession = hasValidAuthCookie(request)
  console.log(`🛡️ [MIDDLEWARE-AUTH] Auth status: ${hasSession ? 'authenticated' : 'not authenticated'}`)

  // Handle auth routes (login, register, etc.)
  if (isAuthRoute(pathname)) {
    if (hasSession) {
      console.log(`🛡️ [MIDDLEWARE-AUTH-REDIRECT] Authenticated user accessing auth page, redirecting to dashboard`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Not authenticated and accessing auth page - allow
    console.log(`🛡️ [MIDDLEWARE-AUTH-ALLOW] Not authenticated, allowing access to auth page`)
    return response
  }

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!hasSession) {
      console.log(`🛡️ [MIDDLEWARE-PROTECT-REDIRECT] Not authenticated, redirecting to login`)
      
      if (pathname.startsWith('/admin')) {
        const redirectUrl = new URL('/admin/login', request.url)
        redirectUrl.searchParams.set('redirect_to', pathname)
        return NextResponse.redirect(redirectUrl)
      }
      
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect_to', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Authenticated and accessing protected route - allow
    console.log(`🛡️ [MIDDLEWARE-PROTECT-ALLOW] Authenticated, allowing access to protected route`)
    return response
  }

  // Public route - allow
  console.log(`🛡️ [MIDDLEWARE-ALLOW] Public route, allowing access`)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}