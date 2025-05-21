// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Paths we want to track for analytics
const ANALYTICS_PATHS = [
  '/businesses',
  '/categories', 
  '/search'
]

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

  // Analytics tracking - only for specific paths and not for API routes
const path = request.nextUrl.pathname;
if (!path.includes('/api/') && !path.includes('/_next/') && shouldTrackPath(path)) {
     // Track the page view asynchronously without blocking the response
  // Use a timeout to avoid long-running middleware
  const trackingPromise = Promise.race([
    trackPageView(request, session),
    new Promise(resolve => setTimeout(resolve, 200)) // 200ms timeout
  ]).catch(err => {
    // Silent fail for analytics
    console.error('Analytics tracking error:', err);
  });
  
  // Don't await this - let it run in background
  void trackingPromise;
}

  return response
}

// Check if the path should be tracked
function shouldTrackPath(pathname: string): boolean {
  return ANALYTICS_PATHS.some(prefix => pathname.startsWith(prefix))
}

// Non-blocking analytics tracking function
async function trackPageView(request: NextRequest, session: any) {
  const path = request.nextUrl.pathname
  const segments = path.split('/').filter(Boolean)
  
  // Extract entity type and ID from URL
  // For example: /businesses/acme-corp → type: 'business', entityId: 'acme-corp'
  let entityType = segments[0] || 'home'
  let entityId = segments[1] || null
  
  // Normalize entity types for database consistency
  if (entityType === 'businesses') entityType = 'business'
  if (entityType === 'categories') entityType = 'category'

  // Create payload for analytics
  const payload = {
    entity_type: entityType,
    entity_id: entityId,
    url: request.nextUrl.toString(),
    referrer: request.headers.get('referer') || '',
    user_agent: request.headers.get('user-agent') || '',
    profile_id: session?.user?.id || null,
    // Don't store raw IP address for privacy
    ip_hash: hashIP(request.ip || request.headers.get('x-forwarded-for') || ''),
    created_at: new Date().toISOString()
  }

  // Use server-to-server request to log the page view
  // This uses service role key for direct database access
  fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/page_views`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(payload)
  }).catch(error => {
    // Silent fail - we don't want analytics errors to impact the user
    console.error('Analytics error:', error)
  })
}

// Simple hash function for IP address anonymization
function hashIP(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
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

// Update the matcher to include the paths we want to track
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/businesses/:path*',
    '/profile/:path*',
    '/login',
    '/register',
    '/auth/:path*',
    '/forgot-password',
    '/categories/:path*',
    '/search/:path*',
  ],
}