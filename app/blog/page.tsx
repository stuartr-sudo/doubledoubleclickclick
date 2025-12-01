import Link from 'next/link'
import BlogCarousel from '@/components/BlogCarousel'
import BlogQuizCTA from '@/components/BlogQuizCTA'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | SEWO - Get Found Everywhere',
  description: 'Expert insights on LLM ranking, AI search optimization, and making your brand the answer AI suggests.',
  openGraph: {
    title: 'Blog | SEWO',
    description: 'Expert insights on LLM ranking, AI search optimization, and making your brand the answer AI suggests.',
    type: 'website',
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
  let homepageContent = null
  
  try {
    const supabase = await createClient()
    
    // Fetch all published blog posts
    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, slug, meta_description, featured_image, created_date, tags, category')
      .eq('status', 'published')
      .order('created_date', { ascending: false })
    posts = data

    // Fetch homepage content for quiz styling
    const { data: contentData } = await supabase
      .from('homepage_content')
      .select('quiz_cta_bg_color, quiz_description, quiz_cta_text, hero_cta_bg_color, hero_cta_text_color, quiz_cta_border_color')
      .single()
    homepageContent = contentData
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
    <main>
      {/* ScoreApp Quiz Script */}
      <Script
        src="https://static.scoreapp.com/js/integration/v1/embedding.js?v=PtHIIH"
        strategy="afterInteractive"
      />

      {/* Header */}
      <header className="header">
        <div className="container">
          <nav className="nav">
            <Link href="/" className="logo">
              SEWO
            </Link>
            <div className="nav-links">
              <Link href="/">Home</Link>
              <Link href="/blog">Blog</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Quiz CTA Section - Top */}
      <BlogQuizCTA
        quizCtaBgColor={homepageContent?.quiz_cta_bg_color || '#f8f9fa'}
        quizDescription={homepageContent?.quiz_description || 'Discover how visible your brand is to AI assistants like ChatGPT, Claude, and Gemini in just 3 minutes.'}
        quizCTAText={homepageContent?.quiz_cta_text || 'Start Quiz →'}
        heroCTABgColor={homepageContent?.hero_cta_bg_color || '#000000'}
        heroCTATextColor={homepageContent?.hero_cta_text_color || '#ffffff'}
        quizCTABorderColor={homepageContent?.quiz_cta_border_color || '#000000'}
      />

      {/* Blog Posts */}
      <section className="blog-posts">
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
                        <article key={post.id} className="blog-card">
                          <div className="blog-card-image">
                            <img 
                              src={post.featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1600&auto=format&fit=crop'} 
                              alt={post.title}
                              loading="lazy"
                              width={400}
                              height={350}
                            />
                          </div>
                          <div className="blog-card-content">
                            <div className="blog-card-top">
                              {post.category && <span className="tag-pill">{post.category}</span>}
                            </div>
                            <h2 className="blog-card-title">
                              <Link href={`/blog/${post.slug || post.id}`}>
                                {post.title}
                              </Link>
                            </h2>
                            {post.meta_description && (
                              <p className="blog-card-excerpt">{post.meta_description}</p>
                            )}
                            <div className="blog-card-meta">
                              <time dateTime={post.created_date}>
                                {new Date(post.created_date).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </time>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                    
                    {/* Quiz CTA after first 3 posts */}
                    {chunkIndex === 0 && filteredPosts.length > 3 && (
                      <BlogQuizCTA
                        quizCtaBgColor={homepageContent?.quiz_cta_bg_color || '#f8f9fa'}
                        quizDescription={homepageContent?.quiz_description || 'Discover how visible your brand is to AI assistants like ChatGPT, Claude, and Gemini in just 3 minutes.'}
                        quizCTAText={homepageContent?.quiz_cta_text || 'Start Quiz →'}
                        heroCTABgColor={homepageContent?.hero_cta_bg_color || '#000000'}
                        heroCTATextColor={homepageContent?.hero_cta_text_color || '#ffffff'}
                        quizCTABorderColor={homepageContent?.quiz_cta_border_color || '#000000'}
                      />
                    )}
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

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} SEWO. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}

