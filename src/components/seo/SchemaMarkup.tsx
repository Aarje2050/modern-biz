// src/components/seo/SchemaMarkup.tsx - Reusable Schema Component
'use client'

import { useEffect } from 'react'
import { useSiteContext } from '@/hooks/useSiteContext'
import { createSEOService, SchemaData } from '@/lib/seo/service'

interface SchemaMarkupProps {
  data: SchemaData
  id?: string
}

export default function SchemaMarkup({ data, id = 'schema-markup' }: SchemaMarkupProps) {
  const { siteConfig } = useSiteContext()

  useEffect(() => {
    if (!siteConfig) return

    const seoService = createSEOService(siteConfig)
    if (!seoService) return

    const schemaJson = seoService.generateSchema(data)
    
    // Remove existing schema with same ID
    const existingScript = document.getElementById(id)
    if (existingScript) {
      existingScript.remove()
    }

    // Add new schema
    if (schemaJson) {
      const script = document.createElement('script')
      script.id = id
      script.type = 'application/ld+json'
      script.textContent = schemaJson
      document.head.appendChild(script)
    }

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById(id)
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [siteConfig, data, id])

  return null
}

// Server-side schema component for SSR
interface ServerSchemaMarkupProps {
  schemaJson: string
  id?: string
}

export function ServerSchemaMarkup({ schemaJson, id = 'server-schema' }: ServerSchemaMarkupProps) {
  if (!schemaJson) return null

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: schemaJson }}
    />
  )
}

// Convenience components for specific schema types
interface BusinessSchemaProps {
  business: {
    name: string
    description: string
    slug: string
    phone?: string
    email?: string
    website?: string
    address?: {
      street?: string
      city: string
      state?: string
      postal?: string
      country?: string
    }
    rating?: {
      value: number
      count: number
    }
    hours?: Record<string, string>
    priceRange?: string
    image?: string
    category?: string
  }
}

export function BusinessSchema({ business }: BusinessSchemaProps) {
  const schemaData: SchemaData = {
    localBusiness: {
      name: business.name,
      description: business.description,
      category: business.category || 'Local Business',
      location: {
        street: business.address?.street,
        city: business.address?.city || '',
        state: business.address?.state,
        postal: business.address?.postal,
        country: business.address?.country || 'US',
      },
      contact: {
        phone: business.phone,
        email: business.email,
        website: business.website,
      },
      hours: business.hours,
      rating: business.rating,
      priceRange: business.priceRange,
      image: business.image,
    }
  }

  return <SchemaMarkup data={schemaData} id={`business-schema-${business.slug}`} />
}

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string
    url: string
  }>
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schemaData: SchemaData = {
    breadcrumbs: items
  }

  return <SchemaMarkup data={schemaData} id="breadcrumb-schema" />
}

interface ArticleSchemaProps {
  article: {
    headline: string
    description: string
    author: string
    publishedTime: string
    modifiedTime?: string
    image?: string
  }
}

export function ArticleSchema({ article }: ArticleSchemaProps) {
  const schemaData: SchemaData = {
    article
  }

  return <SchemaMarkup data={schemaData} id="article-schema" />
}