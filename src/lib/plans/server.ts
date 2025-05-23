// src/lib/plans/server.ts
import { createClient } from '@/lib/supabase/server'
import { getPlan, type Plan, type Subscription, type FeatureUsage } from './index'

// Get user's current subscription
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient()
  
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('profile_id', userId)
    .eq('status', 'active')
    .maybeSingle()
    
  return subscription
}

// Get user's current plan (with fallback to free)
export async function getUserPlan(userId: string): Promise<Plan> {
  const subscription = await getUserSubscription(userId)
  const planId = subscription?.plan_id || 'free'
  return getPlan(planId) || getPlan('free')!
}

// Check if user has access to a feature
export async function hasFeatureAccess(
  userId: string, 
  featureKey: string
): Promise<boolean> {
  const plan = await getUserPlan(userId)
  return !!plan.features[featureKey]
}

// Check if user can perform action based on limits
export async function canPerformAction(
  userId: string,
  limitKey: string,
  increment: number = 1
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = await createClient()
  const plan = await getUserPlan(userId)
  
  const limit = plan.limits[limitKey]
  
  // Unlimited access (-1)
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 }
  }
  
  // Get current usage
  const { data: usage } = await supabase
    .from('feature_usage')
    .select('current_usage')
    .eq('profile_id', userId)
    .eq('feature_key', limitKey)
    .maybeSingle()
    
  const currentUsage = usage?.current_usage || 0
  const allowed = (currentUsage + increment) <= limit
  
  return { allowed, current: currentUsage, limit }
}

// Update feature usage
export async function updateFeatureUsage(
  userId: string,
  featureKey: string,
  increment: number = 1
): Promise<void> {
  const supabase = await createClient()
  
  await supabase.rpc('increment_feature_usage', {
    p_profile_id: userId,
    p_feature_key: featureKey,
    p_increment: increment
  })
}

// Reset feature usage (for monthly/yearly resets)
export async function resetFeatureUsage(
  userId: string,
  featureKey: string
): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from('feature_usage')
    .upsert({
      profile_id: userId,
      feature_key: featureKey,
      current_usage: 0,
      reset_date: new Date().toISOString()
    })
}

// Get feature usage for dashboard
export async function getFeatureUsage(userId: string): Promise<FeatureUsage[]> {
  const supabase = await createClient()
  
  const { data: usage } = await supabase
    .from('feature_usage')
    .select('*')
    .eq('profile_id', userId)
    
  return usage || []
}

// Middleware function to check plan access
export function requiresPlan(allowedPlans: string[]) {
  return async (userId: string): Promise<boolean> => {
    const subscription = await getUserSubscription(userId)
    const planId = subscription?.plan_id || 'free'
    return allowedPlans.includes(planId)
  }
}