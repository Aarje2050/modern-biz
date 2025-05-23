// src/app/api/payments/activate-stripe-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId } = await request.json()
    
    console.log('Activating Stripe subscription:', subscriptionId)
    
    const { createClient } = require('@supabase/supabase-js')
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Activate the subscription
    const { error: updateError } = await serviceClient
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', subscriptionId)

    if (updateError) {
      console.error('Subscription activation error:', updateError)
      return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 })
    }

    // Get subscription details for transaction
    const { data: subscription } = await serviceClient
      .from('subscriptions')
      .select('amount, currency, profile_id')
      .eq('id', subscriptionId)
      .single()

    // Create transaction record
    await serviceClient.rpc('create_transaction', {
      p_subscription_id: subscriptionId,
      p_profile_id: subscription?.profile_id,
      p_amount: subscription?.amount || 29,
      p_currency: subscription?.currency || 'USD',
      p_status: 'completed',
      p_type: 'subscription'
    })

    console.log('Stripe subscription activated successfully')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Activation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}