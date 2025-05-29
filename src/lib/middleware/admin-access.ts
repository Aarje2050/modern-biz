// Enterprise grade admin access middleware
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function verifyAdminAccess() {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { 
        success: false, 
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // CORRECTED: Use account_type from core.profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single()
    
    if (profileError || profile?.account_type !== 'admin') {
      return { 
        success: false, 
        response: NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    return { success: true, user, profile }
    
  } catch (error) {
    return { 
      success: false, 
      response: NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// Helper for site-specific admin access
export async function verifySiteAdminAccess(siteId: string) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { 
        success: false, 
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Check global admin first (CORRECTED)
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single()
    
    if (profile?.account_type === 'admin') {
      return { success: true, user, profile, isGlobalAdmin: true }
    }

    // Check site-specific admin
    const { data: siteUser } = await supabase
      .from('site_users')
      .select('role')
      .eq('site_id', siteId)
      .eq('user_id', user.id)
      .single()
    
    if (siteUser?.role === 'admin') {
      return { success: true, user, profile, isGlobalAdmin: false, isSiteAdmin: true }
    }

    return { 
      success: false, 
      response: NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
  } catch (error) {
    return { 
      success: false, 
      response: NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}