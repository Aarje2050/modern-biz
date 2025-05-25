// src/hooks/useCRM.ts
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'

// Enhanced Contact interface with profile data
export interface Contact {
  id: string
  business_id: string
  profile_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  job_title?: string
  source: string
  source_details: Record<string, any>
  status: 'active' | 'inactive' | 'blocked'
  lifecycle_stage: 'lead' | 'prospect' | 'customer' | 'lost'
  last_contact_date?: string
  next_follow_up_date?: string
  custom_fields: Record<string, any>
  tags: string[]
  notes?: string
  created_at: string
  updated_at: string
  
  // Profile data (joined from profiles table)
  profile?: {
    id: string
    full_name?: string
    display_name?: string
    avatar_url?: string
    account_type?: string
    is_verified?: boolean
  }
  
  // Computed fields
  display_name?: string
  avatar_url?: string
  is_verified?: boolean
  
  // Relationship counts
  interactions_count?: number
  leads_count?: number
  tasks_count?: number
  
  // Legacy fields for backwards compatibility
  interactions?: { count: number }
  leads?: { count: number }
  tasks?: { count: number }
}

export interface Lead {
  id: string
  contact_id: string
  business_id: string
  title: string
  description?: string
  value_estimate?: number
  currency: string
  stage: 'new' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  probability: number
  expected_close_date?: string
  actual_close_date?: string
  assigned_to?: string
  source?: string
  source_details: Record<string, any>
  custom_fields: Record<string, any>
  tags: string[]
  notes?: string
  created_at: string
  updated_at: string
  contact?: Contact
  assigned_user?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  interactions?: { count: number }
  tasks?: { count: number }
}

export interface Task {
  id: string
  business_id: string
  contact_id?: string
  lead_id?: string
  title: string
  description?: string
  type: 'follow_up' | 'call' | 'email' | 'meeting' | 'reminder'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  completed_at?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to?: string
  created_at: string
  updated_at: string
  contact?: Pick<Contact, 'id' | 'first_name' | 'last_name' | 'email' | 'display_name' | 'avatar_url'>
  lead?: Pick<Lead, 'id' | 'title'>
  assigned_user?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ContactsResponse {
  contacts: Contact[]
  pagination: PaginationData
}

interface LeadsResponse {
  leads: Lead[]
}

interface TasksResponse {
  tasks: Task[]
}

// Enhanced Contacts Hook
export function useContacts(businessId: string, filters?: {
  search?: string
  status?: string
  lifecycle_stage?: string
  page?: number
  limit?: number
}) {
  const [data, setData] = useState<ContactsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContacts = useCallback(async () => {
    if (!businessId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        business_id: businessId,
        page: String(filters?.page || 1),
        limit: String(filters?.limit || 20)
      })

      if (filters?.search) params.append('search', filters.search)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.lifecycle_stage) params.append('lifecycle_stage', filters.lifecycle_stage)

      const response = await fetch(`/api/crm/contacts?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch contacts')
      }

      const result = await response.json()
      setData(result)
    } catch (err: any) {
      console.error('Error fetching contacts:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [businessId, filters?.search, filters?.status, filters?.lifecycle_stage, filters?.page, filters?.limit])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const createContact = useCallback(async (contactData: Partial<Contact>) => {
    try {
      const response = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contactData, business_id: businessId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create contact')
      }

      const result = await response.json()
      await fetchContacts() // Refresh data
      return result
    } catch (err: any) {
      console.error('Error creating contact:', err)
      throw err
    }
  }, [businessId, fetchContacts])

  const updateContact = useCallback(async (contactId: string, updates: Partial<Contact>) => {
    try {
      const response = await fetch(`/api/crm/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update contact')
      }

      const result = await response.json()
      await fetchContacts() // Refresh data
      return result
    } catch (err: any) {
      console.error('Error updating contact:', err)
      throw err
    }
  }, [fetchContacts])

  const deleteContact = useCallback(async (contactId: string) => {
    try {
      const response = await fetch(`/api/crm/contacts/${contactId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete contact')
      }

      await fetchContacts() // Refresh data
    } catch (err: any) {
      console.error('Error deleting contact:', err)
      throw err
    }
  }, [fetchContacts])

  return {
    data,
    loading,
    error,
    refetch: fetchContacts,
    createContact,
    updateContact,
    deleteContact
  }
}

// Enhanced Contact Detail Hook
export function useContactDetail(contactId: string) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContactDetail = useCallback(async () => {
    if (!contactId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/crm/contacts/${contactId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch contact')
      }

      const result = await response.json()
      setContact(result.contact)
    } catch (err: any) {
      console.error('Error fetching contact detail:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [contactId])

  useEffect(() => {
    fetchContactDetail()
  }, [fetchContactDetail])

  return {
    contact,
    loading,
    error,
    refetch: fetchContactDetail
  }
}

// Leads Hook (unchanged but with enhanced Contact interface)
export function useLeads(businessId: string, filters?: {
  stage?: string
  assigned_to?: string
}) {
  const [data, setData] = useState<LeadsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    if (!businessId) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ business_id: businessId })
      if (filters?.stage) params.append('stage', filters.stage)
      if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to)

      const response = await fetch(`/api/crm/leads?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch leads')
      }

      const result = await response.json()
      setData(result)
    } catch (err: any) {
      console.error('Error fetching leads:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [businessId, filters?.stage, filters?.assigned_to])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const createLead = useCallback(async (leadData: Partial<Lead>) => {
    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leadData, business_id: businessId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create lead')
      }

      const result = await response.json()
      await fetchLeads()
      return result.lead
    } catch (err: any) {
      console.error('Error creating lead:', err)
      throw err
    }
  }, [businessId, fetchLeads])

  const updateLead = useCallback(async (leadId: string, updates: Partial<Lead>) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update lead')
      }

      const result = await response.json()
      await fetchLeads()
      return result.lead
    } catch (err: any) {
      console.error('Error updating lead:', err)
      throw err
    }
  }, [fetchLeads])

  return {
    data,
    loading,
    error,
    refetch: fetchLeads,
    createLead,
    updateLead
  }
}

// Tasks Hook (unchanged)
export function useTasks(businessId: string, filters?: {
  status?: string
  assigned_to?: string
  due_date?: 'overdue' | 'today' | 'this_week'
}) {
  const [data, setData] = useState<TasksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!businessId) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ business_id: businessId })
      if (filters?.status) params.append('status', filters.status)
      if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to)
      if (filters?.due_date) params.append('due_date', filters.due_date)

      const response = await fetch(`/api/crm/tasks?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch tasks')
      }

      const result = await response.json()
      setData(result)
    } catch (err: any) {
      console.error('Error fetching tasks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [businessId, filters?.status, filters?.assigned_to, filters?.due_date])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = useCallback(async (taskData: Partial<Task>) => {
    try {
      const response = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, business_id: businessId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      const result = await response.json()
      await fetchTasks()
      return result.task
    } catch (err: any) {
      console.error('Error creating task:', err)
      throw err
    }
  }, [businessId, fetchTasks])

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/crm/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      const result = await response.json()
      await fetchTasks()
      return result.task
    } catch (err: any) {
      console.error('Error updating task:', err)
      throw err
    }
  }, [fetchTasks])

  const completeTask = useCallback(async (taskId: string) => {
    return updateTask(taskId, {
      status: 'completed',
      completed_at: new Date().toISOString()
    })
  }, [updateTask])

  return {
    data,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    completeTask
  }
}

// CRM Statistics Hook
export function useCRMStats(businessId: string) {
  const [stats, setStats] = useState<{
    contacts: { total: number; active: number; leads: number; customers: number }
    leads: { total: number; qualified: number; avgValue: number; closingThisMonth: number }
    tasks: { total: number; overdue: number; dueToday: number; completed: number }
    interactions: { thisWeek: number; thisMonth: number; responseRate: number }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!businessId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/crm/stats?business_id=${businessId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch stats')
      }

      const result = await response.json()
      setStats(result.stats)
    } catch (err: any) {
      console.error('Error fetching CRM stats:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

// CRM Permissions Hook
export function useCRMPermissions(businessId: string) {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<{
    canViewContacts: boolean
    canEditContacts: boolean
    canDeleteContacts: boolean
    canViewLeads: boolean
    canEditLeads: boolean
    canDeleteLeads: boolean
    canViewTasks: boolean
    canEditTasks: boolean
    canDeleteTasks: boolean
    canManageTeam: boolean
    canViewAnalytics: boolean
    canExportData: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPermissions() {
      if (!businessId || !user) {
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        if (!supabase) {
          setLoading(false)
          return
        }
        
        // Check if user is admin first
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('account_type, metadata')
          .eq('id', user.id)
          .single()

        const isAdmin = userProfile?.account_type === 'admin' || 
                       userProfile?.metadata?.role === 'admin'

        if (isAdmin) {
          // Give full permissions to admins
          setPermissions({
            canViewContacts: true,
            canEditContacts: true,
            canDeleteContacts: true,
            canViewLeads: true,
            canEditLeads: true,
            canDeleteLeads: true,
            canViewTasks: true,
            canEditTasks: true,
            canDeleteTasks: true,
            canManageTeam: true,
            canViewAnalytics: true,
            canExportData: true
          })
        } else {
          // Check if user owns the business
          const { data: ownedBusiness } = await supabase
            .from('businesses')
            .select('id')
            .eq('id', businessId)
            .eq('profile_id', user.id)
            .single()

          if (ownedBusiness) {
            // Give full permissions to business owners
            setPermissions({
              canViewContacts: true,
              canEditContacts: true,
              canDeleteContacts: true,
              canViewLeads: true,
              canEditLeads: true,
              canDeleteLeads: true,
              canViewTasks: true,
              canEditTasks: true,
              canDeleteTasks: true,
              canManageTeam: true,
              canViewAnalytics: true,
              canExportData: true
            })
          } else {
            // No permissions if not admin or owner
            setPermissions({
              canViewContacts: false,
              canEditContacts: false,
              canDeleteContacts: false,
              canViewLeads: false,
              canEditLeads: false,
              canDeleteLeads: false,
              canViewTasks: false,
              canEditTasks: false,
              canDeleteTasks: false,
              canManageTeam: false,
              canViewAnalytics: false,
              canExportData: false
            })
          }
        }
      } catch (error) {
        console.error('Error fetching CRM permissions:', error)
        // Default to no permissions on error
        setPermissions({
          canViewContacts: false,
          canEditContacts: false,
          canDeleteContacts: false,
          canViewLeads: false,
          canEditLeads: false,
          canDeleteLeads: false,
          canViewTasks: false,
          canEditTasks: false,
          canDeleteTasks: false,
          canManageTeam: false,
          canViewAnalytics: false,
          canExportData: false
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [businessId, user])

  return { permissions, loading }
}

// Business Selection Hook (for multi-business users)
export function useBusinessSelection() {
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState<Array<{
    id: string
    name: string
    slug: string
    status: string
  }>>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserBusinesses() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/businesses/user-businesses')
        
        if (response.ok) {
          const result = await response.json()
          setBusinesses(result.businesses || [])
          
          // Auto-select first business if none selected
          if (result.businesses?.length > 0 && !selectedBusinessId) {
            setSelectedBusinessId(result.businesses[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching user businesses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserBusinesses()
  }, [user, selectedBusinessId])

  const selectBusiness = useCallback((businessId: string) => {
    setSelectedBusinessId(businessId)
  }, [])

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId)

  return {
    businesses,
    selectedBusinessId,
    selectedBusiness,
    selectBusiness,
    loading
  }
}

// Integration Hook (for connecting with existing directory features)
export function useCRMIntegration(businessId: string) {
  const createContactFromReview = useCallback(async (reviewId: string) => {
    try {
      const response = await fetch('/api/crm/integration/contact-from-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId, business_id: businessId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create contact from review')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating contact from review:', error)
      throw error
    }
  }, [businessId])

  const createContactFromMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch('/api/crm/integration/contact-from-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, business_id: businessId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create contact from message')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating contact from message:', error)
      throw error
    }
  }, [businessId])

  const syncDirectoryData = useCallback(async () => {
    try {
      const response = await fetch('/api/crm/integration/sync-directory-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync directory data')
      }

      return await response.json()
    } catch (error) {
      console.error('Error syncing directory data:', error)
      throw error
    }
  }, [businessId])

  return {
    createContactFromReview,
    createContactFromMessage,
    syncDirectoryData
  }
}