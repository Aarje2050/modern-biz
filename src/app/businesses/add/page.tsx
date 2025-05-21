// src/app/businesses/add/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BusinessForm from '@/components/businesses/business-form'

export default async function AddBusinessPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login?redirect_to=/businesses/add')
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Add Your Business</h1>
        <BusinessForm />
      </div>
    </div>
  )
}