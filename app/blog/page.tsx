import Link from 'next/link'
import SubscribeHero from '@/components/SubscribeHero'
import BlogCarousel from '@/components/BlogCarousel'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | DoubleClicker',
  description: 'Read our latest blog posts and insights',
}

export default async function BlogPage({ searchParams }: { searchParams?: { category?: string } }) {
  let posts = null
  
  try {
    const supabase = await createClient()
    // Fetch all published blog posts
    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, slug, meta_description, featured_image, created_date, tags, category')
      .eq('status', 'published')
      .order('created_date', { ascending: false })
    posts = data
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    // Will fall back to demo posts
  }

  // Fallback demo content (used when database is empty)
  const demoPosts = [
    {
      id: 'demo-1',
      title: 'How to build a startup from scratch',
      slug: 'how-to-build-a-startup-from-scratch',
      meta_description:
        'A practical walkthrough on validating ideas, building the first version, and reaching product‑market fit.',
      featured_image:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1600&auto=format&fit=crop',
      created_date: new Date().toISOString(),
      category: 'Tech',
    },
    {
      id: 'demo-2',
      title: 'Mastering the art of pitching your business idea',
      slug: 'mastering-the-art-of-pitching-your-business-idea',
      meta_description:
        'Structure, narrative, and visuals that make investors and customers say yes.',
      featured_image:
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop',
      created_date: new Date(Date.now() - 86400000 * 3).toISOString(),
      category: 'Entrepreneurship',
    },
    {
      id: 'demo-3',
      title: 'Turning your passion into a full‑time career',
      slug: 'turning-your-passion-into-a-full-time-career',
      meta_description:
        'Playbooks for creators to monetize, build audience, and scale sustainably.',
      featured_image:
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1600&auto=format&fit=crop',
      created_date: new Date(Date.now() - 86400000 * 7).toISOString(),
      category: 'Creator',
    },
    {
      id: 'demo-4',
      title: 'The latest tech trends every creator should know',
      slug: 'the-latest-tech-trends-every-creator-should-know',
      meta_description:
        'From AI tools to new platforms—what matters this year and how to adapt fast.',
      featured_image:
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1600&auto=format&fit=crop',
      created_date: new Date(Date.now() - 86400000 * 10).toISOString(),
      category: 'Tech',
    },
    {
      id: 'demo-5',
      title: 'Balancing creativity with business as a creator',
      slug: 'balancing-creativity-with-business-as-a-creator',
      meta_description:
        'Systems and habits that keep the art strong while the business grows.',
      featured_image:
        'https://images.unsplash.com/photo-1524255684952-d7185b509571?q=80&w=1600&auto=format&fit=crop',
      created_date: new Date(Date.now() - 86400000 * 14).toISOString(),
      category: 'Creator',
    },
    {
      id: 'demo-6',
      title: 'The power of networking for entrepreneurs',
      slug: 'the-power-of-networking-for-entrepreneurs',
      meta_description:
        'How to build a network that compounds opportunities for years.',
      featured_image:
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop',
      created_date: new Date(Date.now() - 86400000 * 21).toISOString(),
      category: 'Entrepreneurship',
    },
  ]

  let postsData = posts && posts.length > 0 ? posts : demoPosts
  const selectedCategory = typeof searchParams?.category === 'string' ? searchParams.category : 'All'
  
  // Filter by category if selected
  const filteredPosts = selectedCategory === 'All' 
    ? postsData 
    : postsData.filter((p) => String(p.category).toLowerCase() === selectedCategory.toLowerCase())

  // Get unique categories for navigation
  const uniqueCategories = Array.from(new Set(postsData.map((p) => p.category))).filter(Boolean)

  return (
    <main>
      {/* Header */}
      <header className="header">
        <div className="container">
          <nav className="nav">
            <Link href="/" className="logo">
              DoubleClicker
            </Link>
            <div className="nav-links">
              <Link href="/">Home</Link>
              <Link href="/blog">Blog</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Blog Header */}
      <section className="blog-header">
        <div className="container">
          <h1 className="page-title">Blog</h1>
          <p className="page-description">
            Discover insights, tips, and updates from DoubleClicker
          </p>
          <nav className="blog-category-nav">
            <Link href="/blog" className={selectedCategory === 'All' ? 'is-active' : ''}>
              All
            </Link>
            {uniqueCategories.map((category) => (
              <Link
                href={`/blog?category=${encodeURIComponent(category as string)}`}
                key={category}
                className={selectedCategory === category ? 'is-active' : ''}
              >
                {category}
              </Link>
            ))}
            <Link href="/subscribe" className="btn-subscribe">
              Subscribe
            </Link>
          </nav>
        </div>
      </section>

      {/* Featured Article */}
      <section className="featured-article">
        <div className="container">
          {filteredPosts && filteredPosts.length > 0 && (
            <article className="featured-card">
              <div className="featured-content">
                <div className="featured-meta">
                  {filteredPosts[0].category && <span className="tag-pill">{filteredPosts[0].category}</span>}
                  <time dateTime={filteredPosts[0].created_date}>
                    {new Date(filteredPosts[0].created_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                <h2 className="featured-title">
                  <Link href={`/blog/${filteredPosts[0].slug || filteredPosts[0].id}`}>
                    {filteredPosts[0].title}
                  </Link>
                </h2>
                {filteredPosts[0].meta_description && (
                  <p className="featured-excerpt">{filteredPosts[0].meta_description}</p>
                )}
              </div>
              <div className="featured-image">
                {filteredPosts[0].featured_image && (
                  <img
                    src={filteredPosts[0].featured_image}
                    alt={filteredPosts[0].title}
                    loading="eager"
                    width={800}
                    height={500}
                  />
                )}
              </div>
            </article>
          )}
        </div>
      </section>

      {/* Blog Posts */}
      <section className="blog-posts">
        <div className="container">
          {filteredPosts && filteredPosts.length > 0 ? (
            <div className="blog-grid blog-grid-cards">
              {filteredPosts.slice(1).map((post) => (
                <article key={post.id} className="blog-card">
                  {post.featured_image && (
                    <div className="blog-card-image">
                      <img 
                        src={post.featured_image} 
                        alt={post.title}
                        loading="lazy"
                        width={400}
                        height={250}
                      />
                    </div>
                  )}
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
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No blog posts yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* More topics that may interest you */}
      <section className="more-topics">
        <div className="container">
          <div className="more-topics-header">
            <h2 className="section-label">More topics that may interest you</h2>
            <Link href="/blog" className="view-all-link">View all →</Link>
          </div>
          <div className="topics-grid">
            {(postsData || [])
              .filter((p) => p.category)
              .reduce((acc: any[], p) => {
                // Keep only the first post we encounter for each category
                if (!acc.find((x) => x.category === p.category)) acc.push(p)
                return acc
              }, [])
              .slice(0, 3)
              .map((p) => (
                <Link
                  href={`/blog?category=${encodeURIComponent(p.category as string)}`}
                  key={p.id}
                  className="topic-card"
                >
                  <div className="topic-card-image">
                    {p.featured_image ? (
                      <img src={p.featured_image} alt={p.category || 'Topic'} loading="lazy" width={400} height={250} />
                    ) : (
                      <div className="topic-card-placeholder" />
                    )}
                  </div>
                  <div className="topic-card-content">
                    <span className="tag-pill">{p.category}</span>
                    <h3 className="topic-card-title">{p.title}</h3>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* Subscribe Hero */}
      <SubscribeHero source="blog" />

      {/* Blog Carousel */}
      <BlogCarousel />

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} DoubleClicker. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}

