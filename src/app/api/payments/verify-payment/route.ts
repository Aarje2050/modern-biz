// src/app/api/payments/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { paymentId, orderId, signature, subscriptionId } = await request.json()
    
    console.log('Payment verification started:', { paymentId, orderId, subscriptionId })
    
    // Verify Razorpay signature
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.log('Signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Signature verified successfully')

    // Update subscription and create transaction
    const { createClient } = require('@supabase/supabase-js')
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Update subscription status
    const { error: updateError } = await serviceClient
      .from('subscriptions')
      .update({
        status: 'active',
        razorpay_payment_id: paymentId,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', subscriptionId)

    if (updateError) {
      console.error('Subscription update error:', updateError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    console.log('Subscription updated successfully')

    // Get subscription details for transaction
    const { data: subscription } = await serviceClient
      .from('subscriptions')
      .select('amount, currency, profile_id')
      .eq('id', subscriptionId)
      .single()

    // Create transaction record
    const { data: transaction, error: transactionError } = await serviceClient.rpc('create_transaction', {
      p_subscription_id: subscriptionId,
      p_profile_id: subscription?.profile_id,
      p_amount: subscription?.amount || 29,
      p_currency: subscription?.currency || 'INR',
      p_status: 'completed',
      p_type: 'subscription',
      p_razorpay_payment_id: paymentId,
      p_razorpay_order_id: orderId
    })

    if (transactionError) {
      console.error('Transaction create error:', transactionError)
      // Don't fail the payment for transaction logging issues
    } else {
      console.log('Transaction created successfully:', transaction)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}