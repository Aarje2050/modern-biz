// src/components/analytics/stats-cards.tsx

'use client'

import { Icon } from '@/components/ui/icon'  // Assuming you have an icon component

interface Stat {
  title: string
  value: number
  secondaryValue?: string
  icon: string
  change?: string
}

interface StatsCardsProps {
  stats: Stat[]
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="bg-white rounded-lg shadow p-6 flex flex-col"
        >
          <div className="flex items-center mb-2">
            <Icon name={stat.icon} className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
          </div>
          
          <div className="flex items-end justify-between mt-1">
            <div>
              <p className="text-2xl font-semibold">{stat.value.toLocaleString()}</p>
              {stat.secondaryValue && (
                <p className="text-sm text-gray-500">{stat.secondaryValue}</p>
              )}
            </div>
            
            {stat.change && (
              <span className={`text-sm ${
                stat.change.startsWith('+') 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {stat.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}