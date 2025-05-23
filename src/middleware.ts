// src/middleware.ts (FIXED - CHECK ALL AUTH COOKIES)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check for session using cookies (Edge Runtime compatible)
  const allCookies = request.cookies.getAll()
  const supabaseAuthCookies = allCookies.filter(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  )
  
  // Parse session from any valid cookie
  let session = null
  let userId = null
  
  // Check all auth cookies and find a valid one
  for (const authCookie of supabaseAuthCookies) {
    try {
      const cookieValue = decodeURIComponent(authCookie.value)
      let authData
      
      // Handle different cookie formats
      if (cookieValue.startsWith('[')) {
        // Array format: ["jwt_token", "refresh_token", ...]
        authData = JSON.parse(cookieValue)
        if (authData[0]) {
          const jwt = authData[0]
          const payload = JSON.parse(atob(jwt.split('.')[1]))
          // Check if token is still valid (not expired)
          if (payload.exp > Date.now() / 1000) {
            session = { user: { id: payload.sub } }
            userId = payload.sub
            break // Found valid session, stop checking
          }
        }
      } else if (cookieValue.startsWith('{')) {
        // Object format: {"access_token": "...", "user": {...}}
        authData = JSON.parse(cookieValue)
        if (authData.access_token && authData.user) {
          // For object format, also check if token is valid
          try {
            const jwt = authData.access_token
            const payload = JSON.parse(atob(jwt.split('.')[1]))
            if (payload.exp > Date.now() / 1000) {
              session = { user: { id: authData.user.id } }
              userId = authData.user.id
              break // Found valid session, stop checking
            }
          } catch {
            // If JWT parsing fails, assume it's valid for object format
            session = { user: { id: authData.user.id } }
            userId = authData.user.id
            break
          }
        }
      }
    } catch (error) {
      // If parsing fails, continue to next cookie
      continue
    }
  }

  // Your existing auth logic (keeping exactly as is)
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
  ],
}