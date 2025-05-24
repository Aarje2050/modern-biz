// src/components/crm/business-owner-dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Phone, 
  Mail, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Eye,
  Star
} from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { useSupabase } from '@/hooks/useSupabase'

interface CRMStats {
  contacts: {
    total: number
    active: number
    leads: number
    customers: number
  }
  leads: {
    total: number
    qualified: number
    avgValue: number
    closingThisMonth: number
  }
  tasks: {
    total: number
    overdue: number
    dueToday: number
    completed: number
  }
  interactions: {
    thisWeek: number
    thisMonth: number
    responseRate: number
  }
}

interface RecentActivity {
  id: string
  type: 'contact' | 'lead' | 'task' | 'interaction'
  title: string
  subtitle: string
  time: string
  status?: string
  priority?: string
}

interface Business {
  id: string
  name: string
  slug: string
  status: string
}

export default function BusinessOwnerDashboard() {
  const { user } = useAuth()
  const supabase = useSupabase()
  
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('')
  const [stats, setStats] = useState<CRMStats>({
    contacts: { total: 0, active: 0, leads: 0, customers: 0 },
    leads: { total: 0, qualified: 0, avgValue: 0, closingThisMonth: 0 },
    tasks: { total: 0, overdue: 0, dueToday: 0, completed: 0 },
    interactions: { thisWeek: 0, thisMonth: 0, responseRate: 0 }
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's businesses
  useEffect(() => {
    async function fetchBusinesses() {
      if (!supabase || !user) return

      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id, name, slug, status')
          .eq('profile_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (error) throw error

        setBusinesses(data || [])
        if (data && data.length > 0) {
          setSelectedBusinessId(data[0].id)
        }
      } catch (err: any) {
        console.error('Error fetching businesses:', err)
        setError(err.message)
      }
    }

    fetchBusinesses()
  }, [supabase, user])

  // Fetch CRM stats for selected business
  useEffect(() => {
    async function fetchCRMStats() {
      if (!supabase || !selectedBusinessId) {
        setLoading(false)
        return
      }

      try {
        // Fetch contact stats
        const { data: contactStats } = await supabase
          .rpc('crm.get_contact_stats', { business_uuid: selectedBusinessId })

        // Fetch leads data
        const { data: leadsData, error: leadsError } = await supabase
          .from('crm_leads')
          .select('stage, value_estimate, expected_close_date')
          .eq('business_id', selectedBusinessId)

        // Fetch tasks data
        const { data: tasksData, error: tasksError } = await supabase
          .from('crm_tasks')
          .select('status, due_date, completed_at')
          .eq('business_id', selectedBusinessId)

        // Fetch interactions data
        const { data: interactionsData, error: interactionsError } = await supabase
          .from('crm_interactions')
          .select('interaction_date, type, outcome')
          .eq('business_id', selectedBusinessId)
          .gte('interaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        // Process the data
        const processedStats: CRMStats = {
          contacts: {
            total: contactStats?.[0]?.total_contacts || 0,
            active: contactStats?.[0]?.active_contacts || 0,
            leads: contactStats?.[0]?.leads_count || 0,
            customers: contactStats?.[0]?.customers_count || 0
          },
          leads: {
            total: leadsData?.length ?? 0,
            qualified: leadsData?.filter(l => l.stage === 'qualified')?.length ?? 0,
            avgValue: leadsData && leadsData.length > 0 
              ? leadsData.reduce((sum, l) => sum + (l.value_estimate || 0), 0) / leadsData.length 
              : 0,
            closingThisMonth: leadsData?.filter(l => {
              if (!l.expected_close_date) return false
              const closeDate = new Date(l.expected_close_date)
              const now = new Date()
              return closeDate.getMonth() === now.getMonth() && closeDate.getFullYear() === now.getFullYear()
            })?.length ?? 0
        
          },
          tasks: {
            total: tasksData?.length || 0,
            overdue: contactStats?.[0]?.overdue_tasks || 0,
            dueToday: tasksData?.filter(t => {
              if (!t.due_date) return false
              const dueDate = new Date(t.due_date)
              const today = new Date()
              return dueDate.toDateString() === today.toDateString()
            }).length || 0,
            completed: tasksData?.filter(t => t.status === 'completed').length || 0
          },
          interactions: {
            thisWeek: interactionsData?.filter(i => 
              new Date(i.interaction_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length || 0,
            thisMonth: interactionsData?.length || 0,
            responseRate: 85 // This would be calculated based on actual data
          }
        }

        setStats(processedStats)

        // Fetch recent activity
        await fetchRecentActivity()

      } catch (err: any) {
        console.error('Error fetching CRM stats:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCRMStats()
  }, [supabase, selectedBusinessId])

  async function fetchRecentActivity() {
    if (!supabase || !selectedBusinessId) return

    try {
      // This is a simplified version - you'd want to create a more comprehensive query
      const { data: recentContacts } = await supabase
        .from('crm_contacts')
        .select('id, first_name, last_name, created_at')
        .eq('business_id', selectedBusinessId)
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: recentTasks } = await supabase
        .from('crm_tasks')
        .select('id, title, due_date, status, priority, created_at')
        .eq('business_id', selectedBusinessId)
        .order('created_at', { ascending: false })
        .limit(5)

      const activity: RecentActivity[] = [
        ...(recentContacts || []).map(contact => ({
          id: contact.id,
          type: 'contact' as const,
          title: `New contact: ${contact.first_name} ${contact.last_name}`,
          subtitle: 'Added to contacts',
          time: formatTimeAgo(contact.created_at),
        })),
        ...(recentTasks || []).map(task => ({
          id: task.id,
          type: 'task' as const,
          title: task.title,
          subtitle: `Due ${formatDate(task.due_date)}`,
          time: formatTimeAgo(task.created_at),
          status: task.status,
          priority: task.priority
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10)

      setRecentActivity(activity)
    } catch (err) {
      console.error('Error fetching recent activity:', err)
    }
  }

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

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'No date'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading CRM dashboard</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Businesses</h3>
        <p className="text-gray-500 mb-6">Add a business to start using CRM features.</p>
        <Link
          href="/businesses/add"
          className="inline-flex items-center bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Business
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your customer relationships</p>
          </div>
          {businesses.length > 1 && (
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Contacts */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <Link
              href="/dashboard/crm/contacts"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Contacts</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.contacts.total}</p>
            <p className="text-sm text-gray-600 mt-1">
              {stats.contacts.leads} leads, {stats.contacts.customers} customers
            </p>
          </div>
        </div>

        {/* Leads */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <Link
              href="/dashboard/crm/leads"
              className="text-sm text-green-600 hover:text-green-800"
            >
              View all
            </Link>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Active Leads</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.leads.total}</p>
            <p className="text-sm text-gray-600 mt-1">
              {stats.leads.closingThisMonth} closing this month
            </p>
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <Link
              href="/dashboard/crm/tasks"
              className="text-sm text-yellow-600 hover:text-yellow-800"
            >
              View all
            </Link>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Pending Tasks</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.tasks.total - stats.tasks.completed}</p>
            <p className="text-sm text-gray-600 mt-1">
              {stats.tasks.overdue > 0 && (
                <span className="text-red-600">{stats.tasks.overdue} overdue</span>
              )}
              {stats.tasks.dueToday > 0 && (
                <span className="text-orange-600">{stats.tasks.dueToday} due today</span>
              )}
            </p>
          </div>
        </div>

        {/* Interactions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Phone className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">This month</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Interactions</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.interactions.thisMonth}</p>
            <p className="text-sm text-gray-600 mt-1">
              {stats.interactions.thisWeek} this week
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <Link
                href="/dashboard/crm/activities"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentActivity.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'contact' ? 'bg-blue-100' :
                      activity.type === 'lead' ? 'bg-green-100' :
                      activity.type === 'task' ? 'bg-yellow-100' :
                      'bg-purple-100'
                    }`}>
                      {activity.type === 'contact' && <Users className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'lead' && <TrendingUp className="h-4 w-4 text-green-600" />}
                      {activity.type === 'task' && <Calendar className="h-4 w-4 text-yellow-600" />}
                      {activity.type === 'interaction' && <Phone className="h-4 w-4 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.subtitle}</p>
                    </div>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/dashboard/crm/contacts/new"
                className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 mr-3 text-blue-600" />
                Add Contact
              </Link>
              <Link
                href="/dashboard/crm/leads/new"
                className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <TrendingUp className="w-5 h-5 mr-3 text-green-600" />
                Create Lead
              </Link>
              <Link
                href="/dashboard/crm/tasks/new"
                className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Calendar className="w-5 h-5 mr-3 text-yellow-600" />
                Add Task
              </Link>
              <Link
                href="/dashboard/analytics"
                className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Eye className="w-5 h-5 mr-3 text-purple-600" />
                View Analytics
              </Link>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">This Month</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Lead Conversion</span>
                <span className="font-semibold text-gray-900">
                  {stats.leads.qualified > 0 ? Math.round((stats.leads.qualified / stats.leads.total) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Lead Value</span>
                <span className="font-semibold text-gray-900">
                  ${Math.round(stats.leads.avgValue).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Response Rate</span>
                <span className="font-semibold text-gray-900">{stats.interactions.responseRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}