// Create New Page Route
import { verifyAdminAccess } from '@/lib/middleware/admin-access'
import { createClient } from '@/lib/supabase/server'
import PageEditor from '@/components/cms/PageEditor'
import { redirect } from 'next/navigation'

interface NewPageProps {
  params: { id: string }
}

export default async function NewPagePage({ params }: NewPageProps) {
  const { success, response } = await verifyAdminAccess()
  if (!success) return response

  const siteId = params.id
  const supabase = createClient()
  
  // Verify site exists and user has access
  const { data: site, error } = await supabase
    .from('sites')
    .select('id, name, domain, site_type')
    .eq('id', siteId)
    .single()

  if (error || !site) {
    redirect('/admin/sites')
  }

  return <PageEditor siteId={siteId} />
}