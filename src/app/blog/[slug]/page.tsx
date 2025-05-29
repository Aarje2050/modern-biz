// src/app/blog/[slug]/page.tsx - SINGLE POST PAGE
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSite } from '@/lib/site-context'
import Link from 'next/link'
import type { Metadata } from 'next'

interface BlogPost {
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

interface SinglePostProps {
  params: { slug: string }
}

// ENTERPRISE SEO: Generate metadata for each blog post
export async function generateMetadata({ params }: SinglePostProps): Promise<Metadata> {
  const siteConfig = getCurrentSite()
  if (!siteConfig) return { title: 'Post Not Found' }

  const slug = params.slug
  const { createClient } = require('@/lib/supabase/server')
  const supabase = createClient()

  // Get post data for metadata
  const { data: postResult, error } = await supabase
    .rpc('get_published_post_by_slug', {
      p_site_id: siteConfig.id,
      p_slug: slug
    })

  const post = postResult && postResult.length > 0 ? postResult[0] : null

  if (!post) {
    return { title: 'Post Not Found' }
  }

  // Enterprise SEO metadata
  const title = post.seo_title || post.title
  const description = post.seo_description || post.excerpt || `${post.title} - ${siteConfig.name}`
  const keywords = post.seo_keywords || []
  const publishedTime = post.published_at
  const modifiedTime = post.updated_at
  const canonicalUrl = `http://${siteConfig.domain}/blog/${post.slug}`

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
      images: post.featured_image_url ? [
        {
          url: post.featured_image_url,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ] : [],
      type: 'article',
      publishedTime: publishedTime || undefined,
      modifiedTime: modifiedTime,
      authors: ['Team'],
      section: 'Blog',
      tags: keywords,
    },

    // Twitter Cards
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.featured_image_url ? [post.featured_image_url] : [],
    },

    // SEO Essentials
    alternates: {
      canonical: canonicalUrl,
    },
    
    // Blog-specific metadata
    other: {
      'article:published_time': publishedTime || '',
      'article:modified_time': modifiedTime,
      'article:section': 'Blog',
      'article:tag': keywords.join(','),
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

// ENTERPRISE PERFORMANCE: Generate static params for popular posts
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const siteConfig = getCurrentSite()
    if (!siteConfig) return []

    const { createClient } = require('@/lib/supabase/server')
    const supabase = createClient()
    
    const { data: posts } = await supabase
      .rpc('get_published_posts', {
        p_site_id: siteConfig.id
      })

    if (!posts) return []

    return posts.slice(0, 50).map((post: any) => ({
      slug: post.slug
    }))
  } catch (error) {
    console.error('Error generating static params for blog posts:', error)
    return []
  }
}

export default async function SinglePostPage({ params }: SinglePostProps) {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    notFound()
  }

  const slug = params.slug
  const { createClient } = require('@/lib/supabase/server')
  const supabase = createClient()

  // Get post data using security definer function
  const { data: postResult, error } = await supabase
    .rpc('get_published_post_by_slug', {
      p_site_id: siteConfig.id,
      p_slug: slug
    })

  const post = postResult && postResult.length > 0 ? postResult[0] : null

  console.log('🔍 Single post query result:', { 
    postResult, 
    error, 
    slug, 
    siteId: siteConfig.id,
    postFound: !!post 
  })

  if (error || !post) {
    console.log(`❌ Blog post not found: ${slug} for site ${siteConfig.domain}`)
    notFound()
  }

  // Enterprise access control
  if (post.post_status !== 'published') {
    notFound()
  }

  console.log(`✅ Blog post rendered: ${post.title} (${slug})`)

  // Get related posts (same tags)
  const { data: relatedPosts } = await supabase
    .rpc('get_related_posts', {
      p_site_id: siteConfig.id,
      p_post_id: post.id,
      p_limit: 3
    })

  const readingTime = Math.ceil((post.content?.length || 0) / 1000) // Rough estimate

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Article Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumbs */}
          <nav className="text-sm text-gray-600 mb-6">
            <div className="flex items-center space-x-2">
              <Link href="/" className="hover:text-gray-900">Home</Link>
              <span>›</span>
              <Link href="/blog" className="hover:text-gray-900">Blog</Link>
              <span>›</span>
              <span className="text-gray-900 font-medium">{post.title}</span>
            </div>
          </nav>
          
          <div className="max-w-4xl mx-auto">
            {/* Article Meta */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
              <time dateTime={post.published_at}>
                {new Date(post.published_at || post.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              <span>•</span>
              <span>{readingTime} min read</span>
              {post.seo_keywords && post.seo_keywords.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-2">
                    {post.seo_keywords.slice(0, 2).map((tag: string, index: number) => (
                      <span 
                        key={index}
                        className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Article Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>
            
            {/* Article Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-gray-600 leading-relaxed mb-8 border-l-4 border-blue-500 pl-6 italic">
                {post.excerpt}
              </p>
            )}

            {/* Featured Image */}
            {post.featured_image_url && (
              <div className="w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <article className="lg:col-span-3">
              <div className="prose prose-lg max-w-none">
                <div 
                  className="blog-content"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>

              {/* Article Tags */}
              {post.seo_keywords && post.seo_keywords.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-3">
                    {post.seo_keywords.map((tag: string, index: number) => (
                      <span 
                        key={index}
                        className="inline-flex px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Sharing */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this post</h3>
                <ShareButtons 
                  url={`http://${siteConfig.domain}/blog/${post.slug}`}
                  title={post.title}
                  description={post.excerpt || ''}
                />
              </div>

              {/* Author Info */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {siteConfig.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Team {siteConfig.name}</h3>
                    <p className="text-gray-600">
                      Our team is passionate about sharing insights and helping our community.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-6 space-y-8">
                {/* Table of Contents (if content has headers) */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">In this article</h3>
                  <div className="space-y-2 text-sm">
                    <div className="text-gray-600">
                      Auto-generated table of contents will appear here based on article headers.
                    </div>
                  </div>
                </div>

                {/* Newsletter Signup */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Stay Updated</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Get the latest posts delivered right to your inbox.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                      Subscribe
                    </button>
                  </div>
                </div>

                {/* Article Stats */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Article Info</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Published:</span>
                      <span className="font-medium">
                        {new Date(post.published_at || post.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reading time:</span>
                      <span className="font-medium">{readingTime} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Words:</span>
                      <span className="font-medium">{Math.ceil((post.content?.length || 0) / 5)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="bg-white border-t">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost: any) => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="group"
                  >
                    <article className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {relatedPost.featured_image_url && (
                        <div className="w-full h-32">
                          <img
                            src={relatedPost.featured_image_url}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(relatedPost.published_at).toLocaleDateString()}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt || post.seo_description,
            "image": post.featured_image_url ? [post.featured_image_url] : [],
            "datePublished": post.published_at,
            "dateModified": post.updated_at,
            "author": {
              "@type": "Organization",
              "name": siteConfig.name,
              "url": `http://${siteConfig.domain}`
            },
            "publisher": {
              "@type": "Organization",
              "name": siteConfig.name,
              "url": `http://${siteConfig.domain}`
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `http://${siteConfig.domain}/blog/${post.slug}`
            },
            "keywords": post.seo_keywords?.join(", ") || "",
            "wordCount": Math.ceil((post.content?.length || 0) / 5),
            "timeRequired": `PT${readingTime}M`,
            "url": `http://${siteConfig.domain}/blog/${post.slug}`
          })
        }}
      />
    </div>
  )
}

// ENTERPRISE SOCIAL SHARING COMPONENT
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
    },
    {
      name: 'Email',
      icon: '📧',
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + '\n\n' + url)}`
    }
  ]

  return (
    <div className="flex items-center space-x-3">
      {shareData.map(share => (
        <a
          key={share.name}
          href={share.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          title={`Share on ${share.name}`}
        >
          <span>{share.icon}</span>
          <span>{share.name}</span>
        </a>
      ))}
    </div>
  )
}

// ENTERPRISE PERFORMANCE: Enable ISR
export const revalidate = 3600 // Revalidate every hour