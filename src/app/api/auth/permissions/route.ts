// src/app/api/auth/permissions/route.ts - PERMISSIONS API
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authService } from '@/lib/auth/unified-auth-service'
import { getCurrentSiteId } from '@/lib/site-context'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get siteId from request body or headers
    const body = await request.json().catch(() => ({}))
    const siteId = body.siteId || getCurrentSiteId() || undefined

    console.log('🔍 Getting permissions for:', { userId: user.id, siteId })

    // Get unified permissions
    const permissions = await authService.getUserPermissions({
      userId: user.id,
      siteId,
      skipCache: body.skipCache || false
    })

    console.log('✅ Permissions computed:', {
      canAccessDashboard: permissions.canAccessDashboard,
      isBusinessOwner: permissions.isBusinessOwner,
      siteRole: permissions.siteRole,
      ownedBusinesses: permissions.ownedBusinesses.length
    })

    return Response.json(permissions)

  } catch (error) {
    console.error('❌ Permissions API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Same logic as POST for convenience
  return POST(request)
}