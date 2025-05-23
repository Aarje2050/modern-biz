// src/components/plans/plan-selector.tsx
'use client'

import { useState } from 'react'
import { Check, Star, Zap } from 'lucide-react'

// Import only client-safe utilities
const plansConfig = {
  plans: {
    free: {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      price: 0,
      currency: 'USD',
      billing_period: 'month',
      popular: false,
      limits: { max_businesses: 1, max_photos: 5, max_locations_per_business: 1 },
      features: { review_responses: true, basic_analytics: true, premium_analytics: false, featured_listing: false, priority_support: false, api_access: false }
    },
    premium: {
      id: 'premium',
      name: 'Premium', 
      description: 'Unlock all features for your business',
      price: 29,
      currency: 'USD',
      billing_period: 'month',
      popular: true,
      limits: { max_businesses: -1, max_photos: 50, max_locations_per_business: -1 },
      features: { review_responses: true, basic_analytics: true, premium_analytics: true, featured_listing: true, priority_support: true, api_access: true }
    }
  }
}

function getPlans() {
  return Object.values(plansConfig.plans)
}

function formatPrice(price: number, currency: string) {
  return `${price}`
}

interface PlanSelectorProps {
  selectedPlan?: string
  onPlanSelect: (planId: string) => void
  showTrialInfo?: boolean
  className?: string
}

export default function PlanSelector({ 
  selectedPlan = 'free', 
  onPlanSelect, 
  showTrialInfo = true,
  className = '' 
}: PlanSelectorProps) {
  const plans = getPlans()

  const handleSelectPlan = (planId: string) => {
    onPlanSelect(planId)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showTrialInfo && (
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h3>
          <p className="text-gray-600">
            Start with our free plan and upgrade anytime as your business grows.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => handleSelectPlan(plan.id)}
            className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all hover:shadow-lg ${
              selectedPlan === plan.id
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-opacity-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${plan.popular ? 'ring-2 ring-blue-200' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xl font-bold text-gray-900 flex items-center">
                  {plan.name}
                  {plan.id === 'premium' && (
                    <Zap className="h-5 w-5 ml-2 text-yellow-500" />
                  )}
                </h4>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(plan.price, plan.currency)}
                </div>
                <div className="text-sm text-gray-500">
                  {plan.price > 0 ? `per ${plan.billing_period}` : 'forever'}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="text-sm font-medium text-gray-700 mb-2">What's included:</div>
              
              {/* Business Listings */}
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span>
                  {plan.limits.max_businesses === -1 
                    ? 'Unlimited business listings' 
                    : `${plan.limits.max_businesses} business listing${plan.limits.max_businesses > 1 ? 's' : ''}`
                  }
                </span>
              </div>

              {/* Photos */}
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span>
                  Up to {plan.limits.max_photos} photos per business
                </span>
              </div>

              {/* Locations */}
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span>
                  {plan.limits.max_locations_per_business === -1 
                    ? 'Unlimited locations' 
                    : `${plan.limits.max_locations_per_business} location${plan.limits.max_locations_per_business > 1 ? 's' : ''} per business`
                  }
                </span>
              </div>

              {/* Review Responses */}
              {plan.features.review_responses && (
                <div className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Respond to customer reviews</span>
                </div>
              )}

              {/* Analytics */}
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span>
                  {plan.features.premium_analytics ? 'Advanced analytics' : 'Basic analytics'}
                </span>
              </div>

              {/* Featured Listing */}
              {plan.features.featured_listing && (
                <div className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Featured listing placement</span>
                </div>
              )}

              {/* Priority Support */}
              {plan.features.priority_support && (
                <div className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Priority customer support</span>
                </div>
              )}

              {/* API Access */}
              {plan.features.api_access && (
                <div className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>API access for integrations</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === plan.id
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-300'
              }`}>
                {selectedPlan === plan.id && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPlan === 'premium' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-900">Premium Benefits</h4>
              <div className="mt-1 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Your business appears higher in search results</li>
                  <li>Detailed analytics to understand your customers</li>
                  <li>Direct customer messaging and priority support</li>
                  <li>Cancel anytime with full control over your subscription</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}