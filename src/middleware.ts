// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Redirect authenticated users away from auth pages
  if (session && isAuthRoute(request.nextUrl.pathname)) {
    // Check if user has businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('profile_id', session.user.id)
      .limit(1)
    
    if (businesses && businesses.length > 0) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // If there's no session and the user is trying to access a protected route
  if (!session && isProtectedRoute(request.nextUrl.pathname)) {
    // Save the original URL as a redirect parameter
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
  ]
  
  return protectedRoutes.some(route => pathname.startsWith(route))
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/businesses/add:path*',
    '/profile/:path*',
    '/login',
    '/register',
    '/auth/:path*',
    '/forgot-password',
  ],
}