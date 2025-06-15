// src/lib/auth/direct-google-oauth.ts - BYPASS SUPABASE OAUTH
'use client'

export class DirectGoogleOAuth {
  private clientId: string
  private redirectUri: string

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
    this.redirectUri = `${window.location.origin}/api/auth/google-direct`
  }

  /**
   * Start Google OAuth flow that shows YOUR domain, not Supabase
   */
  async signIn(): Promise<void> {
    if (!this.clientId) {
      throw new Error('Google Client ID not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment variables.')
    }

    // Generate random state for CSRF protection
    const state = this.generateRandomState()
    localStorage.setItem('oauth_state', state)

    // Build Google OAuth URL that will show YOUR app name
    const googleAuthUrl = new URL('https://accounts.google.com/oauth2/auth')
    googleAuthUrl.searchParams.set('client_id', this.clientId)
    googleAuthUrl.searchParams.set('redirect_uri', this.redirectUri)
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('scope', 'openid email profile')
    googleAuthUrl.searchParams.set('access_type', 'offline')
    googleAuthUrl.searchParams.set('prompt', 'consent')
    googleAuthUrl.searchParams.set('state', state)

    console.log('🔐 Starting direct Google OAuth (will show your app name)')
    console.log('🔗 Redirect URI:', this.redirectUri)

    // Redirect to Google - this will show YOUR Google Console app name
    window.location.href = googleAuthUrl.toString()
  }

  private generateRandomState(): string {
    return btoa(Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15))
  }
}

// Export singleton instance
export const directGoogleOAuth = new DirectGoogleOAuth()