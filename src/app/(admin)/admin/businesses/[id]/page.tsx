// src/app/(admin)/admin/businesses/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function AdminBusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [moderationNotes, setModerationNotes] = useState('')
  const supabase = createClient()
  
  useEffect(() => {
    // src/app/(admin)/admin/businesses/[id]/page.tsx
// Update the fetchBusinessDetails function:

async function fetchBusinessDetails() {
    try {
      // Get the business details first
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', params.id)
        .single()
        
      if (businessError) throw businessError
      
      // Get owner profile separately
      let businessWithRelations = { ...business }
      
      if (business.profile_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', business.profile_id)
          .single()
          
        businessWithRelations.profiles = profile
      }
      
      // Get locations separately
      const { data: locations } = await supabase
        .from('locations')
        .select('*')
        .eq('business_id', business.id)
        
      businessWithRelations.locations = locations || []
      
      // Get contacts separately
      const { data: contacts } = await supabase
        .from('business_contacts')
        .select('*')
        .eq('business_id', business.id)
        
      businessWithRelations.business_contacts = contacts || []
      
      console.log('Business with relations:', businessWithRelations)
      
      setBusiness(businessWithRelations)
      setModerationNotes(businessWithRelations.moderation_notes || '')
    } catch (error: any) {
      console.error('Error fetching business details:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
    
    fetchBusinessDetails()
  }, [params.id, supabase])
  
  const handleStatusChange = async (status: 'active' | 'rejected' | 'pending') => {
    try {
      setProcessing(true)
      
      // Get current user (admin)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')
      
      // Update business status
      const { error } = await supabase
        .from('businesses')
        .update({ 
          status,
          moderation_notes: moderationNotes,
          moderated_at: new Date().toISOString(),
          moderated_by: user.id
        })
        .eq('id', business.id)
        
      if (error) throw error
      
      // Update local state
      setBusiness({
        ...business,
        status,
        moderation_notes: moderationNotes,
        moderated_at: new Date().toISOString(),
        moderated_by: user.id
      })
      
      // Show success message
      alert(`Business has been ${status === 'active' ? 'approved' : status === 'rejected' ? 'rejected' : 'set to pending'}`)
      
    } catch (error: any) {
      console.error('Error updating business status:', error)
      setError(error.message)
    } finally {
      setProcessing(false)
    }
  }
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 h-96"></div>
      </div>
    )
  }
  
  if (error || !business) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error || 'Business not found'}</p>
        </div>
        <Link href="/admin/businesses" className="text-blue-600 hover:underline">
          &larr; Back to businesses
        </Link>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/businesses" className="text-blue-600 hover:underline text-sm">
            &larr; Back to businesses
          </Link>
          <h1 className="text-2xl font-bold mt-2">Review Business: {business.name}</h1>
        </div>
        <span className={`px-3 py-1 text-sm font-semibold rounded-full 
          ${business.status === 'active' ? 'bg-green-100 text-green-800' : 
            business.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'}`}
        >
          {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
        </span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Business Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Business Name</h3>
                <p className="mt-1">{business.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Slug</h3>
                <p className="mt-1">{business.slug}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Short Description</h3>
                <p className="mt-1">{business.short_description || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Established Year</h3>
                <p className="mt-1">{business.established_year || 'Not provided'}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Full Description</h3>
                <p className="mt-1">{business.description || 'Not provided'}</p>
              </div>
            </div>
            
            <h2 className="text-lg font-medium mb-4">Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
              
               <h3 className="text-sm font-medium text-gray-500 mb-2">Logo</h3>
               {business.logo_url ? (
                 <div className="relative w-32 h-32 border rounded-full overflow-hidden">
                   <Image 
                     src={business.logo_url}
                     alt={`${business.name} logo`}
                     fill
                     className="object-cover"
                   />
                 </div>
               ) : (
                 <p className="text-sm text-gray-500">No logo uploaded</p>
               )}
             </div>
             <div>
               <h3 className="text-sm font-medium text-gray-500 mb-2">Cover Image</h3>
               {business.cover_url ? (
                 <div className="relative w-full h-40 border rounded-md overflow-hidden">
                   <Image 
                     src={business.cover_url}
                     alt={`${business.name} cover`}
                     fill
                     className="object-cover"
                   />
                 </div>
               ) : (
                 <p className="text-sm text-gray-500">No cover image uploaded</p>
               )}
             </div>
           </div>
           
           <h2 className="text-lg font-medium mb-4">Contact Information</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
             {business.business_contacts && business.business_contacts.length > 0 ? (
               business.business_contacts.map((contact: any) => (
                 <div key={contact.id}>
                   <h3 className="text-sm font-medium text-gray-500">
                     {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
                   </h3>
                   <p className="mt-1">{contact.value}</p>
                 </div>
               ))
             ) : (
               <p className="text-sm text-gray-500">No contact information provided</p>
             )}
           </div>
           
           <h2 className="text-lg font-medium mb-4">Locations</h2>
           {business.locations && business.locations.length > 0 ? (
             <div className="space-y-4">
               {business.locations.map((location: any) => (
                 <div key={location.id} className="border rounded-md p-4">
                   <h3 className="font-medium mb-2">{location.name || 'Primary Location'}</h3>
                   <p>
                     {location.address_line1}<br />
                     {location.address_line2 && <>{location.address_line2}<br /></>}
                     {location.city}, {location.state} {location.postal_code}<br />
                     {location.country}
                   </p>
                 </div>
               ))}
             </div>
           ) : (
             <p className="text-sm text-gray-500">No locations found</p>
           )}
         </div>
       </div>
       
       <div className="lg:col-span-1">
         <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sticky top-6">
           <h2 className="text-lg font-medium mb-4">Owner Information</h2>
           <div className="mb-6">
             <h3 className="text-sm font-medium text-gray-500">Name</h3>
             <p className="mt-1">{business.profiles?.full_name || 'Unknown'}</p>
             
             <h3 className="text-sm font-medium text-gray-500 mt-4">Email</h3>
             <p className="mt-1">{business.profiles?.email || 'Unknown'}</p>
             
             <h3 className="text-sm font-medium text-gray-500 mt-4">Joined</h3>
             <p className="mt-1">{new Date(business.created_at).toLocaleDateString()}</p>
           </div>
           
           <h2 className="text-lg font-medium mb-4">Moderation</h2>
           <div className="mb-6">
             <label htmlFor="moderation-notes" className="block text-sm font-medium text-gray-700 mb-1">
               Moderation Notes
             </label>
             <textarea
               id="moderation-notes"
               rows={4}
               className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
               placeholder="Add notes about this business (optional)"
               value={moderationNotes}
               onChange={(e) => setModerationNotes(e.target.value)}
             ></textarea>
           </div>
           
           <div className="space-y-3">
             <button
               onClick={() => handleStatusChange('active')}
               disabled={processing || business.status === 'active'}
               className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                 business.status === 'active'
                   ? 'bg-green-300 cursor-not-allowed'
                   : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
               }`}
             >
               {processing ? 'Processing...' : business.status === 'active' ? 'Already Approved' : 'Approve Business'}
             </button>
             
             <button
               onClick={() => handleStatusChange('rejected')}
               disabled={processing || business.status === 'rejected'}
               className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                 business.status === 'rejected'
                   ? 'bg-red-300 cursor-not-allowed'
                   : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
               }`}
             >
               {processing ? 'Processing...' : business.status === 'rejected' ? 'Already Rejected' : 'Reject Business'}
             </button>
             
             {business.status !== 'pending' && (
               <button
                 onClick={() => handleStatusChange('pending')}
                 disabled={processing || business.status === 'pending'}
                 className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                   business.status === 'pending'
                     ? 'bg-yellow-300 cursor-not-allowed'
                     : 'bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500'
                 }`}
               >
                 {processing ? 'Processing...' : 'Set to Pending Review'}
               </button>
             )}
           </div>
           
           <div className="mt-6 pt-6 border-t border-gray-200">
             <Link 
               href={`/businesses/${business.slug}`} 
               target="_blank"
               className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
             >
               View Public Listing
             </Link>
           </div>
         </div>
       </div>
     </div>
   </div>
 )
}