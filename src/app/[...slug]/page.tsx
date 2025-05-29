// src/app/[...slug]/page.tsx - ENTERPRISE CMS DYNAMIC ROUTING
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSite } from '@/lib/site-context'
import type { Metadata } from 'next'

interface CmsPage {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  post_status: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  featured_image_url?: string
  template?: string
  meta_data?: any
  published_at?: string
  updated_at: string
  author_id?: string
}

interface CmsPageProps {
  params: { slug: string[] }
}

// ENTERPRISE SEO: Generate metadata for each CMS page
export async function generateMetadata({ params }: CmsPageProps): Promise<Metadata> {
  const siteConfig = getCurrentSite()
  if (!siteConfig) return { title: 'Page Not Found' }

  const slug = params.slug?.join('/') || ''
  const { createClient } = require('@/lib/supabase/server')
  const supabase = createClient()

  // FIXED: Use same security definer function as main component
  const { data: pageResult, error } = await supabase
    .rpc('get_published_page', {
      p_site_id: siteConfig.id,
      p_slug: slug
    })

  const page = pageResult && pageResult.length > 0 ? pageResult[0] : null

  if (!page) {
    return { title: 'Page Not Found' }
  }

  // Enterprise SEO metadata
  const title = page.seo_title || page.title
  const description = page.seo_description || page.excerpt || `${page.title} - ${siteConfig.name}`
  const keywords = page.seo_keywords || []
  const lastModified = page.updated_at || page.published_at
  const canonicalUrl = `http://${siteConfig.domain}/${page.slug}`

  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    keywords: keywords.join(', '),
    
    // OpenGraph for social sharing
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      images: page.featured_image_url ? [
        {
          url: page.featured_image_url,
          width: 1200,
          height: 630,
          alt: page.title,
        }
      ] : [],
      type: 'article',
      publishedTime: page.published_at || undefined,
      modifiedTime: lastModified,
    },

    // Twitter Cards
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: page.featured_image_url ? [page.featured_image_url] : [],
    },

    // SEO Essentials
    alternates: {
      canonical: canonicalUrl,
    },
    
    // Structured Data
    other: {
      'article:published_time': page.published_at || '',
      'article:modified_time': lastModified,
      'article:section': siteConfig.site_type,
    },

    // Performance & Indexing
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

// ENTERPRISE PERFORMANCE: Generate static params for ISR  
// Temporarily disabled to fix headers() error
// export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
//   return [] // Will enable after fixing headers issue
// }

// ENTERPRISE PAGE RENDERER
export default async function CmsPageRenderer({ params }: CmsPageProps) {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    notFound()
  }

  const slug = params.slug?.join('/') || ''
  
  // PERMANENT FIX: Use server client with security definer function
  const { createClient } = require('@/lib/supabase/server')
  const supabase = createClient()

  // ENTERPRISE: Query using security definer function (bypasses RLS)
  const { data: pageResult, error } = await supabase
    .rpc('get_published_page', {
      p_site_id: siteConfig.id,
      p_slug: slug
    })

  // Function returns array, get first item
  let page = pageResult && pageResult.length > 0 ? pageResult[0] : null

  console.log('🔍 PERMANENT FIX - Page query result:', { 
    pageResult, 
    error, 
    slug, 
    siteId: siteConfig.id,
    pageFound: !!page 
  })

  // ENTERPRISE DEBUG: If page not found, check if it exists for other sites
  if (!page && !error) {
    console.log('🔍 Page not found for current site, checking all sites...')
    
    const { data: allPagesDebug, error: debugError } = await supabase
      .from('site_posts')
      .select('id, site_id, slug, title, post_status')
      .eq('slug', slug)
      .eq('post_type', 'page')
    
    console.log('🔍 All pages with this slug:', allPagesDebug)
    
    if (allPagesDebug && allPagesDebug.length > 0) {
      console.log('⚠️ FOUND PAGE BUT WRONG SITE_ID!')
      console.log('Current site_id:', siteConfig.id)
      console.log('Page belongs to site_id:', allPagesDebug[0].site_id)
      
      // SECURE: Only suggest fix, don't auto-execute
      console.log('💡 SUGGESTION: Page exists on different site. Admin can move it manually.')
      
      // TODO: Add admin notification system for page conflicts
    }
  }

  console.log('🔍 Page query result:', { page, error, slug, siteId: siteConfig.id })

  if (error || !page) {
    console.log(`❌ CMS Page not found: ${slug} for site ${siteConfig.domain}`, error)
    notFound()
  }

  // Enterprise access control
  if (page.post_status !== 'published') {
    // TODO: Add admin/preview access check here
    notFound()
  }

  console.log(`✅ CMS Page rendered: ${page.title} (${slug})`)

  // Simplified breadcrumbs for now
  const breadcrumbs = [
    { title: 'Home', slug: '' },
    { title: page.title, slug: page.slug }
  ]

  // Get navigation menu for page context
  const { data: menu } = await supabase
    .from('site_menus')
    .select('items')
    .eq('site_id', siteConfig.id)
    .eq('name', 'header')
    .eq('is_active', true)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enterprise Page Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <nav className="text-sm text-gray-600 mb-4">
            <BreadcrumbNavigation breadcrumbs={breadcrumbs} siteConfig={siteConfig} />
          </nav>
          
          {page.featured_image_url && (
            <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden mb-6">
              <img
                src={page.featured_image_url}
                alt={page.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {page.title}
            </h1>
            
            {page.excerpt && (
              <p className="text-lg text-gray-600 leading-relaxed">
                {page.excerpt}
              </p>
            )}
            
            {/* Enterprise Page Meta */}
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-4">
              {page.published_at && (
                <span>Published {new Date(page.published_at).toLocaleDateString()}</span>
              )}
              {page.updated_at !== page.published_at && (
                <span>Updated {new Date(page.updated_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Enterprise Page Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl">
          <article className="prose prose-lg max-w-none">
            {/* Enterprise Content Renderer */}
            <PageContentRenderer 
              content={page.content} 
              template={page.template}
              metadata={page.meta_data}
              siteConfig={siteConfig}
            />
          </article>

          {/* Enterprise Page Actions */}
          <footer className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Last updated: {new Date(page.updated_at).toLocaleDateString()}
              </div>
              
              {/* Enterprise Social Sharing */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">Share:</span>
                <ShareButtons 
                  url={`http://${siteConfig.domain}/${page.slug}`}
                  title={page.title}
                  description={page.excerpt || ''}
                />
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Enterprise Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": page.title,
            "description": page.excerpt || page.seo_description,
            "url": `http://${siteConfig.domain}/${page.slug}`,
            "datePublished": page.published_at,
            "dateModified": page.updated_at,
            "publisher": {
              "@type": "Organization",
              "name": siteConfig.name,
              "url": `http://${siteConfig.domain}`
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `http://${siteConfig.domain}/${page.slug}`
            }
          })
        }}
      />
    </div>
  )
}

// ENTERPRISE BREADCRUMB COMPONENT (SIMPLIFIED)
function BreadcrumbNavigation({ breadcrumbs, siteConfig }: any) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((crumb: any, index: number) => (
          <li key={crumb.slug || index} className="flex items-center">
            {index > 0 && (
              <svg className="w-4 h-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-gray-500 font-medium">{crumb.title}</span>
            ) : (
              <a 
                href={`http://${siteConfig.domain}/${crumb.slug}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {crumb.title}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// ENTERPRISE CONTENT RENDERER
function PageContentRenderer({ content, template, metadata, siteConfig }: any) {
  // Enterprise content processing
  if (!content) {
    return (
      <div className="text-center py-12 text-gray-500">
        <h3 className="text-lg font-medium mb-2">No content available</h3>
        <p>This page is currently being updated.</p>
      </div>
    )
  }

  // Process content based on template
  let processedContent = content

  // Enterprise content enhancements
  if (template === 'landing-page') {
    // Add CTA processing, conversion tracking, etc.
  } else if (template === 'service-page') {
    // Add booking widgets, service listings, etc.
  }

  return (
    <div 
      className="prose-content"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  )
}

// ENTERPRISE SOCIAL SHARING
function ShareButtons({ url, title, description }: any) {
  const shareData = [
    {
      name: 'Twitter',
      icon: '🐦',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    },
    {
      name: 'Facebook', 
      icon: '📘',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      name: 'LinkedIn',
      icon: '💼', 
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    }
  ]

  return (
    <div className="flex items-center space-x-2">
      {shareData.map(share => (
        <a
          key={share.name}
          href={share.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title={`Share on ${share.name}`}
        >
          <span className="text-lg">{share.icon}</span>
        </a>
      ))}
    </div>
  )
}

// ENTERPRISE PERFORMANCE: Enable ISR (disabled for debugging)
// export const revalidate = 3600 // Will enable after testing