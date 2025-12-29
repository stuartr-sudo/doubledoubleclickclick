import Link from 'next/link'
import Image from 'next/image'
import BlogCarousel from '@/components/BlogCarousel'
import ContactForm from '@/components/ContactForm'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Blog | SEWO - Get Found Everywhere',
  description: 'Expert insights on LLM ranking, AI search optimization, and making your brand the answer AI suggests.',
  alternates: {
    canonical: 'https://www.sewo.io/blog',
  },
  openGraph: {
    title: 'Blog | SEWO',
    description: 'Expert insights on LLM ranking, AI search optimization, and making your brand the answer AI suggests.',
    type: 'website',
    url: 'https://www.sewo.io/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | SEWO',
    description: 'Expert insights on LLM ranking and AI search optimization.',
  },
}

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BlogPage({ searchParams }: { searchParams?: { category?: string } }) {
  let posts = null
  
  try {
    const supabase = await createClient()
    
    // Fetch ALL published blog posts (no limit - shows all posts)
    const { data } = await supabase
      .from('site_posts')
      .select('id, title, slug, meta_description, featured_image, created_date, published_date, tags, category')
      .eq('status', 'published')
    
    // Sort by published_date descending in JS to be safe
    posts = (data || []).sort((a, b) => {
      const dateA = new Date(a.published_date || a.created_date).getTime()
      const dateB = new Date(b.published_date || b.created_date).getTime()
      return dateB - dateA
    })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
  }

  // Use only real posts from database
  let postsData = posts || []
  const selectedCategory = typeof searchParams?.category === 'string' ? searchParams.category : 'All'
  
  // Filter by category if selected
  const filteredPosts = selectedCategory === 'All' 
    ? postsData 
    : postsData.filter((p) => String(p.category).toLowerCase() === selectedCategory.toLowerCase())

  // Get unique categories for navigation
  const uniqueCategories = Array.from(new Set(postsData.map((p) => p.category))).filter(Boolean)

  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Title */}
      <section className="blog-page-header" style={{ padding: 'var(--spacing-md) 0 var(--spacing-xl) 0', marginBottom: '0', background: 'var(--color-bg)' }}>
        <div className="container">
          <h1 className="blog-page-title" style={{ marginBottom: 'var(--spacing-lg)' }}>Answers to Your Questions</h1>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="blog-posts" style={{ paddingTop: '0' }}>
        <div className="container">
          {filteredPosts && filteredPosts.length > 0 ? (
            <>
              {/* Split posts into chunks of 3 for the layout */}
              {Array.from({ length: Math.ceil(filteredPosts.length / 3) }).map((_, chunkIndex) => {
                const startIndex = chunkIndex * 3
                const endIndex = startIndex + 3
                const chunk = filteredPosts.slice(startIndex, endIndex)
                
                return (
                  <div key={chunkIndex}>
                    {/* 3-column grid */}
                    <div className="blog-grid blog-grid-cards">
                      {chunk.map((post) => (
                        <Link key={post.id} href={`/blog/${post.slug || post.id}`} className="blog-card">
                          <article>
                            <div className="blog-card-image">
                              <Image 
                                src={post.featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1600&auto=format&fit=crop'} 
                                alt={post.title}
                                loading="lazy"
                                width={400}
                                height={350}
                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                              />
                            </div>
                            <div className="blog-card-content">
                              <div className="blog-card-top">
                                {post.category && <span className="tag-pill">{post.category}</span>}
                              </div>
                              <h2 className="blog-card-title">
                                {post.title}
                              </h2>
                              {post.meta_description && (
                                <p className="blog-card-excerpt">{post.meta_description}</p>
                              )}
                              <div className="blog-card-meta">
                                <time dateTime={post.published_date || post.created_date}>
                                  {new Date(post.published_date || post.created_date).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </time>
                              </div>
                            </div>
                          </article>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="empty-state">
              <p>No blog posts yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Blog Carousel */}
      <BlogCarousel />

      {/* Contact Form */}
      <ContactForm />
    </main>
    </>
  )
}

