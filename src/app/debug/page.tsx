'use client'
import { useSiteContext } from '@/hooks/useSiteContext'
import { resolveTemplate } from '@/lib/template/middleware'
import { usePathname } from 'next/navigation'

export default function DebugPage() {
  const { siteConfig, loading } = useSiteContext()
  const pathname = usePathname()
  
  // Test template resolution
  const templateInfo = resolveTemplate('/', siteConfig)
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🔍 Site Debug Information</h1>
      
      {/* Current URL Info */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2">Current Request</h2>
        <div className="space-y-1 text-sm">
          <div><strong>Domain:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</div>
          <div><strong>Full URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
          <div><strong>Pathname:</strong> {pathname}</div>
        </div>
      </div>

      {/* Site Context */}
      <div className="bg-blue-50 p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2">Site Context</h2>
        {loading ? (
          <div>Loading site context...</div>
        ) : siteConfig ? (
          <div className="space-y-1 text-sm">
            <div><strong>✅ Site Found:</strong> {siteConfig.name}</div>
            <div><strong>Site ID:</strong> {siteConfig.id}</div>
            <div><strong>Domain:</strong> {siteConfig.domain}</div>
            <div><strong>Site Type:</strong> {siteConfig.site_type}</div>
            <div><strong>Template:</strong> {siteConfig.template}</div>
            <div><strong>Niche:</strong> {siteConfig.config?.niche || 'N/A'}</div>
            <div><strong>Location:</strong> {siteConfig.config?.location || 'N/A'}</div>
            <div><strong>Primary Color:</strong> 
              <span 
                className="inline-block w-4 h-4 ml-2 rounded"
                style={{ backgroundColor: siteConfig.config?.theme?.primaryColor || '#gray' }}
              ></span>
              {siteConfig.config?.theme?.primaryColor}
            </div>
          </div>
        ) : (
          <div className="text-red-600">❌ No site context found</div>
        )}
      </div>

      {/* Template Resolution */}
      <div className="bg-green-50 p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2">Template Resolution</h2>
        <div className="space-y-1 text-sm">
          <div><strong>Template Found:</strong> {templateInfo.template?.name || 'None'}</div>
          <div><strong>Component:</strong> {templateInfo.component || 'None'}</div>
          <div><strong>Is Supported:</strong> {templateInfo.isSupported ? '✅ Yes' : '❌ No'}</div>
          <div><strong>Template Type:</strong> {templateInfo.template?.siteType || 'N/A'}</div>
        </div>
      </div>

      {/* Raw Site Config */}
      <div className="bg-yellow-50 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Raw Site Config (JSON)</h2>
        <pre className="text-xs bg-white p-2 rounded overflow-auto">
          {JSON.stringify(siteConfig, null, 2)}
        </pre>
      </div>

      {/* Test API */}
      <div className="mt-6">
        <button 
          onClick={async () => {
            try {
              const response = await fetch('/api/site/current')
              const data = await response.json()
              console.log('API Response:', data)
              alert('Check console for API response')
            } catch (error) {
              console.error('API Error:', error)
              alert('API Error - check console')
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Test /api/site/current
        </button>
      </div>
    </div>
  )
}