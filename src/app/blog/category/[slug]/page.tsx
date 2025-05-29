// src/app/blog/category/[slug]/page.tsx - CATEGORY ARCHIVE PAGE
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSite } from '@/lib/site-context'
import Link from 'next/link'
import type { Metadata } from 'next'

interface CategoryPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image_url?: string
  published_at: string
  seo_keywords: string[]
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  post_count: number
}

interface CategoryArchiveProps {
  params: { slug: string }
}

// ENTERPRISE SEO: Generate metadata for category pages
export async function generateMetadata({ params }: CategoryArchiveProps): Promise<Metadata> {
  const siteConfig = getCurrentSite()
  if (!siteConfig) return { title: 'Category Not Found' }

  const { createClient } = require('@/lib/supabase/server')
  const supabase = createClient()

  // Get category info
  const { data: categories } = await supabase
    .rpc('get_site_categories', {
      p_site_id: siteConfig.id
    })

  const category = categories?.find((cat: Category) => cat.slug === params.slug)

  if (!category) {
    return { title: 'Category Not Found' }
  }

  const title = `${category.name} Posts`
  const description = category.description || `Browse all posts in the ${category.name} category on ${siteConfig.name}`
  const canonicalUrl = `http://${siteConfig.domain}/blog/category/${category.slug}`

  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: 'website',
    },

    twitter: {
      card: 'summary',
      title,
      description,
    },

    alternates: {
      canonical: canonicalUrl,
    },

    other: {
      'article:section': category.name,
    },

    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function CategoryArchivePage({ params }: CategoryArchiveProps) {
  const siteConfig = getCurrentSite()
  
  if (!siteConfig) {
    notFound()
  }

  const slug = params.slug
  const { createClient } = require('@/lib/supabase/server')
  const supabase = createClient()

  // Get category info
  const { data: categories } = await supabase
    .rpc('get_site_categories', {
      p_site_id: siteConfig.id
    })

  const category = categories?.find((cat: Category) => cat.slug === slug)

  if (!category) {
    console.log(`❌ Category not found: ${slug} for site ${siteConfig.domain}`)
    notFound()
  }

  // Get posts in this category
  const { data: posts, error } = await supabase
    .rpc('get_posts_by_category', {
      p_site_id: siteConfig.id,
      p_category_slug: slug,
      p_limit: 50
    })

  console.log(`✅ Category archive loaded: ${category.name} with ${posts?.length || 0} posts`)

  // Get all categories for sidebar
  const { data: allCategories } = await supabase
    .rpc('get_site_categories', {
      p_site_id: siteConfig.id
    })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <nav className="text-sm text-gray-600 mb-6">
            <div className="flex items-center space-x-2">
              <Link href="/" className="hover:text-gray-900">Home</Link>
              <span>›</span>
              <Link href="/blog" className="hover:text-gray-900">Blog</Link>
              <span>›</span>
              <span className="text-gray-900 font-medium">{category.name}</span>
            </div>
          </nav>
          
          <div className="max-w-4xl mx-auto">
            {/* Category Info */}
            <div className="flex items-center space-x-4 mb-6">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: category.color }}
              >
                {category.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {category.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  {category.post_count} {category.post_count === 1 ? 'post' : 'posts'}
                </p>
              </div>
            </div>
            
            {/* Category Description */}
            {category.description && (
              <p className="text-lg text-gray-600 leading-relaxed border-l-4 pl-6 italic"
                 style={{ borderColor: category.color }}>
                {category.description}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Posts Content */}
            <div className="lg:col-span-3">
              {posts && posts.length > 0 ? (
                <div className="space-y-8">
                  {posts.map((post: CategoryPost) => (
                    <article 
                      key={post.id}
                      className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="md:flex">
                        {/* Featured Image */}
                        {post.featured_image_url && (
                          <div className="md:w-1/3">
                            <img
                              src={post.featured_image_url}
                              alt={post.title}
                              className="w-full h-48 md:h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Post Content */}
                        <div className={`p-6 ${post.featured_image_url ? 'md:w-2/3' : 'w-full'}`}>
                          {/* Post Meta */}
                          <div className="flex items-center text-sm text-gray-500 mb-3">
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
                                <div className="flex items-center space-x-1">
                                  {post.seo_keywords.slice(0, 2).map((tag, index) => (
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
                          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 hover:text-blue-600 leading-tight">
                            <Link href={`/blog/${post.slug}`}>
                              {post.title}
                            </Link>
                          </h2>

                          {/* Post Excerpt */}
                          {post.excerpt && (
                            <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">
                              {post.excerpt}
                            </p>
                          )}

                          {/* Read More */}
                          <Link
                            href={`/blog/${post.slug}`}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Read more
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                // Empty State
                <div className="text-center py-16">
                  <div className="text-gray-500">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.name.substring(0, 2).toUpperCase()}
                    </div>
                    <h3 className="text-xl font-medium mb-2">No posts in {category.name}</h3>
                    <p className="text-gray-600 mb-6">
                      Check back soon for new posts in this category.
                    </p>
                    <Link
                      href="/blog"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: category.color }}
                    >
                      Browse All Posts
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Categories List */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Browse Categories</h3>
                  <div className="space-y-3">
                    {allCategories?.map((cat: Category) => (
                      <Link
                        key={cat.id}
                        href={`/blog/category/${cat.slug}`}
                        className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                          cat.slug === category.slug 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-medium flex-1">{cat.name}</span>
                        <span className="text-xs text-gray-500">({cat.post_count})</span>
                      </Link>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Link
                      href="/blog"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All Posts →
                    </Link>
                  </div>
                </div>

                {/* Category Stats */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Category Info</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Posts:</span>
                      <span className="font-medium">{category.post_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    {category.description && (
                      <div className="pt-3 border-t">
                        <p className="text-gray-600 text-xs leading-relaxed">
                          {category.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back to Blog */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border p-6 text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">Explore More</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Discover more posts and categories on our blog.
                  </p>
                  <Link
                    href="/blog"
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Browse All Posts
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `${category.name} Posts`,
            "description": category.description || `Posts in the ${category.name} category`,
            "url": `http://${siteConfig.domain}/blog/category/${category.slug}`,
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": posts?.length || 0,
              "itemListElement": posts?.map((post: CategoryPost, index: number) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "BlogPosting",
                  "headline": post.title,
                  "url": `http://${siteConfig.domain}/blog/${post.slug}`,
                  "datePublished": post.published_at
                }
              })) || []
            }
          })
        }}
      />
    </div>
  )
}