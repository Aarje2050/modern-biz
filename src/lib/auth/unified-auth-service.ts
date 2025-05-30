// src/lib/auth/unified-auth-service.ts - ENTERPRISE GRADE AUTHORIZATION
import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

export interface UserPermissions {
  // Core permissions
  isAuthenticated: boolean
  isGlobalAdmin: boolean
  isSiteAdmin: boolean
  isBusinessOwner: boolean
  
  // Site context
  siteId?: string | null
  siteRole: 'user' | 'business_owner' | 'admin' | null
  
  // Business context
  ownedBusinesses: string[] // business IDs user owns
  managedBusinesses: string[] // business IDs user can manage via team
  
  // Feature permissions
  canAccessDashboard: boolean
  canAccessAnalytics: boolean
  canAccessCRM: boolean
  canManageBusinesses: boolean
  canManageUsers: boolean
  
  // Plan limits
  planType: string
  planLimits: Record<string, number>
}

export interface AuthContext {
  userId: string
  siteId?: string
  skipCache?: boolean
}

/**
 * ENTERPRISE: Single source of truth for all authorization
 * Checks all patterns and provides unified permissions
 */
export class UnifiedAuthService {
  private static instance: UnifiedAuthService
  private permissionsCache = new Map<string, { permissions: UserPermissions; expires: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  static getInstance(): UnifiedAuthService {
    if (!UnifiedAuthService.instance) {
      UnifiedAuthService.instance = new UnifiedAuthService()
    }
    return UnifiedAuthService.instance
  }

  /**
   * SERVER: Get user permissions (with caching)
   */
  async getUserPermissions(context: AuthContext): Promise<UserPermissions> {
    const cacheKey = `${context.userId}-${context.siteId || 'global'}`
    
    // Check cache first (unless skipCache is true)
    if (!context.skipCache) {
      const cached = this.permissionsCache.get(cacheKey)
      if (cached && cached.expires > Date.now()) {
        return cached.permissions
      }
    }

    // Compute fresh permissions
    const permissions = await this.computeUserPermissions(context)
    
    // Cache the result
    this.permissionsCache.set(cacheKey, {
      permissions,
      expires: Date.now() + this.CACHE_TTL
    })

    return permissions
  }

  /**
   * SERVER: Compute user permissions by checking all patterns
   */
  private async computeUserPermissions({ userId, siteId }: AuthContext): Promise<UserPermissions> {
    const supabase = createClient()
    
    try {
      // Parallel queries for efficiency
      const [profileResult, siteUserResult, businessesResult, planResult] = await Promise.all([
        // 1. Get user profile
        supabase
          .from('profiles')
          .select('account_type, metadata, site_id')
          .eq('id', userId)
          .single(),
        
        // 2. Get site user record (if siteId provided)
        siteId ? supabase
          .from('site_users')
          .select('role, permissions, status')
          .eq('user_id', userId)
          .eq('site_id', siteId)
          .single() : { data: null, error: null },
        
        // 3. Get owned/managed businesses
        supabase
          .from('businesses')
          .select('id, site_id')
          .eq('profile_id', userId),
        
        // 4. Get plan info (you can implement this based on your plans schema)
        supabase
          .from('subscriptions')
          .select('plan_id, status')
          .eq('profile_id', userId)
          .eq('status', 'active')
          .single()
      ])

      const profile = profileResult.data
      const siteUser = siteUserResult.data
      const businesses = businessesResult.data || []
      const planData = planResult.data

      // Filter businesses by site if needed
      const relevantBusinesses = siteId 
        ? businesses.filter(b => b.site_id === siteId || !b.site_id) // Include legacy businesses without site_id
        : businesses

      // CORE PERMISSION LOGIC
      const isGlobalAdmin = profile?.account_type === 'admin'
      const isSiteAdmin = siteUser?.role === 'admin' || isGlobalAdmin
      const isBusinessOwner = relevantBusinesses.length > 0 || siteUser?.role === 'business_owner'

      // FEATURE PERMISSIONS
      const canAccessDashboard = isGlobalAdmin || isSiteAdmin || isBusinessOwner
      const canAccessAnalytics = isGlobalAdmin || isSiteAdmin || isBusinessOwner
      const canAccessCRM = isGlobalAdmin || isSiteAdmin || isBusinessOwner
      const canManageBusinesses = isGlobalAdmin || isSiteAdmin || isBusinessOwner
      const canManageUsers = isGlobalAdmin || isSiteAdmin

      // PLAN INFO
      const planType = this.getPlanType(profile?.account_type, planData)
      const planLimits = this.getPlanLimits(planType)

      return {
        isAuthenticated: true,
        isGlobalAdmin,
        isSiteAdmin,
        isBusinessOwner,
        siteId,
        siteRole: siteUser?.role || (isBusinessOwner ? 'business_owner' : 'user'),
        ownedBusinesses: relevantBusinesses.map(b => b.id),
        managedBusinesses: relevantBusinesses.map(b => b.id), // For now, same as owned
        canAccessDashboard,
        canAccessAnalytics,
        canAccessCRM,
        canManageBusinesses,
        canManageUsers,
        planType,
        planLimits
      }

    } catch (error) {
      console.error('❌ Error computing user permissions:', error)
      
      // Return safe defaults on error
      return this.getDefaultPermissions(siteId)
    }
  }

  /**
   * CLIENT: Get user permissions (browser-safe)
   */
  async getUserPermissionsClient(siteId?: string): Promise<UserPermissions> {
    try {
      const response = await fetch('/api/auth/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch permissions')
      }
      
      return await response.json()
    } catch (error) {
      console.error('❌ Error fetching user permissions:', error)
      return this.getDefaultPermissions(siteId)
    }
  }

  /**
   * UTILITY: Check specific permission
   */
  async hasPermission(
    context: AuthContext, 
    permission: keyof UserPermissions
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(context)
    return Boolean(permissions[permission])
  }

  /**
   * UTILITY: Check business ownership
   */
  async canAccessBusiness(context: AuthContext, businessId: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(context)
    
    return permissions.isGlobalAdmin || 
           permissions.isSiteAdmin || 
           permissions.ownedBusinesses.includes(businessId) ||
           permissions.managedBusinesses.includes(businessId)
  }

  /**
   * UTILITY: Get plan type from various sources
   */
  private getPlanType(accountType?: string, planData?: any): string {
    if (accountType === 'admin') return 'admin'
    if (accountType === 'premium') return 'premium'
    if (planData?.plan_id) return planData.plan_id
    return 'free'
  }

  /**
   * UTILITY: Get plan limits
   */
  private getPlanLimits(planType: string): Record<string, number> {
    const limits = {
      free: { businesses: 1, analytics_days: 30, crm_contacts: 50 },
      premium: { businesses: 10, analytics_days: 365, crm_contacts: 1000 },
      admin: { businesses: -1, analytics_days: -1, crm_contacts: -1 }
    }
    
    return limits[planType as keyof typeof limits] || limits.free
  }

  /**
   * UTILITY: Safe defaults when errors occur
   */
  private getDefaultPermissions(siteId?: string | null): UserPermissions {
    return {
      isAuthenticated: false,
      isGlobalAdmin: false,
      isSiteAdmin: false,
      isBusinessOwner: false,
      siteId: siteId || null,
      siteRole: null,
      ownedBusinesses: [],
      managedBusinesses: [],
      canAccessDashboard: false,
      canAccessAnalytics: false,
      canAccessCRM: false,
      canManageBusinesses: false,
      canManageUsers: false,
      planType: 'free',
      planLimits: {}
    }
  }

  /**
   * ADMIN: Clear cache for user (when permissions change)
   */
  clearUserCache(userId: string, siteId?: string): void {
    if (siteId) {
      this.permissionsCache.delete(`${userId}-${siteId}`)
    } else {
      // Clear all entries for this user
      for (const key of this.permissionsCache.keys()) {
        if (key.startsWith(`${userId}-`)) {
          this.permissionsCache.delete(key)
        }
      }
    }
  }

  /**
   * ADMIN: Clear all cache (system maintenance)
   */
  clearAllCache(): void {
    this.permissionsCache.clear()
  }
}

// Export singleton instance
export const authService = UnifiedAuthService.getInstance()

// Convenience functions for common use cases
export async function getUserPermissions(userId: string, siteId?: string): Promise<UserPermissions> {
  return authService.getUserPermissions({ userId, siteId })
}

export async function canAccessDashboard(userId: string, siteId?: string): Promise<boolean> {
  return authService.hasPermission({ userId, siteId }, 'canAccessDashboard')
}

export async function canAccessBusiness(userId: string, businessId: string, siteId?: string): Promise<boolean> {
  return authService.canAccessBusiness({ userId, siteId }, businessId)
}

export async function isBusinessOwner(userId: string, siteId?: string): Promise<boolean> {
  return authService.hasPermission({ userId, siteId }, 'isBusinessOwner')
}