// src/components/businesses/ai-field-generator.tsx
'use client'

import { useState } from 'react'

type AiFieldGeneratorProps = {
  fieldType: 'short_description' | 'description'
  businessName: string
  category?: string
  onGenerated: (text: string) => void
}

export default function AiFieldGenerator({ fieldType, businessName, category, onGenerated }: AiFieldGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  
  const handleGenerate = async () => {
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldType,
          businessName,
          category
        }),
      })
      
      const data = await response.json()
      
      if (data.content) {
        onGenerated(data.content)
      }
    } catch (error) {
      console.error('Error generating content:', error)
      alert('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={isGenerating}
      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
    >
      <svg className="w-4 h-4 mr-1" fill="none" strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
      {isGenerating ? 'Generating...' : `Generate ${fieldType === 'short_description' ? 'Short Description' : 'Description'}`}
    </button>
  )
}