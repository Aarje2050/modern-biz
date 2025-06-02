// src/middleware.ts - EMERGENCY SIMPLE VERSION
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip static files
  if (pathname.startsWith('/_next/') || 
      pathname.includes('.') ||
      pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  console.log('🛡️ MIDDLEWARE RUNNING:', pathname)
  
  // Just pass through - no site lookup, no redirects
  const response = NextResponse.next()
  
  // Set basic headers for debugging
  const hostname = request.headers.get('host') || ''
  response.headers.set('x-site-domain', hostname)
  
  console.log('🛡️ MIDDLEWARE DONE:', hostname)
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}