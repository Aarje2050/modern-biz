// src/app/api/email/templates/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {

    // Dynamic imports
    const { createClient } = await import('@/lib/supabase/server')
    const { templateEngine } = await import('@/lib/email/templates/engine')

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', session.user.id)
      .single()

    if (profile?.account_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const templates = await templateEngine.getAvailableTemplates()
    
    return NextResponse.json({ templates })

  } catch (error: any) {
    console.error('Templates API error:', error)
    return NextResponse.json({ 
      error: 'Failed to get templates',
      details: error.message 
    }, { status: 500 })
  }
}