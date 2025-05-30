/**
 * SERVER COMPONENT: Get permissions directly
 * Use this in server components instead of hooks
 */
import { getUserPermissions } from '@/lib/auth/unified-auth-service'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSiteId } from '@/lib/site-context'

export async function getServerUserPermissions() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }
    
    const siteId = getCurrentSiteId()
    return await getUserPermissions(user.id, siteId || undefined)
  } catch (error) {
    console.error('❌ Server permissions error:', error)
    return null
  }
}