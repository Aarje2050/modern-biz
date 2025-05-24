// src/components/crm/contacts-management.tsx
'use client'

import { useState, useMemo } from 'react'
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  User, 
  Building,
  Tag,
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Upload,
  RefreshCcw,
  X
} from 'lucide-react'
import { useContacts, useCRMPermissions, Contact } from '@/hooks/useCRM'

interface ContactsManagementProps {
  businessId: string
}

export default function ContactsManagement({ businessId }: ContactsManagementProps) {
  // Hooks
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [stageFilter, setStageFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedContactForView, setSelectedContactForView] = useState<Contact | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDirectorySync, setShowDirectorySync] = useState(false)

  const { permissions, loading: permissionsLoading } = useCRMPermissions(businessId)
  
  const { 
    data: contactsData, 
    loading, 
    error, 
    refetch,
    createContact,
    updateContact,
    deleteContact
  } = useContacts(businessId, {
    search: searchTerm,
    status: statusFilter,
    lifecycle_stage: stageFilter,
    page: currentPage,
    limit: 20
  })

  // Memoized filtered data
  const displayContacts = useMemo(() => {
    return contactsData?.contacts || []
  }, [contactsData])

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'blocked', label: 'Blocked' }
  ]

  const stageOptions = [
    { value: '', label: 'All Stages' },
    { value: 'lead', label: 'Lead' },
    { value: 'prospect', label: 'Prospect' },
    { value: 'customer', label: 'Customer' },
    { value: 'lost', label: 'Lost' }
  ]

  // Handlers
  const handleCreateContact = async (contactData: Partial<Contact>) => {
    try {
      await createContact(contactData)
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create contact:', error)
    }
  }

  const handleEditContact = async (updates: Partial<Contact>) => {
    if (!selectedContact) return
    
    try {
      await updateContact(selectedContact.id, updates)
      setShowEditModal(false)
      setSelectedContact(null)
    } catch (error) {
      console.error('Failed to update contact:', error)
    }
  }

  const handleDeleteContact = async () => {
    if (!selectedContact) return
    
    try {
      await deleteContact(selectedContact.id)
      setShowDeleteModal(false)
      setSelectedContact(null)
    } catch (error) {
      console.error('Failed to delete contact:', error)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!permissions?.canViewContacts) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Access Restricted</h3>
            <p className="mt-1 text-sm text-yellow-700">
              You don't have permission to view contacts. Contact your team administrator.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600 mt-1">Manage your customer relationships</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowDirectorySync(true)}
              className="inline-flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <RefreshCcw className="mr-2 h-5 w-5" />
              Sync Directory
            </button>
            {permissions?.canEditContacts && (
              <>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Import
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Contact
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Directory Sync Modal */}
      {showDirectorySync && (
        <DirectoryIntegrationModal 
          businessId={businessId}
          onClose={() => setShowDirectorySync(false)}
          onComplete={refetch}
        />
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {stageOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('')
              setStageFilter('')
              setCurrentPage(1)
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Stats */}
      
{contactsData && (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className="p-2 bg-blue-100 rounded-lg">
          <User className="h-6 w-6 text-blue-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">Total Contacts</p>
          <p className="text-2xl font-bold text-gray-900">{contactsData.pagination.total}</p>
        </div>
      </div>
    </div>
    
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className="p-2 bg-green-100 rounded-lg">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">Active</p>
          <p className="text-2xl font-bold text-gray-900">
            {contactsData.contacts?.filter(c => c.status === 'active').length || 0}
          </p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <AlertCircle className="h-6 w-6 text-yellow-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">Leads</p>
          <p className="text-2xl font-bold text-gray-900">
            {contactsData.contacts?.filter(c => c.lifecycle_stage === 'lead').length || 0}
          </p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Building className="h-6 w-6 text-purple-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">Customers</p>
          <p className="text-2xl font-bold text-gray-900">
            {contactsData.contacts?.filter(c => c.lifecycle_stage === 'customer').length || 0}
          </p>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-2" />
            <p className="text-gray-500">Error loading contacts: {error}</p>
            <button 
              onClick={refetch}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : displayContacts.length === 0 ? (
          <div className="p-12 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter || stageFilter
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first contact or syncing from directory.'
              }
            </p>
            {permissions?.canEditContacts && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Contact
                </button>
                <button
                  onClick={() => setShowDirectorySync(true)}
                  className="inline-flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <RefreshCcw className="mr-2 h-5 w-5" />
                  Sync Directory
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {contact.first_name} {contact.last_name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {contact.email}
                            </div>
                            {contact.phone && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contact.company || '-'}</div>
                        <div className="text-sm text-gray-500">{contact.job_title || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(contact.status)}`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(contact.lifecycle_stage)}`}>
                          {contact.lifecycle_stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.last_contact_date ? formatDate(contact.last_contact_date) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedContactForView(contact)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {permissions?.canEditContacts && (
                            <button
                              onClick={() => {
                                setSelectedContact(contact)
                                setShowEditModal(true)
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Edit Contact"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {permissions?.canDeleteContacts && (
                            <button
                              onClick={() => {
                                setSelectedContact(contact)
                                setShowDeleteModal(true)
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Contact"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {contactsData && contactsData.pagination.totalPages > 1 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((contactsData.pagination.page - 1) * contactsData.pagination.limit) + 1} to{' '}
                  {Math.min(contactsData.pagination.page * contactsData.pagination.limit, contactsData.pagination.total)} of{' '}
                  {contactsData.pagination.total} contacts
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(contactsData.pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === contactsData.pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Contact Detail View Modal */}
      {selectedContactForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <ContactDetailView
              contactId={selectedContactForView.id}
              businessId={businessId}
              onClose={() => setSelectedContactForView(null)}
              onEdit={(contact:any) => {
                setSelectedContact(contact)
                setShowEditModal(true)
                setSelectedContactForView(null)
              }}
              onDelete={async (contactId :any) => {
                try {
                  await deleteContact(contactId)
                  setSelectedContactForView(null)
                } catch (error) {
                  console.error('Failed to delete contact:', error)
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Create Contact Modal */}
      {showCreateModal && (
        <CreateContactModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateContact}
        />
      )}

      {/* Edit Contact Modal */}
      {showEditModal && selectedContact && (
        <EditContactModal
          contact={selectedContact}
          onClose={() => {
            setShowEditModal(false)
            setSelectedContact(null)
          }}
          onSubmit={handleEditContact}
        />
      )}

      {/* Delete Contact Modal */}
      {showDeleteModal && selectedContact && (
        <DeleteContactModal
          contact={selectedContact}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedContact(null)
          }}
          onConfirm={handleDeleteContact}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportContactsModal
          businessId={businessId}
          onClose={() => setShowImportModal(false)}
          onComplete={refetch}
        />
      )}
    </div>
  )
}

// Create Contact Modal Component
interface CreateContactModalProps {
  onClose: () => void
  onSubmit: (data: Partial<Contact>) => Promise<void>
}

function CreateContactModal({ onClose, onSubmit }: CreateContactModalProps) {
  const [formData, setFormData] = useState<{
    first_name: string
    last_name: string
    email: string
    phone: string
    company: string
    job_title: string
    lifecycle_stage: 'lead' | 'prospect' | 'customer' | 'lost'
    notes: string
  }>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    lifecycle_stage: 'lead',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Add New Contact</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name *"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <input
            type="email"
            placeholder="Email *"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Company"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Job Title"
              value={formData.job_title}
              onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={formData.lifecycle_stage}
            onChange={(e) => setFormData(prev => ({ ...prev, lifecycle_stage: e.target.value as 'lead' | 'prospect' | 'customer' | 'lost' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="lead">Lead</option>
            <option value="prospect">Prospect</option>
            <option value="customer">Customer</option>
            <option value="lost">Lost</option>
          </select>
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Contact Modal (simplified - similar structure to create)
function EditContactModal({ contact, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    first_name: contact.first_name || '',
    last_name: contact.last_name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    company: contact.company || '',
    job_title: contact.job_title || '',
    lifecycle_stage: contact.lifecycle_stage || 'lead',
    notes: contact.notes || ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Edit Contact</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Same form fields as CreateContactModal */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name *"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <input
            type="email"
            placeholder="Email *"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Company"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Job Title"
              value={formData.job_title}
              onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={formData.lifecycle_stage}
            onChange={(e) => setFormData(prev => ({ ...prev, lifecycle_stage: e.target.value as 'lead' | 'prospect' | 'customer' | 'lost' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="lead">Lead</option>
            <option value="prospect">Prospect</option>
            <option value="customer">Customer</option>
            <option value="lost">Lost</option>
          </select>
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Delete Contact Modal
function DeleteContactModal({ contact, onClose, onConfirm }: any) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-red-600">Delete Contact</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{contact.first_name} {contact.last_name}</strong>? 
          This action cannot be undone and will also delete all related interactions, tasks, and leads.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Directory Integration Modal
function DirectoryIntegrationModal({ businessId, onClose, onComplete }: any) {
  const [syncing, setSyncing] = useState(false)
  const [syncResults, setSyncResults] = useState<any>(null)

  const handleSync = async () => {
    setSyncing(true)
    setSyncResults(null)

    try {
      const response = await fetch('/api/crm/integration/sync-directory-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId })
      })

      const data = await response.json()
      
      if (response.ok) {
        setSyncResults(data.results)
        onComplete()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      setSyncResults({ error: error.message })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Sync Directory Data</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          This will import existing customers from your business reviews and messages into your CRM contacts.
        </p>

        {syncResults && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            {syncResults.error ? (
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>Error: {syncResults.error}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center text-green-600 mb-3">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Sync completed!</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Contacts created:</span>
                    <span className="ml-2 font-medium text-green-600">{syncResults.contacts_created}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duplicates skipped:</span>
                    <span className="ml-2 font-medium">{syncResults.duplicates_skipped}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Reviews processed:</span>
                    <span className="ml-2 font-medium">{syncResults.reviews_processed}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Messages processed:</span>
                    <span className="ml-2 font-medium">{syncResults.messages_processed}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {syncResults ? 'Close' : 'Cancel'}
          </button>
          {!syncResults && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Start Sync'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Import Contacts Modal (simplified placeholder)
function ImportContactsModal({ businessId, onClose, onComplete }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Import Contacts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          CSV import functionality coming soon. You can manually add contacts or sync from directory for now.
        </p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// Import statements that need to be added at the top
// These are placeholder imports - you'll need to implement these components
function ContactDetailView(props: any) {
  return <div>Abhi baki hai implement karna</div>
}