// src/middleware.ts - CONSERVATIVE VERSION (NO FALSE POSITIVES)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ===============================
// CONFIGURATION
// ===============================

const isDev = process.env.NODE_ENV === 'development'
const LOCALHOST_DOMAINS = ['localhost:3000', 'localhost:3001', '127.0.0.1:3000']

// Routes that require authentication - ONLY protect truly sensitive routes
const PROTECTED_ROUTES = [
  '/dashboard/businesses/add', // Specific business creation
  '/dashboard/settings',       // User settings
  '/profile/edit',            // Profile editing
  '/admin'                    // Admin routes (except login)
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
  
  // Check specific protected routes only
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
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

function hasStrongAuthCookie(request: NextRequest): boolean {
  try {
    const cookies = request.cookies.getAll()
    
    // CONSERVATIVE: Only return true if we find a substantial, recent-looking auth token
    const authCookie = cookies.find(cookie => {
      const name = cookie.name
      const value = cookie.value
      
      return (
        name.startsWith('sb-') && 
        name.includes('auth-token') &&
        value && 
        value.length > 100 && // Much more conservative - need substantial token
        value !== 'undefined' &&
        value !== 'null' &&
        !value.includes('null') && // Additional safety check
        value.includes('.') && // JWT tokens have dots
        value.split('.').length >= 3 // Basic JWT structure check
      )
    })
    
    if (authCookie) {
      console.log(`🍪 [MIDDLEWARE-AUTH] Strong auth cookie found: ${authCookie.name}`)
      return true
    }
    
    console.log(`🚫 [MIDDLEWARE-AUTH] No strong auth cookies found`)
    return false
  } catch (error) {
    console.error('❌ [MIDDLEWARE-AUTH] Cookie check error:', error)
    return false
  }
}

function log(message: string, data?: any) {
  console.log(`🛡️ [MIDDLEWARE] ${message}`, data || '')
}

// ===============================
// MAIN MIDDLEWARE
// ===============================

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hostname = request.headers.get('host') || ''
  
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
    const { getSiteByDomain } = await import('@/lib/supabase/tenant-client')
    const searchDomain = hostname.replace(/^www\./, '')
    
    console.log(`🛡️ [MIDDLEWARE-LOOKUP] Searching for domain: ${searchDomain}`)
    const siteConfig = await getSiteByDomain(searchDomain)
    
    if (siteConfig) {
      console.log(`🛡️ [MIDDLEWARE-FOUND] Site: ${siteConfig.name}, Type: ${(siteConfig as any).site_type}`)
      response.headers.set('x-site-id', siteConfig.id)
      response.headers.set('x-site-config', JSON.stringify(siteConfig))
      response.headers.set('x-site-domain', siteConfig.domain)
      
      // Route access validation
      const siteType = (siteConfig as any).site_type || 'directory'
      const routeAllowed = isRouteAllowedForSiteType(pathname, siteType)
      
      console.log(`🛡️ [MIDDLEWARE-ROUTE] Path: ${pathname}, SiteType: ${siteType}, Allowed: ${routeAllowed}`)
      
      if (!routeAllowed) {
        console.log(`🛡️ [MIDDLEWARE-REDIRECT] Route ${pathname} not allowed for site type ${siteType}`)
        return NextResponse.redirect(new URL('/', request.url))
      }
      
    } else {
      // Development fallback
      if (isDev && LOCALHOST_DOMAINS.includes(hostname)) {
        console.log(`🛡️ [MIDDLEWARE-DEV-FALLBACK] Trying ductcleaningca.com for localhost`)
        
        try {
          const prodSiteConfig = await getSiteByDomain('ductcleaningca.com')
          
          if (prodSiteConfig) {
            console.log(`🛡️ [MIDDLEWARE-DEV-FOUND] Using production site for development`)
            response.headers.set('x-site-id', prodSiteConfig.id)
            response.headers.set('x-site-config', JSON.stringify(prodSiteConfig))
            response.headers.set('x-site-domain', 'localhost:3000')
          } else {
            console.log(`🛡️ [MIDDLEWARE-DEV-NOTFOUND] Production site not found either`)
            response.headers.set('x-site-domain', hostname)
          }
        } catch (devError) {
          console.log(`🛡️ [MIDDLEWARE-DEV-ERROR] Development fallback error:`, devError)
          response.headers.set('x-site-domain', hostname)
        }
      } else {
        console.log(`🛡️ [MIDDLEWARE-NOTFOUND] No site found for domain: ${searchDomain}`)
        response.headers.set('x-site-domain', hostname)
      }
    }
  } catch (error) {
    console.log(`🛡️ [MIDDLEWARE-ERROR] Database error:`, error)
    response.headers.set('x-site-domain', hostname)
  }

  // ===============================
  // CONSERVATIVE AUTH CHECK
  // ===============================
  
  const hasSession = hasStrongAuthCookie(request)
  console.log(`🛡️ [MIDDLEWARE-AUTH] Auth status: ${hasSession ? 'authenticated' : 'not authenticated'}`)

  // REMOVED: Auth route redirects - let frontend handle this
  // The issue was here - middleware was redirecting /login when it shouldn't

  // Handle only truly protected routes
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
    
    console.log(`🛡️ [MIDDLEWARE-PROTECT-ALLOW] Authenticated, allowing access to protected route`)
    return response
  }

  // ALLOW ALL OTHER ROUTES - let frontend handle auth logic
  console.log(`🛡️ [MIDDLEWARE-ALLOW] Allowing access to route: ${pathname}`)
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