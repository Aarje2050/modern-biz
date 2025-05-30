// src/app/(admin)/admin/sites/[id]/templates/page.tsx (SERVER COMPONENT)
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TemplateSelector from './TemplateSelector'

interface TemplatesPageProps {
  params: { id: string }
}

export default async function TemplatesPage({ params }: TemplatesPageProps) {
  const supabase = createClient()
  
  // Get site data
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('id, name, domain, site_type')
    .eq('id', params.id)
    .single()

  if (siteError || !site) {
    return notFound()
  }

  // Get current template selections
  const { data: customizations, error: customError } = await supabase
    .from('site_customizations')
    .select('page_templates')
    .eq('site_id', params.id)
    .eq('section', 'templates')
    .eq('is_active', true)
    .single()

  // Handle no customizations found (not an error)
  const currentTemplates = customizations?.page_templates || {
    about: 'template-v1',
    contact: 'template-v1'
  }

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Page Templates</h1>
            <p className="text-gray-600 mt-1">
              Choose templates for each page type on your site
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">{site.name}</div>
            <div className="text-sm text-gray-500">{site.domain}</div>
            <div className="text-xs text-gray-400 capitalize mt-1">
              {site.site_type} site
            </div>
          </div>
        </div>
      </div>

      {/* Template Management Interface */}
      <TemplateSelector 
        siteId={params.id}
        siteType={site.site_type}
        currentTemplates={currentTemplates}
      />

    </div>
  )
}