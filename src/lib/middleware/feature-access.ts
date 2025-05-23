// src/lib/middleware/feature-access.ts
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, canPerformAction } from '@/lib/plans/server'
import { NextRequest, NextResponse } from 'next/server'

export async function checkFeatureAccess(
  userId: string,
  featureKey: string
): Promise<{ allowed: boolean; plan: any; error?: string }> {
  try {
    const plan = await getUserPlan(userId)
    const hasAccess = plan.features[featureKey]
    
    return {
      allowed: hasAccess,
      plan
    }
  } catch (error) {
    return {
      allowed: false,
      plan: null,
      error: 'Failed to check feature access'
    }
  }
}

export async function checkUsageLimit(
  userId: string,
  limitKey: string,
  increment: number = 1
): Promise<{ allowed: boolean; current: number; limit: number; error?: string }> {
  try {
    const result = await canPerformAction(userId, limitKey, increment)
    return result
  } catch (error) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      error: 'Failed to check usage limit'
    }
  }
}

// Middleware factory for API routes
export function withPlanCheck(
  requiredFeature: string,
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { allowed, plan, error } = await checkFeatureAccess(user.id, requiredFeature)
      
      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      if (!allowed) {
        return NextResponse.json({
          error: 'Feature not available in your current plan',
          required_plan: 'premium',
          current_plan: plan?.id || 'free'
        }, { status: 403 })
      }

      // Add plan context to request
      req.headers.set('x-user-plan', plan.id)
      req.headers.set('x-user-id', user.id)

      return handler(req, context)
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// Middleware factory for usage limits
export function withUsageCheck(
  limitKey: string,
  increment: number = 1,
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { allowed, current, limit, error } = await checkUsageLimit(user.id, limitKey, increment)
      
      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      if (!allowed) {
        return NextResponse.json({
          error: 'Usage limit exceeded',
          current_usage: current,
          limit: limit,
          limit_key: limitKey
        }, { status: 429 })
      }

      // Add usage context to request
      req.headers.set('x-current-usage', current.toString())
      req.headers.set('x-usage-limit', limit.toString())
      req.headers.set('x-user-id', user.id)

      return handler(req, context)
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// React hook for client-side feature checking
export function useFeatureAccess() {
  const checkFeature = async (featureKey: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/plans/check-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featureKey }),
      })
      
      const data = await response.json()
      return data.allowed || false
    } catch {
      return false
    }
  }

  const checkUsage = async (limitKey: string, increment: number = 1) => {
    try {
      const response = await fetch('/api/plans/check-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limitKey, increment }),
      })
      
      return await response.json()
    } catch {
      return { allowed: false, current: 0, limit: 0 }
    }
  }

  return { checkFeature, checkUsage }
}

// Example usage in API routes:
// export const POST = withPlanCheck('premium_analytics', async (req, context) => {
//   // Handler code here - only runs if user has premium_analytics feature
// })

// export const POST = withUsageCheck('max_businesses', 1, async (req, context) => {
//   // Handler code here - only runs if user hasn't exceeded business limit
// })