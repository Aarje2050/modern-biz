// src/app/api/plans/check-feature/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasFeatureAccess } from '@/lib/plans/server'

export async function POST(request: NextRequest) {
  try {
    const { featureKey } = await request.json()
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await hasFeatureAccess(user.id, featureKey)
    
    return NextResponse.json({ allowed })
  } catch (error: any) {
    console.error('Feature check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

