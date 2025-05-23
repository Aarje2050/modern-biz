// src/app/api/plans/current/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, getUserSubscription } from '@/lib/plans/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [plan, subscription] = await Promise.all([
      getUserPlan(user.id),
      getUserSubscription(user.id)
    ])
    
    return NextResponse.json({ plan, subscription })
  } catch (error: any) {
    console.error('Get current plan error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}