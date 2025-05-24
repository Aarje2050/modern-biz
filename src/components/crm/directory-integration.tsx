// src/components/crm/directory-integration.tsx
'use client'

import { useState } from 'react'
import { Download, Upload, RefreshCcw, CheckCircle, AlertCircle } from 'lucide-react'

interface DirectoryIntegrationProps {
  businessId: string
}

export default function DirectoryIntegration({ businessId }: DirectoryIntegrationProps) {
  const [syncing, setSyncing] = useState(false)
  const [syncResults, setSyncResults] = useState<any>(null)

  const handleSyncDirectory = async () => {
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
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Sync error:', error)
      if (error instanceof Error) {
      setSyncResults({ error: error.message })
    } else {
        setSyncResults({ error: 'An unknown error occurred' })
    }
}

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Directory Integration</h3>
          <p className="text-sm text-gray-600">
            Import existing customers from reviews and messages
          </p>
        </div>
        <button
          onClick={handleSyncDirectory}
          disabled={syncing}
          className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Directory Data'}
        </button>
      </div>

      {syncResults && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          {syncResults.error ? (
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Error: {syncResults.error}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center text-green-600 mb-3">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Sync completed successfully!</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Reviews processed:</span>
                  <span className="ml-2 font-medium">{syncResults.reviews_processed}</span>
                </div>
                <div>
                  <span className="text-gray-600">Messages processed:</span>
                  <span className="ml-2 font-medium">{syncResults.messages_processed}</span>
                </div>
                <div>
                  <span className="text-gray-600">Contacts created:</span>
                  <span className="ml-2 font-medium text-green-600">{syncResults.contacts_created}</span>
                </div>
                <div>
                  <span className="text-gray-600">Duplicates skipped:</span>
                  <span className="ml-2 font-medium">{syncResults.duplicates_skipped}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Integration Options</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-create from reviews</p>
              <p className="text-xs text-gray-600">Automatically add reviewers as customers</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-create from messages</p>
              <p className="text-xs text-gray-600">Automatically add message senders as prospects</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
        </div>
      </div>
    </div>
  )
  }}