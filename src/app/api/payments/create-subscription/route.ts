// src/app/api/payments/create-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'
import Stripe from 'stripe'
import { getPlan } from '@/lib/plans'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) 
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null

// Direct SQL execution
async function executeSQL(query: string, params: any[] = []) {
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  return await supabase.rpc('execute_sql', { query, params })
}

export async function POST(request: NextRequest) {
  try {
    const { planId, userId, businessId, paymentMethod, billingDetails } = await request.json() // Add billingDetails
    
    const plan = getPlan(planId)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Verify user authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (paymentMethod === 'razorpay') {
      return await handleRazorpaySubscription(plan, userId, businessId)
    } else if (paymentMethod === 'stripe') {
      return await handleStripeSubscription(plan, userId, businessId, billingDetails)
    }

    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  } catch (error: any) {
    console.error('Subscription creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleRazorpaySubscription(plan: any, userId: string, businessId: string) {
  if (!razorpay) {
    return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 })
  }

  try {
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: 'INR',
      receipt: `ord_${Date.now()}`,
      payment_capture: true,
      notes: {
        user_id: userId,
        business_id: businessId,
        plan_id: plan.id
      }
    })

    // Create subscription for this specific business
    const { createClient } = require('@supabase/supabase-js')
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Create subscription linked to business
    const { data, error } = await serviceClient.rpc('create_business_subscription', {
      p_profile_id: userId,
      p_business_id: businessId,
      p_plan_id: plan.id,
      p_status: 'pending',
      p_razorpay_order_id: order.id,
      p_amount: plan.price,
      p_currency: 'INR',
      p_billing_period: plan.billing_period
    })

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      subscriptionId: data,
      orderId: order.id
    })
  } catch (error: any) {
    console.error('Razorpay error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleStripeSubscription(plan: any, userId: string, businessId: string, billingDetails: any) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: billingDetails.email,
      name: billingDetails.name,
      metadata: { user_id: userId, business_id: businessId }
    })

    // Create a simple payment intent instead of subscription for testing
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price * 100, // Amount in cents
      currency: 'usd',
      customer: customer.id,
      description: `${plan.name} Plan for Business`,
      metadata: { 
        user_id: userId, 
        business_id: businessId, 
        plan_id: plan.id,
        type: 'business_plan'
      }
    })

    // Create subscription record
    const { createClient } = require('@supabase/supabase-js')
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await serviceClient.rpc('create_business_subscription', {
      p_profile_id: userId,
      p_business_id: businessId,
      p_plan_id: plan.id,
      p_status: 'pending', // Will be activated after payment
      p_razorpay_order_id: paymentIntent.id, // Store payment intent ID
      p_amount: plan.price,
      p_currency: 'USD',
      p_billing_period: plan.billing_period
    })

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      subscriptionId: data,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}