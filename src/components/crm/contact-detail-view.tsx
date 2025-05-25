// src/components/crm/contact-detail-view.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  MessageSquare,
  TrendingUp,
  CheckSquare,
  Tag,
  Clock,
  User,
  ExternalLink,
  Star
} from 'lucide-react'

interface ContactDetailProps {
  contactId: string
  businessId: string
  onClose: () => void
  onEdit: (contact: any) => void
  onDelete: (contactId: string) => void
}

interface ContactWithDetails {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  job_title?: string
  source: string
  status: string
  lifecycle_stage: string
  tags: string[]
  notes?: string
  created_at: string
  updated_at: string
  last_contact_date?: string
  next_follow_up_date?: string
  business: {
    id: string
    name: string
    slug: string
  }
  interactions: Array<{
    id: string
    type: string
    subject: string
    description: string
    interaction_date: string
    duration_minutes?: number
    outcome?: string
    creator?: { full_name: string }
  }>
  leads: Array<{
    id: string
    title: string
    stage: string
    value_estimate?: number
    expected_close_date?: string
  }>
  tasks: Array<{
    id: string
    title: string
    type: string
    priority: string
    due_date?: string
    status: string
  }>
}

export default function ContactDetailView({ 
  contactId, 
  businessId, 
  onClose, 
  onEdit, 
  onDelete 
}: ContactDetailProps) {
  const [contact, setContact] = useState<ContactWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddLead, setShowAddLead] = useState(false)

  useEffect(() => {
    fetchContactDetails()
  }, [contactId])

  const fetchContactDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/crm/contacts/${contactId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch contact')
      }

      const data = await response.json()
      setContact(data.contact)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddInteraction = async (interactionData: any) => {
    try {
      const response = await fetch('/api/crm/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...interactionData,
          contact_id: contactId,
          business_id: businessId
        })
      })

      if (response.ok) {
        await fetchContactDetails() // Refresh data
        setShowAddInteraction(false)
      }
    } catch (error) {
      console.error('Failed to add interaction:', error)
    }
  }

  const handleAddTask = async (taskData: any) => {
    try {
      const response = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskData,
          contact_id: contactId,
          business_id: businessId
        })
      })

      if (response.ok) {
        await fetchContactDetails() // Refresh data
        setShowAddTask(false)
      }
    } catch (error) {
      console.error('Failed to add task:', error)
    }
  }

  const handleAddLead = async (leadData: any) => {
    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadData,
          contact_id: contactId,
          business_id: businessId
        })
      })

      if (response.ok) {
        await fetchContactDetails() // Refresh data
        setShowAddLead(false)
      }
    } catch (error) {
      console.error('Failed to add lead:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'blocked': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead': return 'bg-blue-100 text-blue-800'
      case 'prospect': return 'bg-yellow-100 text-yellow-800'
      case 'customer': return 'bg-green-100 text-green-800'
      case 'lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading contact</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button 
              onClick={fetchContactDetails}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Contact not found</h3>
        <p className="text-gray-500">The contact you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Contacts
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(contact)}
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
            <button
              onClick={() => onDelete(contact.id)}
              className="inline-flex items-center text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        </div>

        <div className="flex items-start space-x-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-gray-500" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {contact.first_name} {contact.last_name}
            </h1>
            
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contact.status)}`}>
                {contact.status}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(contact.lifecycle_stage)}`}>
                {contact.lifecycle_stage}
              </span>
              {contact.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {contact.email && (
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                    {contact.email}
                  </a>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                    {contact.phone}
                  </a>
                </div>
              )}
              
              {contact.company && (
                <div className="flex items-center text-gray-600">
                  <Building className="h-4 w-4 mr-2" />
                  <span>{contact.company}</span>
                  {contact.job_title && <span className="ml-1">• {contact.job_title}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {contact.notes && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{contact.notes}</p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Interactions</p>
              <p className="text-2xl font-bold text-gray-900">{contact.interactions?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Leads</p>
              <p className="text-2xl font-bold text-gray-900">{contact.leads?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CheckSquare className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{contact.tasks?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Contact</p>
              <p className="text-sm font-bold text-gray-900">
                {contact.last_contact_date ? formatDate(contact.last_contact_date) : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactions */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recent Interactions</h2>
              <button
                onClick={() => setShowAddInteraction(true)}
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </button>
            </div>
          </div>
          <div className="p-6">
            {contact.interactions && contact.interactions.length > 0 ? (
              <div className="space-y-4">
                {contact.interactions.slice(0, 5).map((interaction) => (
                  <div key={interaction.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {interaction.subject}
                          </span>
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {interaction.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{interaction.description}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-2">
                          <span>{formatDateTime(interaction.interaction_date)}</span>
                          {interaction.creator && (
                            <span className="ml-2">• by {interaction.creator.full_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <MessageSquare className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No interactions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
              <button
                onClick={() => setShowAddTask(true)}
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </button>
            </div>
          </div>
          <div className="p-6">
            {contact.tasks && contact.tasks.length > 0 ? (
              <div className="space-y-4">
                {contact.tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-gray-500">
                            {task.due_date ? `Due: ${formatDate(task.due_date)}` : 'No due date'}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckSquare className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No tasks yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Leads */}
        <div className="bg-white rounded-lg shadow-sm lg:col-span-2">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Leads & Opportunities</h2>
              <button
                onClick={() => setShowAddLead(true)}
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Lead
              </button>
            </div>
          </div>
          <div className="p-6">
            {contact.leads && contact.leads.length > 0 ? (
              <div className="space-y-4">
                {contact.leads.map((lead) => (
                  <div key={lead.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{lead.title}</h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            lead.stage === 'new' ? 'bg-blue-100 text-blue-800' :
                            lead.stage === 'qualified' ? 'bg-yellow-100 text-yellow-800' :
                            lead.stage === 'proposal' ? 'bg-purple-100 text-purple-800' :
                            lead.stage === 'closed_won' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {lead.stage}
                          </span>
                          {lead.value_estimate && (
                            <span className="text-sm text-gray-600">
                              ${lead.value_estimate.toLocaleString()}
                            </span>
                          )}
                          {lead.expected_close_date && (
                            <span className="text-sm text-gray-600">
                              Close: {formatDate(lead.expected_close_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <TrendingUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No leads yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Basic Info</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-500">Source</dt>
                <dd className="text-sm text-gray-900">{contact.source}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900">{formatDateTime(contact.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900">{formatDateTime(contact.updated_at)}</dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Follow-up</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-500">Last Contact</dt>
                <dd className="text-sm text-gray-900">
                  {contact.last_contact_date ? formatDate(contact.last_contact_date) : 'Never'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Next Follow-up</dt>
                <dd className="text-sm text-gray-900">
                  {contact.next_follow_up_date ? formatDate(contact.next_follow_up_date) : 'Not scheduled'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Modals would go here for adding interactions, tasks, and leads */}
      {/* For brevity, not implementing the full modals but they would follow similar patterns */}
    </div>
  )
}