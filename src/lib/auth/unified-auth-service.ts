// src/lib/auth/unified-auth-service.ts - ENTERPRISE DATABASE-SAFE VERSION
import { createClient } from '@/lib/supabase/server'

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

type SiteUser = {
  role: 'user' | 'business_owner' | 'admin'
  permissions: string[]
  status: string
}

/**
 * ENTERPRISE: Database-safe queries with fallbacks
 */
class DatabaseSafeQueries {
  private supabase = createClient()

  async safeQuery<T>(
    tableName: string, 
    query: () => any,
    fallback: T[] = []
  ): Promise<{ data: T[] | null; error: any }> {
    try {
      const result = await query()
      return result
    } catch (error: any) {
      console.warn(`⚠️ Table '${tableName}' not accessible:`, error.message)
      return { data: fallback, error: null }
    }
  }

  // NEW: Safe single query for .single() operations
  async safeSingleQuery<T>(
    tableName: string, 
    query: () => any,
    fallback: T | null = null
  ): Promise<{ data: T | null; error: any }> {
    try {
      const result = await query()
      return result
    } catch (error: any) {
      console.warn(`⚠️ Table '${tableName}' not accessible:`, error.message)
      return { data: fallback, error: null }
    }
  }

  async getProfile(userId: string) {
    return this.safeSingleQuery('profiles', () =>
      this.supabase
        .from('profiles')
        .select('account_type, metadata')
        .eq('id', userId)
        .single()
    )
  }

  async getSiteUser(userId: string, siteId: string) {
    if (!siteId) return { data: null, error: null }
    
    return this.safeSingleQuery<SiteUser>('site_users', () =>
      this.supabase
        .from('site_users')
        .select('role, permissions, status')
        .eq('user_id', userId)
        .eq('site_id', siteId)
        .single()
    )
  }

  async getBusinesses(userId: string) {
    return this.safeQuery('businesses', () =>
      this.supabase
        .from('businesses')
        .select('id, site_id')
        .eq('profile_id', userId)
    )
  }

  async getSubscription(userId: string) {
    return this.safeSingleQuery('subscriptions', () =>
      this.supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('profile_id', userId)
        .eq('status', 'active')
        .single()
    )
  }
}

/**
 * ENTERPRISE: Single source of truth for all authorization
 */
export class UnifiedAuthService {
  private static instance: UnifiedAuthService
  private permissionsCache = new Map<string, { permissions: UserPermissions; expires: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private db = new DatabaseSafeQueries()

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
        console.log('⚡ Auth Service: Using cached permissions')
        return cached.permissions
      }
    }

    console.log('🔍 Auth Service: Computing fresh permissions for', {
      userId: context.userId.substring(0, 8) + '...',
      siteId: context.siteId || 'none'
    })

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
   * SERVER: Compute user permissions with database safety
   */
  private async computeUserPermissions({ userId, siteId }: AuthContext): Promise<UserPermissions> {
    try {
      console.log('🔍 Auth Service: Fetching user data from database...')

      // ENTERPRISE: Parallel queries with safe fallbacks
      const [profileResult, siteUserResult, businessesResult, planResult] = await Promise.all([
        this.db.getProfile(userId),
        this.db.getSiteUser(userId, siteId || ''),
        this.db.getBusinesses(userId),
        this.db.getSubscription(userId)
      ])

      const profile = profileResult.data
      const siteUser = siteUserResult.data  // Now properly typed as SiteUser | null
      const businesses = businessesResult.data || []
      const planData = planResult.data

      console.log('📊 Auth Service: Database results:', {
        hasProfile: !!profile,
        hasSiteUser: !!siteUser,
        businessCount: businesses.length,
        hasPlan: !!planData
      })

      // Filter businesses by site if needed
      const businessList = (businesses || []) as any[]
      const relevantBusinesses = siteId 
        ? businessList.filter((b: any) => b.site_id === siteId || !b.site_id)
        : businessList

      // CORE PERMISSION LOGIC
      const profileData = profile as any
      const isGlobalAdmin = profileData?.account_type === 'admin'
      const isSiteAdmin = siteUser?.role === 'admin' || isGlobalAdmin
      const isBusinessOwner = relevantBusinesses.length > 0 || siteUser?.role === 'business_owner'

      // FEATURE PERMISSIONS
      const canAccessDashboard = isGlobalAdmin || isSiteAdmin || isBusinessOwner
      const canAccessAnalytics = isGlobalAdmin || isSiteAdmin || isBusinessOwner
      const canAccessCRM = isGlobalAdmin || isSiteAdmin || isBusinessOwner
      const canManageBusinesses = isGlobalAdmin || isSiteAdmin || isBusinessOwner
      const canManageUsers = isGlobalAdmin || isSiteAdmin

      // PLAN INFO
      const planType = this.getPlanType(profileData?.account_type, planData)
      const planLimits = this.getPlanLimits(planType)

      const permissions: UserPermissions = {
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

      console.log('✅ Auth Service: Permissions computed:', {
        canAccessDashboard: permissions.canAccessDashboard,
        isBusinessOwner: permissions.isBusinessOwner,
        siteRole: permissions.siteRole,
        ownedBusinesses: permissions.ownedBusinesses.length
      })

      return permissions

    } catch (error) {
      console.error('❌ Auth Service: Error computing permissions:', error)
      
      // Return safe defaults on error
      return this.getDefaultPermissions(siteId)
    }
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
    console.log('⚠️ Auth Service: Using default permissions')
    
    return {
      isAuthenticated: true, // User is authenticated if we got here
      isGlobalAdmin: false,
      isSiteAdmin: false,
      isBusinessOwner: false,
      siteId: siteId || null,
      siteRole: 'user',
      ownedBusinesses: [],
      managedBusinesses: [],
      canAccessDashboard: true, // Allow basic access
      canAccessAnalytics: false,
      canAccessCRM: false,
      canManageBusinesses: false,
      canManageUsers: false,
      planType: 'free',
      planLimits: { businesses: 1, analytics_days: 30, crm_contacts: 50 }
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

// Convenience functions
export async function getUserPermissions(userId: string, siteId?: string): Promise<UserPermissions> {
  return authService.getUserPermissions({ userId, siteId })
}

export async function canAccessDashboard(userId: string, siteId?: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId, siteId)
  return permissions.canAccessDashboard
}

export async function canAccessBusiness(userId: string, businessId: string, siteId?: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId, siteId)
  
  return permissions.isGlobalAdmin || 
         permissions.isSiteAdmin || 
         permissions.ownedBusinesses.includes(businessId) ||
         permissions.managedBusinesses.includes(businessId)
}

export async function isBusinessOwner(userId: string, siteId?: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId, siteId)
  return permissions.isBusinessOwner
}