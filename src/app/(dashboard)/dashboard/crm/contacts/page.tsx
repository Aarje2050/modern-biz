// Replace src/app/(dashboard)/dashboard/crm/contacts/page.tsx with this:
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import ContactsManagement from '@/components/crm/contacts-management'

export default function ContactsPage() {
  const { user } = useAuth()
  const [businessId, setBusinessId] = useState<string>('')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserBusinesses() {

      if (!user) {
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        // Add null check
  if (!supabase) {
    
    setLoading(false)
    return
  }
        const { data: userBusinesses } = await supabase
          .from('businesses')
          .select('id, name, slug, status')
          .eq('profile_id', user.id)
          .eq('status', 'active')
        
        setBusinesses(userBusinesses || [])
        
        // Auto-select first business
        if (userBusinesses && userBusinesses.length > 0) {
          setBusinessId(userBusinesses[0].id)
        }
      } catch (error) {
        console.error('Error fetching businesses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserBusinesses()
  }, [user])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!businessId || businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Business Found</h3>
        <p className="text-gray-500 mb-4">You need an active business to use CRM features.</p>
        <a 
          href="/businesses/add" 
          className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Your Business
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Business Selector (if multiple businesses) */}
      {businesses.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Business:
          </label>
          <select
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <ContactsManagement businessId={businessId} />
    </div>
  )
}