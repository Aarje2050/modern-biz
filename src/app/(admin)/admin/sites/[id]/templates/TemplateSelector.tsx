// src/app/(admin)/admin/sites/[id]/templates/TemplateSelector.tsx (FIXED)
'use client'

import { useState } from 'react'
import { getTemplateMetadata } from '@/lib/template-metadata'

interface TemplateSelections {
  [pageType: string]: string
}

interface TemplateSelectorProps {
  siteId: string
  siteType: string
  currentTemplates: TemplateSelections
}

export default function TemplateSelector({ 
  siteId, 
  siteType, 
  currentTemplates 
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateSelections>(currentTemplates)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get available templates for this site type (CLIENT-SAFE)
  const availableTemplates = getTemplateMetadata(siteType)

  // Check if we have templates for this site type
  const hasTemplates = Object.keys(availableTemplates).length > 0

  if (!hasTemplates) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Directory Templates Only</h3>
            <p className="text-sm text-blue-700 mt-1">
              Template management is currently available for directory sites only. 
              Support for <strong>{siteType}</strong> sites is coming soon.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handleTemplateChange = (pageType: string, templateId: string) => {
    setTemplates(prev => ({
      ...prev,
      [pageType]: templateId
    }))
    
    setSaved(false)
    setError(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/cms/sites/${siteId}/templates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_templates: templates
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to save templates`)
      }

      const result = await response.json()
      
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        throw new Error(result.message || 'Failed to save templates')
      }

    } catch (err) {
      console.error('Error saving templates:', err)
      setError(err instanceof Error ? err.message : 'Failed to save templates')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = JSON.stringify(templates) !== JSON.stringify(currentTemplates)

  return (
    <div className="space-y-8">
      
      {/* Page Template Sections */}
      <div className="space-y-6">
        {Object.entries(availableTemplates).map(([pageType, templateOptions]) => (
          <div key={pageType} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            
            {/* Page Type Header */}
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {pageType.replace('-', ' ')} Page Templates
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Choose the template style for your {pageType} page
              </p>
            </div>

            {/* Template Options */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templateOptions.map((template) => (
                  <div
                    key={template.id}
                    className={`relative border-2 rounded-lg transition-all duration-200 cursor-pointer ${
                      templates[pageType] === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleTemplateChange(pageType, template.id)}
                  >
                    {/* Template Preview */}
                    <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2"></div>
                        <div className="text-xs text-gray-500">Preview</div>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-medium ${
                          templates[pageType] === template.id ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {template.name}
                        </h4>
                        
                        {templates[pageType] === template.id && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <p className={`text-sm ${
                        templates[pageType] === template.id ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {template.description}
                      </p>
                    </div>

                    {/* Radio Input (Hidden) */}
                    <input
                      type="radio"
                      name={pageType}
                      value={template.id}
                      checked={templates[pageType] === template.id}
                      onChange={() => handleTemplateChange(pageType, template.id)}
                      className="sr-only"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          
          {/* Status Messages */}
          <div className="flex items-center space-x-4">
            {error && (
              <div className="flex items-center text-red-600">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {saved && (
              <div className="flex items-center text-green-600">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Templates saved successfully!</span>
              </div>
            )}

            {!error && !saved && hasChanges && (
              <div className="flex items-center text-amber-600">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">You have unsaved changes</span>
              </div>
            )}

            {!error && !saved && !hasChanges && (
              <div className="flex items-center text-gray-500">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">All changes saved</span>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              hasChanges && !saving
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              'Save Templates'
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Changes apply immediately:</strong> Your live site will use the new templates as soon as you save. 
            You can switch between templates anytime without affecting your content.
          </p>
        </div>
      </div>
    </div>
  )
}