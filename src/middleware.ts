// src/middleware.ts - UPDATED FOR ENTERPRISE CMS
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSiteByDomain } from '@/lib/supabase/tenant-client'
import type { SiteConfig } from '@/lib/site-context'

// Route access control per site type
const ROUTE_ACCESS: Record<string, string[]> = {
  'directory': [
    '/', '/businesses', '/categories', '/search', '/about', '/contact',
    '/businesses/[slug]', '/categories/[slug]', '/dashboard', '/profile'
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
  
  // Check exact matches
  if (allowedRoutes.includes(pathname)) return true
  
  // Check dynamic routes
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

// ENTERPRISE: Check if route is a known Next.js route vs CMS page
function isKnownNextRoute(pathname: string): boolean {
  const knownRoutes = [
    '/businesses', '/categories', '/search', '/about', '/contact',
    '/dashboard', '/profile', '/login', '/register', '/auth',
    '/admin', '/api', '/debug', '/startup', '/saved', '/messages',
    '/_next', '/favicon.ico', '/robots.txt', '/sitemap.xml'
  ]
  
  // Check if it starts with any known route
  return knownRoutes.some(route => {
    if (pathname === route) return true
    if (pathname.startsWith(route + '/')) return true
    return false
  })
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // === SITE DETECTION ===
  const hostname = request.headers.get('host') || ''
  const searchDomain = hostname.replace(/^www\./, '')
  const pathname = request.nextUrl.pathname
  
  console.log('🔍 Middleware checking:', { hostname, searchDomain, pathname })
  
  let siteConfig: any = null
  
  try {
    siteConfig = await getSiteByDomain(searchDomain)
    console.log('🔍 Site found:', siteConfig ? {
      name: siteConfig.name,
      site_type: siteConfig.site_type,
      template: siteConfig.template
    } : 'No site')
  } catch (error) {
    console.error('🚨 Site lookup error:', error)
  }

  // === ENTERPRISE CMS ROUTE HANDLING ===
  if (siteConfig) {
    const siteType = siteConfig.site_type || 'directory'
    
    // Skip route check for admin, API, and auth routes
    const skipRoutes = ['/admin', '/api', '/login', '/register', '/auth', '/debug', '/_next']
    const shouldSkip = skipRoutes.some(route => pathname.startsWith(route))
    
    if (!shouldSkip) {
      // Check if it's a known Next.js route first
      const isKnownRoute = isKnownNextRoute(pathname)
      
      if (isKnownRoute) {
        // Check normal route access
        if (!isRouteAllowed(pathname, siteType)) {
          console.log('❌ Known route not allowed:', {
            pathname,
            siteType,
            siteName: siteConfig.name,
            allowedRoutes: ROUTE_ACCESS[siteType]
          })
          
          return NextResponse.redirect(new URL('/', request.url))
        }
      } else {
        // ENTERPRISE: Potential CMS page - let it through to be handled by [...slug]/page.tsx
        console.log('🟡 Potential CMS page, allowing through:', pathname)
        
        // Add CMS page header for dynamic route
        response.headers.set('x-potential-cms-page', 'true')
      }
    }
    
    // Add site context headers
    response.headers.set('x-site-id', siteConfig.id)
    response.headers.set('x-site-config', JSON.stringify(siteConfig))
    response.headers.set('x-site-domain', siteConfig.domain)
    console.log('✅ Site context added')
  } else {
    console.log('⚠️ No site found, allowing all routes (fallback)')
  }

  // === EXISTING AUTH LOGIC (UNCHANGED) ===
  const allCookies = request.cookies.getAll()
  const supabaseAuthCookies = allCookies.filter(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  )
  
  let session = null
  
  for (const authCookie of supabaseAuthCookies) {
    try {
      const cookieValue = decodeURIComponent(authCookie.value)
      let authData
      
      if (cookieValue.startsWith('[')) {
        authData = JSON.parse(cookieValue)
        if (authData[0]) {
          const jwt = authData[0]
          const payload = JSON.parse(atob(jwt.split('.')[1]))
          if (payload.exp > Date.now() / 1000) {
            session = { user: { id: payload.sub } }
            break
          }
        }
      } else if (cookieValue.startsWith('{')) {
        authData = JSON.parse(cookieValue)
        if (authData.access_token && authData.user) {
          try {
            const jwt = authData.access_token
            const payload = JSON.parse(atob(jwt.split('.')[1]))
            if (payload.exp > Date.now() / 1000) {
              session = { user: { id: authData.user.id } }
              break
            }
          } catch {
            session = { user: { id: authData.user.id } }
            break
          }
        }
      }
    } catch (error) {
      continue
    }
  }

  // Auth route logic (admin can access any site)
  if (session && isAuthRoute(pathname)) {
    // If already logged in and trying to access login pages, redirect appropriately
    if (pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin/sites', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!session && isProtectedRoute(pathname)) {
    // Admin routes should redirect to admin login  
    if (pathname.startsWith('/admin')) {
      const redirectUrl = new URL('/admin/login', request.url)
      redirectUrl.searchParams.set('redirect_to', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect_to', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

function isAuthRoute(pathname: string): boolean {
  const authRoutes = ['/login', '/register', '/auth/verify', '/forgot-password', '/admin/login']
  return authRoutes.some(route => pathname === route)
}

function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = ['/dashboard', '/businesses/add', '/profile']
  const adminRoutes = ['/admin']
  
  // /admin/login is NOT protected (public access)
  if (pathname === '/admin/login') return false
  
  // Other admin routes ARE protected
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isOtherProtected = protectedRoutes.some(route => pathname.startsWith(route))
  
  return isAdminRoute || isOtherProtected
}

// ENTERPRISE: Admin bypass for site restrictions
function isGlobalAdmin(session: any): boolean {
  // TODO: Add admin check logic here
  // For now, allow admin routes
  return false
}

// ENTERPRISE: Updated matcher to include all routes for CMS handling
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * This allows all routes to be checked for CMS pages
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}