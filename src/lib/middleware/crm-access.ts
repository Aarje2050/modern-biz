// src/lib/middleware/crm-access.ts
import { createClient } from '@/lib/supabase/server'

export interface CRMPermissions {
  canViewContacts: boolean
  canEditContacts: boolean
  canDeleteContacts: boolean
  canViewLeads: boolean
  canEditLeads: boolean
  canDeleteLeads: boolean
  canViewTasks: boolean
  canEditTasks: boolean
  canDeleteTasks: boolean
  canManageTeam: boolean
  canViewAnalytics: boolean
  canExportData: boolean
}

/**
 * Validates if a user has access to a specific business
 */
export async function validateBusinessAccess(
  userId: string, 
  businessId: string
): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Check if user owns the business
    const { data: ownedBusiness, error: ownedError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('profile_id', userId)
      .single()

    if (ownedBusiness && !ownedError) {
      return true
    }

    // Check if user is a team member
    const { data: teamMember, error: teamError } = await supabase
      .from('crm_team_members')
      .select('id, status')
      .eq('business_id', businessId)
      .eq('profile_id', userId)
      .eq('status', 'active')
      .single()

    if (teamMember && !teamError) {
      return true
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('account_type, metadata')
      .eq('id', userId)
      .single()

    if (!profileError && userProfile) {
      const isAdmin = userProfile.account_type === 'admin' || 
                     userProfile.metadata?.role === 'admin'
      if (isAdmin) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error validating business access:', error)
    return false
  }
}

/**
 * Gets CRM permissions for a user in a specific business
 */
export async function validateCRMPermissions(
  userId: string,
  businessId: string
): Promise<CRMPermissions> {
  const defaultPermissions: CRMPermissions = {
    canViewContacts: false,
    canEditContacts: false,
    canDeleteContacts: false,
    canViewLeads: false,
    canEditLeads: false,
    canDeleteLeads: false,
    canViewTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canManageTeam: false,
    canViewAnalytics: false,
    canExportData: false
  }

  try {
    const supabase = createClient()
    
    // Check if user owns the business (full permissions)
    const { data: ownedBusiness, error: ownedError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('profile_id', userId)
      .single()

    if (ownedBusiness && !ownedError) {
      return {
        canViewContacts: true,
        canEditContacts: true,
        canDeleteContacts: true,
        canViewLeads: true,
        canEditLeads: true,
        canDeleteLeads: true,
        canViewTasks: true,
        canEditTasks: true,
        canDeleteTasks: true,
        canManageTeam: true,
        canViewAnalytics: true,
        canExportData: true
      }
    }

    // Check team member permissions
    const { data: teamMember, error: teamError } = await supabase
      .from('crm_team_members')
      .select(`
        role,
        permissions,
        can_view_contacts,
        can_edit_contacts,
        can_delete_contacts,
        can_view_leads,
        can_edit_leads,
        can_manage_team
      `)
      .eq('business_id', businessId)
      .eq('profile_id', userId)
      .eq('status', 'active')
      .single()

    if (teamMember && !teamError) {
      // Role-based permissions
      const rolePermissions = getRolePermissions(teamMember.role)
      
      // Custom permissions override role permissions
      return {
        canViewContacts: teamMember.can_view_contacts ?? rolePermissions.canViewContacts,
        canEditContacts: teamMember.can_edit_contacts ?? rolePermissions.canEditContacts,
        canDeleteContacts: teamMember.can_delete_contacts ?? rolePermissions.canDeleteContacts,
        canViewLeads: teamMember.can_view_leads ?? rolePermissions.canViewLeads,
        canEditLeads: teamMember.can_edit_leads ?? rolePermissions.canEditLeads,
        canDeleteLeads: rolePermissions.canDeleteLeads,
        canViewTasks: rolePermissions.canViewTasks,
        canEditTasks: rolePermissions.canEditTasks,
        canDeleteTasks: rolePermissions.canDeleteTasks,
        canManageTeam: teamMember.can_manage_team ?? rolePermissions.canManageTeam,
        canViewAnalytics: rolePermissions.canViewAnalytics,
        canExportData: rolePermissions.canExportData
      }
    }

    // Check if user is admin (full permissions)
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('account_type, metadata')
      .eq('id', userId)
      .single()

    if (!profileError && userProfile) {
      const isAdmin = userProfile.account_type === 'admin' || 
                     userProfile.metadata?.role === 'admin'
      if (isAdmin) {
        return {
          canViewContacts: true,
          canEditContacts: true,
          canDeleteContacts: true,
          canViewLeads: true,
          canEditLeads: true,
          canDeleteLeads: true,
          canViewTasks: true,
          canEditTasks: true,
          canDeleteTasks: true,
          canManageTeam: true,
          canViewAnalytics: true,
          canExportData: true
        }
      }
    }

    return defaultPermissions
  } catch (error) {
    console.error('Error validating CRM permissions:', error)
    return defaultPermissions
  }
}

/**
 * Gets permissions based on team member role
 */
function getRolePermissions(role: string): CRMPermissions {
  switch (role) {
    case 'owner':
      return {
        canViewContacts: true,
        canEditContacts: true,
        canDeleteContacts: true,
        canViewLeads: true,
        canEditLeads: true,
        canDeleteLeads: true,
        canViewTasks: true,
        canEditTasks: true,
        canDeleteTasks: true,
        canManageTeam: true,
        canViewAnalytics: true,
        canExportData: true
      }
    
    case 'manager':
      return {
        canViewContacts: true,
        canEditContacts: true,
        canDeleteContacts: false,
        canViewLeads: true,
        canEditLeads: true,
        canDeleteLeads: false,
        canViewTasks: true,
        canEditTasks: true,
        canDeleteTasks: false,
        canManageTeam: false,
        canViewAnalytics: true,
        canExportData: true
      }
    
    case 'member':
      return {
        canViewContacts: true,
        canEditContacts: true,
        canDeleteContacts: false,
        canViewLeads: true,
        canEditLeads: true,
        canDeleteLeads: false,
        canViewTasks: true,
        canEditTasks: true,
        canDeleteTasks: false,
        canManageTeam: false,
        canViewAnalytics: false,
        canExportData: false
      }
    
    case 'viewer':
      return {
        canViewContacts: true,
        canEditContacts: false,
        canDeleteContacts: false,
        canViewLeads: true,
        canEditLeads: false,
        canDeleteLeads: false,
        canViewTasks: true,
        canEditTasks: false,
        canDeleteTasks: false,
        canManageTeam: false,
        canViewAnalytics: false,
        canExportData: false
      }
    
    default:
      return {
        canViewContacts: false,
        canEditContacts: false,
        canDeleteContacts: false,
        canViewLeads: false,
        canEditLeads: false,
        canDeleteLeads: false,
        canViewTasks: false,
        canEditTasks: false,
        canDeleteTasks: false,
        canManageTeam: false,
        canViewAnalytics: false,
        canExportData: false
      }
  }
}

/**
 * Validates if CRM features are enabled for a business
 */
export async function validateCRMEnabled(businessId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { data: business, error } = await supabase
      .from('businesses')
      .select('metadata')
      .eq('id', businessId)
      .single()

    if (error || !business) {
      return false
    }

    // CRM is enabled by default unless explicitly disabled
    return business.metadata?.crm_enabled !== false
  } catch (error) {
    console.error('Error checking CRM enabled status:', error)
    return false
  }
}

/**
 * Checks if user has reached their plan limits for CRM features
 */
export async function validateCRMPlanLimits(
  userId: string, 
  businessId: string,
  feature: 'contacts' | 'leads' | 'team_members'
): Promise<{ allowed: boolean; limit: number; current: number }> {
  try {
    const supabase = createClient()
    
    // Get user's plan (you'd implement this based on your plan system)
    const { data: userPlan } = await supabase
      .from('profiles')
      .select('account_type, metadata')
      .eq('id', userId)
      .single()

    // Define limits based on plan
    const planLimits = getPlanLimits(userPlan?.account_type || 'standard')
    
    // Get current usage
    let currentCount = 0
    switch (feature) {
      case 'contacts':
        const { count: contactCount } = await supabase
          .from('crm_contacts')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
        currentCount = contactCount || 0
        break
        
      case 'leads':
        const { count: leadCount } = await supabase
          .from('crm_leads')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
        currentCount = leadCount || 0
        break
        
      case 'team_members':
        const { count: teamCount } = await supabase
          .from('crm_team_members')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('status', 'active')
        currentCount = teamCount || 0
        break
    }

    const limit = planLimits[feature]
    const allowed = limit === -1 || currentCount < limit

    return { allowed, limit, current: currentCount }
  } catch (error) {
    console.error('Error validating plan limits:', error)
    return { allowed: false, limit: 0, current: 0 }
  }
}

/**
 * Gets plan limits based on account type
 */
function getPlanLimits(accountType: string): Record<string, number> {
  switch (accountType) {
    case 'premium':
      return {
        contacts: 10000,
        leads: 1000,
        team_members: 10
      }
    case 'business':
      return {
        contacts: 1000,
        leads: 100,
        team_members: 5
      }
    case 'standard':
      return {
        contacts: 100,
        leads: 20,
        team_members: 2
      }
    case 'admin':
      return {
        contacts: -1, // unlimited
        leads: -1,
        team_members: -1
      }
    default:
      return {
        contacts: 50,
        leads: 10,
        team_members: 1
      }
  }
}

/**
 * Middleware function to be used in API routes
 */
export function withCRMAccess(handler: Function) {
  return async (request: Request, context: any) => {
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Extract business ID from request
      const url = new URL(request.url)
      const businessId = url.searchParams.get('business_id') || context.params?.businessId

      if (!businessId) {
        return new Response(JSON.stringify({ error: 'Business ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Validate access
      const hasAccess = await validateBusinessAccess(user.id, businessId)
      if (!hasAccess) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Validate CRM is enabled
      const crmEnabled = await validateCRMEnabled(businessId)
      if (!crmEnabled) {
        return new Response(JSON.stringify({ error: 'CRM features not enabled' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Add user and permissions to context
      const permissions = await validateCRMPermissions(user.id, businessId)
      context.user = user
      context.businessId = businessId
      context.permissions = permissions

      return handler(request, context)
    } catch (error) {
      console.error('CRM access middleware error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

/**
 * Rate limiting for CRM operations
 */
export async function validateCRMRateLimit(
  userId: string,
  operation: string,
  windowMinutes: number = 60,
  maxOperations: number = 100
): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)
    
    // This would typically use Redis or a dedicated rate limiting service
    // For now, we'll use a simple database approach
    const { count } = await supabase
      .from('crm_rate_limits') // You'd need to create this table
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('operation', operation)
      .gte('created_at', windowStart.toISOString())

    if ((count || 0) >= maxOperations) {
      return false
    }

    // Log the operation
    await supabase
      .from('crm_rate_limits')
      .insert({
        user_id: userId,
        operation,
        created_at: new Date().toISOString()
      })

    return true
  } catch (error) {
    console.error('Rate limit validation error:', error)
    // Fail open - allow the operation if rate limiting fails
    return true
  }
}