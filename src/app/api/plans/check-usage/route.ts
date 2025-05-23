// src/app/api/plans/check-usage/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/plans/server'

export async function POST(request: NextRequest) {
  try {
    const { limitKey, increment = 1 } = await request.json()
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await canPerformAction(user.id, limitKey, increment)
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Usage check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

