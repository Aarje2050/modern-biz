// src/components/payments/payment-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, Shield, ArrowLeft } from 'lucide-react'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null)

// Simple plan getter for client use
const getPlan = (planId: string) => {
  const plans: any = {
    free: { id: 'free', name: 'Free', price: 0, currency: 'USD', billing_period: 'month' },
    premium: { id: 'premium', name: 'Premium', price: 29, currency: 'USD', billing_period: 'month' }
  }
  return plans[planId] || plans.free
}

const formatPrice = (price: number, currency: string) => `${price}`
const getPaymentGateway = (country: string) => country === 'IN' ? 'razorpay' : 'stripe'

interface PaymentFormProps {
  planId: string
  userId: string
  businessId: string | null
  onSuccess: (subscriptionId: string) => void
  onCancel: () => void
  userCountry?: string
}

// Stripe Payment Form
function StripePaymentForm({ planId, userId, businessId, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  })

  const plan = getPlan(planId)
  const supabase = createClient()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements || !plan) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create payment intent on server
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
          businessId,
          paymentMethod: 'stripe',
          billingDetails
        }),
      })

      const { clientSecret, subscriptionId, error: serverError } = await response.json()

      if (serverError) {
        setError(serverError)
        return
      }

      // Confirm payment
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) return

      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email,
            address: billingDetails.address
          }
        }
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
      } else {
        onSuccess(subscriptionId)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium mb-4">Payment Details</h3>
        
        {/* Plan Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">{plan?.name} Plan</div>
              <div className="text-sm text-gray-600">{plan?.description}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">
                {formatPrice(plan?.price || 0, plan?.currency || 'USD')}
              </div>
              <div className="text-sm text-gray-600">per {plan?.billing_period}</div>
            </div>
          </div>
        </div>

        {/* Billing Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={billingDetails.name}
              onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={billingDetails.email}
              onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Card Element */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="border border-gray-300 rounded-md p-3">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {/* Security Notice */}
        <div className="flex items-center text-sm text-gray-600 mb-6">
          <Shield className="h-4 w-4 mr-2" />
          <span>Your payment information is secure and encrypted</span>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <button
            type="submit"
            disabled={!stripe || isLoading}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isLoading ? 'Processing...' : `Subscribe for ${formatPrice(plan?.price || 0, plan?.currency || 'USD')}`}
          </button>
        </div>
      </div>
    </form>
  )
}

// Razorpay Payment Form
function RazorpayPaymentForm({ planId, userId, businessId, onSuccess, onCancel }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const plan = getPlan(planId)

  const handleRazorpayPayment = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Create order on server
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
          businessId,
          paymentMethod: 'razorpay'
        }),
      })

      const { orderId, subscriptionId, error: serverError } = await response.json()

      if (serverError) {
        setError(serverError)
        return
      }

      // Load Razorpay checkout
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use NEXT_PUBLIC_ version
          order_id: orderId,
          amount: (plan?.price || 0) * 100, // Amount in paise
          currency: 'INR',
          name: 'Business Directory',
          description: `${plan?.name} Plan Subscription`,
          handler: function (response: any) {
            // Verify payment on server
            fetch('/api/payments/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                subscriptionId
              }),
            }).then(() => {
              onSuccess(subscriptionId)
            }).catch((err) => {
              setError('Payment verification failed')
            })
          },
          prefill: {
            name: '',
            email: '',
            contact: ''
          },
          theme: {
            color: '#2563eb'
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false)
            }
          }
        }

        if (!options.key) {
          setError('Razorpay not configured properly')
          setIsLoading(false)
          return
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      }
      document.body.appendChild(script)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium mb-4">Payment Details</h3>
        
        {/* Plan Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">{plan?.name} Plan</div>
              <div className="text-sm text-gray-600">{plan?.description}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">₹{plan?.price}</div>
              <div className="text-sm text-gray-600">per {plan?.billing_period}</div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-700 mb-3">Supported Payment Methods:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600">Credit/Debit Card</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600">Net Banking</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600">UPI</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-600">Wallets</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <button
            onClick={handleRazorpayPayment}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : `Pay ₹${plan?.price}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// Main Payment Form Component
export default function PaymentForm(props: PaymentFormProps) {
  const gateway = getPaymentGateway(props.userCountry || 'US')

  if (gateway === 'razorpay') {
    return <RazorpayPaymentForm {...props} />
  }

  // Check if Stripe is available
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.log('Missing Stripe key:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Payment system is not configured yet.</p>
        <button onClick={props.onCancel} className="mt-4 py-2 px-4 border border-gray-300 rounded-md">
          Go Back
        </button>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  )
}