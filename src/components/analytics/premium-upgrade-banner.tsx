// src/components/analytics/premium-upgrade-banner.tsx
'use client'

interface PremiumUpgradeBannerProps {
  businessId: string
  currentPlan: 'free' | 'premium'
}

export default function PremiumUpgradeBanner({ businessId, currentPlan }: PremiumUpgradeBannerProps) {
  if (currentPlan === 'premium') return null
  
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Unlock Advanced Analytics</h3>
          <p className="text-blue-100 mb-3">
            Get detailed competitor insights, customer demographics, and conversion tracking
          </p>
          <ul className="text-sm text-blue-100 space-y-1">
            <li>• Competitor comparison dashboard</li>
            <li>• Customer demographic breakdown</li>
            <li>• Lead source tracking</li>
            <li>• Monthly performance reports</li>
          </ul>
        </div>
        <div className="text-center">
          <div className="bg-white/20 rounded-lg p-4 mb-3">
            <p className="text-2xl font-bold">$29</p>
            <p className="text-sm">per month</p>
          </div>
          <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  )
}