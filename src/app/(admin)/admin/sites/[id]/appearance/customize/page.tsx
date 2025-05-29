// src/app/(admin)/admin/sites/[id]/appearance/customize/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SiteCustomizer from '@/components/cms/SiteCustomizer'

interface Props {
  params: { id: string }
}

export default async function SiteCustomizationPage({ params }: Props) {
  const supabase = createServerComponentClient({ cookies })
  
  // Verify access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: siteUser } = await supabase
    .from('site_users')
    .select('role')
    .eq('site_id', params.id)
    .eq('user_id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single()

  if (!siteUser && profile?.account_type !== 'admin') {
    redirect('/admin')
  }

  // Get site info
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!site) redirect('/admin/sites')

  // Get current customizations
  const { data: customizations = [] } = await supabase
    .from('site_customizations')
    .select('*')
    .eq('site_id', params.id)
    .eq('is_active', true)

  // Transform to object with section as key
  const customizationsObj = (customizations ?? []).reduce((acc: any, item) => {
    acc[item.section] = item.settings
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-4">
          <li>
            <a href="/admin" className="text-gray-400 hover:text-gray-500">Admin</a>
          </li>
          <li>
            <div className="flex items-center">
              <span className="text-gray-400">/</span>
              <a href="/admin/sites" className="ml-4 text-gray-400 hover:text-gray-500">Sites</a>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <span className="text-gray-400">/</span>
              <a href={`/admin/sites/${params.id}`} className="ml-4 text-gray-400 hover:text-gray-500">
                {site.name}
              </a>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <span className="text-gray-400">/</span>
              <span className="ml-4 text-gray-700">Customize</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customize Appearance</h1>
              <p className="mt-1 text-sm text-gray-500">
                Customize the look and feel of {site.name}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {site.domain && (
                <a
                  href={`https://${site.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Preview Site ↗
                </a>
              )}
              <a
                href={`/admin/sites/${params.id}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Back to Site
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Customizer */}
      <div className="px-4 sm:px-6 lg:px-8">
        <SiteCustomizer
          siteId={params.id}
          siteName={site.name}
          customizations={customizationsObj}
        />
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: site } = await supabase
    .from('sites')
    .select('name')
    .eq('id', params.id)
    .single()

  return {
    title: `Customize - ${site?.name || 'Site'} | CMS Admin`,
    description: 'Customize site appearance and branding'
  }
}