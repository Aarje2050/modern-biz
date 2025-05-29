// src/app/blog/page.tsx - PUBLIC BLOG LISTING
import { createClient } from '@/lib/supabase/server'
import { getCurrentSite } from '@/lib/site-context'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image_url?: string
  published_at: string
  updated_at: string
  seo_keywords: string[]
  author_id: string
}

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    return { title: 'Blog Not Found' }
  }

  return {
    title: `Blog | ${siteConfig.name}`,
    description: `Latest posts and updates from ${siteConfig.name}`,
    alternates: {
      canonical: `http://${siteConfig.domain}/blog`,
    },
  }
}

export default async function BlogListingPage() {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    notFound()
  }

  const { createClient: createServerClient } = require('@/lib/supabase/server')
  const supabase = createServerClient()

  // Get published posts using security definer function
  const { data: posts, error } = await supabase
    .rpc('get_published_posts', {
      p_site_id: siteConfig.id
    })

  if (error) {
    console.error('Error fetching blog posts:', error)
  }

  const blogPosts = posts || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Blog Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Blog
            </h1>
            <p className="text-lg text-gray-600">
              Latest insights, updates, and stories from {siteConfig.name}
            </p>
          </div>
        </div>
      </header>

      {/* Blog Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {blogPosts.length > 0 ? (
            <div className="space-y-8">
              {blogPosts.map((post: BlogPost) => (
                <article 
                  key={post.id}
                  className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Featured Image */}
                  {post.featured_image_url && (
                    <div className="w-full h-48 md:h-64">
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    {/* Post Meta */}
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <time dateTime={post.published_at}>
                        {new Date(post.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                      
                      {post.seo_keywords && post.seo_keywords.length > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <div className="flex items-center space-x-2">
                            {post.seo_keywords.slice(0, 3).map((tag, index) => (
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

                    {/* Post Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-blue-600">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>

                    {/* Post Excerpt */}
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Read More */}
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Read more
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      
                      <div className="text-sm text-gray-500">
                        {Math.ceil((post.content?.length || 0) / 1000)} min read
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="text-center py-16">
              <div className="text-gray-500">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-medium mb-2">No blog posts yet</h3>
                <p className="text-gray-600 mb-6">
                  Check back soon for our latest insights and updates.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Return Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Blog Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-600">
              Subscribe to our blog for the latest updates from {siteConfig.name}
            </p>
            {/* TODO: Add newsletter signup */}
          </div>
        </div>
      </footer>
    </div>
  )
}