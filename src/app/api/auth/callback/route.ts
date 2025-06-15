// src/app/api/auth/callback/route.ts - SIMPLE SESSION FIX
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard'
  
  console.log('🔍 OAUTH DEBUG:', request.url)
  
  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    await supabase.auth.exchangeCodeForSession(code)
    
    // SIMPLE: Just redirect with the code, let frontend handle session creation
    const successUrl = new URL('/login', request.url)
    successUrl.searchParams.set('oauth_code', code)
    successUrl.searchParams.set('redirect_to', redirectTo)
    
    console.log('✅ Redirecting with OAuth code for frontend processing')
    return NextResponse.redirect(successUrl)
  }

  const simpleRedirect = new URL('/login', request.url)
simpleRedirect.searchParams.set('oauth_success', 'true')
simpleRedirect.searchParams.set('refresh_needed', 'true')
return NextResponse.redirect(simpleRedirect)
}