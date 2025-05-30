// src/middleware.ts - FIXED VERSION
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSiteByDomain } from '@/lib/supabase/tenant-client'

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

function isKnownNextRoute(pathname: string): boolean {
  const knownRoutes = [
    '/businesses', '/categories', '/search', '/about', '/contact',
    '/dashboard', '/profile', '/login', '/register', '/auth', '/verify',
    '/admin', '/api', '/debug', '/startup', '/saved', '/messages',
    '/_next', '/favicon.ico', '/robots.txt', '/sitemap.xml'
  ]
  
  return knownRoutes.some(route => {
    if (pathname === route) return true
    if (pathname.startsWith(route + '/')) return true
    return false
  })
}

function isAuthRoute(pathname: string): boolean {
  return ['/login', '/register', '/auth/verify', '/forgot-password'].includes(pathname)
}

function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = ['/dashboard', '/businesses/add', '/profile', '/saved', '/messages']
  
  if (pathname === '/admin/login') return false
  if (pathname.startsWith('/admin')) return true
  
  return protectedRoutes.some(route => pathname.startsWith(route))
}

// FIXED: Proper Supabase session detection
function hasValidSession(request: NextRequest): boolean {
  try {
    const cookies = request.cookies.getAll()
    console.log('🔍 Middleware: Checking for auth cookies...')
    
    // Look for Supabase auth cookies with pattern: sb-{project-id}-auth-token
    const supabaseAuthCookie = cookies.find(cookie => 
      cookie.name.startsWith('sb-') && 
      cookie.name.endsWith('-auth-token') &&
      cookie.value && 
      cookie.value.length > 100 // Valid tokens are long
    )
    
    if (!supabaseAuthCookie) {
      console.log('❌ Middleware: No Supabase auth cookie found')
      return false
    }
    
    console.log('✅ Middleware: Found auth cookie:', supabaseAuthCookie.name.substring(0, 20) + '...')
    
    try {
      // Try to parse the cookie value
      let authData
      const cookieValue = decodeURIComponent(supabaseAuthCookie.value)
      
      // Handle both array format and object format
      if (cookieValue.startsWith('[')) {
        // Array format: ["token", "refresh_token", null, null, null]
        const parsed = JSON.parse(cookieValue)
        if (Array.isArray(parsed) && parsed[0] && typeof parsed[0] === 'string') {
          authData = { access_token: parsed[0] }
        }
      } else if (cookieValue.startsWith('{')) {
        // Object format: {"access_token": "...", "user": {...}}
        authData = JSON.parse(cookieValue)
      }
      
      if (authData?.access_token) {
        // Basic JWT structure check
        const tokenParts = authData.access_token.split('.')
        if (tokenParts.length === 3) {
          console.log('✅ Middleware: Valid session detected')
          return true
        }
      }
      
      console.log('❌ Middleware: Invalid token structure')
      return false
      
    } catch (parseError) {
      console.log('❌ Middleware: Error parsing auth cookie:', parseError)
      return false
    }
    
  } catch (error) {
    console.log('❌ Middleware: Error checking session:', error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip middleware for API routes, static files
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') || 
      pathname.includes('.')) {
    return NextResponse.next()
  }
  
  console.log('🔄 Middleware: Processing', pathname)
  
  let response = NextResponse.next({
    request: { headers: request.headers }
  })

  // === SITE DETECTION ===
  const hostname = request.headers.get('host') || ''
  const searchDomain = hostname.replace(/^www\./, '')
  
  let siteConfig: any = null
  
  try {
    siteConfig = await getSiteByDomain(searchDomain)
  } catch (error) {
    console.log('⚠️ Middleware: Site lookup error for', searchDomain)
  }

  if (siteConfig) {
    const siteType = siteConfig.site_type || 'directory'
    
    const skipRoutes = ['/admin', '/login', '/register', '/auth', '/verify', '/debug']
    const shouldSkip = skipRoutes.some(route => pathname.startsWith(route))
    
    if (!shouldSkip) {
      const isKnownRoute = isKnownNextRoute(pathname)
      
      if (isKnownRoute && !isRouteAllowed(pathname, siteType)) {
        console.log('🚫 Middleware: Route not allowed for site type:', pathname, siteType)
        return NextResponse.redirect(new URL('/', request.url))
      } else if (!isKnownRoute) {
        response.headers.set('x-potential-cms-page', 'true')
      }
    }
    
    response.headers.set('x-site-id', siteConfig.id)
    response.headers.set('x-site-config', JSON.stringify(siteConfig))
    response.headers.set('x-site-domain', siteConfig.domain)
  }

  // === FIXED AUTH LOGIC ===
  const hasSession = hasValidSession(request)
  console.log('🔐 Middleware: Session status:', hasSession ? 'AUTHENTICATED' : 'NOT AUTHENTICATED')

  // If authenticated user tries to access auth pages, redirect to dashboard
  if (hasSession && isAuthRoute(pathname)) {
    console.log('🔄 Middleware: Authenticated user accessing auth page, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If unauthenticated user tries to access protected pages, redirect to login
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

  console.log('✅ Middleware: Allowing access to', pathname)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}