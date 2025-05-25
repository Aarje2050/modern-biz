// src/app/api/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/'
  
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
    
    // Get the user after exchange
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if this is the first time user is verifying (new user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('id', user.id)
        .single()

      const isNewUser = !profile?.is_verified

      // Update verification status
      await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', user.id)
      
      // Send welcome email for new users - using dynamic import to avoid build issues
      if (isNewUser) {
        try {
          const { AuthEmailIntegrations } = await import('@/lib/email/integrations/auth')
          await AuthEmailIntegrations.sendWelcomeEmail(user.id)
          console.log(`Welcome email sent to user: ${user.id}`)
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError)
          // Don't block the auth flow if email fails
        }
      }
      
      // Check if user has any businesses
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('profile_id', user.id)
        .limit(1)
      
      // Redirect based on whether user has businesses
      if (businesses && businesses.length > 0) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }
    }
  }

  // If no code or no user, redirect to homepage
  return NextResponse.redirect(new URL('/', request.url))
}