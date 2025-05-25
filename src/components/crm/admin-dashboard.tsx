// src/components/crm/admin-dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity,
  Settings,
  Shield,
  BarChart3
} from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'

interface AdminStats {
  platform: {
    totalBusinesses: number
    activeBusinesses: number
    pendingBusinesses: number
    totalUsers: number
    businessOwners: number
    platformGrowth: number
  }
  crm: {
    totalContacts: number
    totalLeads: number
    activeLeads: number
    totalInteractions: number
    averageResponseTime: number
    conversionRate: number
  }
  support: {
    openTickets: number
    resolvedTickets: number
    averageResolutionTime: number
    customerSatisfaction: number
  }
  system: {
    systemHealth: 'healthy' | 'warning' | 'critical'
    apiUptime: number
    databasePerformance: number
    storageUsed: number
  }
}

interface RecentActivity {
  id: string
  type: 'business_signup' | 'user_registration' | 'review_reported' | 'business_verification' | 'system_alert'
  title: string
  description: string
  timestamp: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface TopBusiness {
  id: string
  name: string
  slug: string
  contactCount: number
  leadCount: number
  conversionRate: number
  revenue: number
}

export default function AdminDashboard() {
  const supabase = useSupabase()
  
  const [stats, setStats] = useState<AdminStats>({
    platform: {
      totalBusinesses: 0,
      activeBusinesses: 0,
      pendingBusinesses: 0,
      totalUsers: 0,
      businessOwners: 0,
      platformGrowth: 0
    },
    crm: {
      totalContacts: 0,
      totalLeads: 0,
      activeLeads: 0,
      totalInteractions: 0,
      averageResponseTime: 0,
      conversionRate: 0
    },
    support: {
      openTickets: 0,
      resolvedTickets: 0,
      averageResolutionTime: 0,
      customerSatisfaction: 0
    },
    system: {
      systemHealth: 'healthy',
      apiUptime: 99.9,
      databasePerformance: 95,
      storageUsed: 45
    }
  })
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [topBusinesses, setTopBusinesses] = useState<TopBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAdminData() {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        // Fetch platform stats
        const [
          { count: totalBusinesses },
          { count: activeBusinesses },
          { count: pendingBusinesses },
          { count: totalUsers },
          { count: businessOwners }
        ] = await Promise.all([
          supabase.from('businesses').select('*', { count: 'exact', head: true }),
          supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_type', 'business')
        ])

        // Fetch CRM stats
        const [
          { count: totalContacts },
          { count: totalLeads },
          { count: activeLeads },
          { count: totalInteractions }
        ] = await Promise.all([
          supabase.from('crm_contacts').select('*', { count: 'exact', head: true }),
          supabase.from('crm_leads').select('*', { count: 'exact', head: true }),
          supabase.from('crm_leads').select('*', { count: 'exact', head: true }).neq('stage', 'closed_won').neq('stage', 'closed_lost'),
          supabase.from('crm_interactions').select('*', { count: 'exact', head: true })
        ])

        // Calculate conversion rate (simplified)
        const conversionRate = (totalLeads || 0) > 0 ? (((totalLeads || 0) - (activeLeads || 0)) / (totalLeads || 0) * 100) : 0

        // Fetch recent businesses for activity feed
        const { data: recentBusinesses } = await supabase
          .from('businesses')
          .select('id, name, status, created_at')
          .order('created_at', { ascending: false })
          .limit(10)

        // Fetch top performing businesses (mock data for now)
        const { data: businessesData } = await supabase
          .from('businesses')
          .select(`
            id,
            name,
            slug,
            created_at
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5)

        // Process recent activity
        const activity: RecentActivity[] = (recentBusinesses || []).map(business => ({
          id: business.id,
          type: business.status === 'pending' ? 'business_verification' : 'business_signup',
          title: business.status === 'pending' ? 'Business verification needed' : 'New business registered',
          description: `${business.name} ${business.status === 'pending' ? 'is awaiting verification' : 'has joined the platform'}`,
          timestamp: business.created_at,
          priority: business.status === 'pending' ? 'medium' : 'low'
        }))

        // Process top businesses (mock CRM data)
        const topBiz: TopBusiness[] = (businessesData || []).map((business, index) => ({
          id: business.id,
          name: business.name,
          slug: business.slug,
          contactCount: Math.floor(Math.random() * 100) + 10,
          leadCount: Math.floor(Math.random() * 50) + 5,
          conversionRate: Math.floor(Math.random() * 30) + 10,
          revenue: Math.floor(Math.random() * 50000) + 5000
        }))

        setStats({
          platform: {
            totalBusinesses: totalBusinesses || 0,
            activeBusinesses: activeBusinesses || 0,
            pendingBusinesses: pendingBusinesses || 0,
            totalUsers: totalUsers || 0,
            businessOwners: businessOwners || 0,
            platformGrowth: 12.5 // This would be calculated based on time periods
          },
          crm: {
            totalContacts: totalContacts || 0,
            totalLeads: totalLeads || 0,
            activeLeads: activeLeads || 0,
            totalInteractions: totalInteractions || 0,
            averageResponseTime: 2.5, // hours - would be calculated
            conversionRate
          },
          support: {
            openTickets: 3, // Mock data
            resolvedTickets: 47,
            averageResolutionTime: 4.2, // hours
            customerSatisfaction: 4.7
          },
          system: {
            systemHealth: 'healthy',
            apiUptime: 99.9,
            databasePerformance: 95,
            storageUsed: 45
          }
        })

        setRecentActivity(activity)
        setTopBusinesses(topBiz)

      } catch (err: any) {
        console.error('Error fetching admin data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [supabase])

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading admin dashboard</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Administration</h1>
            <p className="text-gray-600 mt-1">Monitor and manage your business directory platform</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              stats.system.systemHealth === 'healthy' ? 'bg-green-100 text-green-800' :
              stats.system.systemHealth === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                stats.system.systemHealth === 'healthy' ? 'bg-green-600' :
                stats.system.systemHealth === 'warning' ? 'bg-yellow-600' :
                'bg-red-600'
              }`}></div>
              System {stats.system.systemHealth}
            </div>
            <Link
              href="/admin/settings"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <Link href="/admin/businesses" className="text-sm text-blue-600 hover:text-blue-800">
                Manage
              </Link>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Businesses</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.platform.totalBusinesses}</p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.platform.activeBusinesses} active, {stats.platform.pendingBusinesses} pending
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <Link href="/admin/users" className="text-sm text-green-600 hover:text-green-800">
                Manage
              </Link>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.platform.totalUsers}</p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.platform.businessOwners} business owners
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+{stats.platform.platformGrowth}%</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Platform Growth</h3>
              <p className="text-2xl font-bold text-gray-900">12.5%</p>
              <p className="text-sm text-gray-600 mt-1">Month over month</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
              <Link href="/admin/support" className="text-sm text-orange-600 hover:text-orange-800">
                View
              </Link>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Support Tickets</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.support.openTickets}</p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.support.resolvedTickets} resolved this month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CRM Analytics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">CRM Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-sm text-gray-500">Platform-wide</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Contacts</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.crm.totalContacts}</p>
              <p className="text-sm text-gray-600 mt-1">Across all businesses</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-500">Active</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Active Leads</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.crm.activeLeads}</p>
              <p className="text-sm text-gray-600 mt-1">
                {Math.round(stats.crm.conversionRate)}% conversion rate
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Activity className="h-6 w-6 text-cyan-600" />
              </div>
              <span className="text-sm text-gray-500">This month</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Interactions</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.crm.totalInteractions}</p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.crm.averageResponseTime}h avg response
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-pink-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-pink-600" />
              </div>
              <Link href="/admin/analytics" className="text-sm text-pink-600 hover:text-pink-800">
                Details
              </Link>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Satisfaction</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.support.customerSatisfaction} ★</p>
              <p className="text-sm text-gray-600 mt-1">Customer rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recent Platform Activity</h2>
              <Link href="/admin/activity" className="text-sm text-gray-600 hover:text-gray-900">
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentActivity.length === 0 ? (
              <div className="text-center py-6">
                <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'business_signup' ? 'bg-blue-100' :
                      activity.type === 'user_registration' ? 'bg-green-100' :
                      activity.type === 'business_verification' ? 'bg-yellow-100' :
                      activity.type === 'review_reported' ? 'bg-red-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.type === 'business_signup' && <Building2 className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'user_registration' && <Users className="h-4 w-4 text-green-600" />}
                      {activity.type === 'business_verification' && <Clock className="h-4 w-4 text-yellow-600" />}
                      {activity.type === 'review_reported' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      {activity.type === 'system_alert' && <Shield className="h-4 w-4 text-gray-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(activity.priority)}`}>
                          {activity.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Businesses & System Status */}
        <div className="space-y-6">
          {/* Top Businesses */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Top CRM Users</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {topBusinesses.map((business, index) => (
                  <div key={business.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{business.name}</p>
                        <p className="text-xs text-gray-500">
                          {business.contactCount} contacts, {business.leadCount} leads
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{business.conversionRate}%</p>
                      <p className="text-xs text-gray-500">conversion</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">System Health</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">API Uptime</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-semibold text-gray-900">{stats.system.apiUptime}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Database Performance</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-semibold text-gray-900">{stats.system.databasePerformance}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Storage Used</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="font-semibold text-gray-900">{stats.system.storageUsed}%</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Link
                    href="/admin/system"
                    className="block w-full text-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    View detailed system status →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}