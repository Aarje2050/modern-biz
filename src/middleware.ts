// src/middleware.ts (Fixed Domain Matching)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSiteByDomain } from '@/lib/supabase/tenant-client'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // === SITE DETECTION (FIXED) ===
  const hostname = request.headers.get('host') || ''
  
  // DON'T remove port for localhost - keep full hostname
  const searchDomain = hostname.replace(/^www\./, '') // Only remove www, keep port
  
  let siteConfig = null
  
  try {
    siteConfig = await getSiteByDomain(searchDomain)
  } catch (error) {
  }

  if (siteConfig) {
    // Add site context to response headers
    response.headers.set('x-site-id', siteConfig.id)
    response.headers.set('x-site-config', JSON.stringify(siteConfig))
    response.headers.set('x-site-domain', siteConfig.domain)
  } else {
  }

  // === YOUR EXISTING AUTH LOGIC (UNCHANGED) ===
  const allCookies = request.cookies.getAll()
  const supabaseAuthCookies = allCookies.filter(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  )
  
  let session = null
  let userId = null
  
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
            userId = payload.sub
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
              userId = authData.user.id
              break
            }
          } catch {
            session = { user: { id: authData.user.id } }
            userId = authData.user.id
            break
          }
        }
      }
    } catch (error) {
      continue
    }
  }

  if (session && isAuthRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!session && isProtectedRoute(request.nextUrl.pathname)) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect_to', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

function isAuthRoute(pathname: string): boolean {
  const authRoutes = ['/login', '/register', '/auth/verify', '/forgot-password']
  return authRoutes.some(route => pathname === route)
}

function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/dashboard',
    '/businesses/add',
    '/profile',
    '/admin',
  ]
  
  return protectedRoutes.some(route => pathname.startsWith(route))
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/businesses/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/auth/:path*',
    '/forgot-password',
    '/', // Add homepage to get site context
    '/search',
    '/categories/:path*',
  ],
}