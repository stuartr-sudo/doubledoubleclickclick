import Link from 'next/link'
import Image from 'next/image'
import SiteHeader from '@/components/SiteHeader'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AboutPage() {
  const supabase = await createClient()

  // Fetch Stuart Asta's author data
  const { data: author } = await supabase
    .from('authors')
    .select('slug, name, bio, linkedin_url, avatar_url')
    .eq('slug', 'stuart-asta')
    .single()

  // Fetch posts by Stuart Asta
  const { data: posts } = await supabase
    .from('site_posts')
    .select('id, slug, title, meta_description, featured_image, published_date, created_date')
    .eq('status', 'published')
    .eq('author', author?.name || 'Stuart Asta')
    .order('published_date', { ascending: false })
    .limit(6)
  return (
    <>
      <SiteHeader />
      <main>
        <section className="about-hero">
          <div className="container">
            <h1 className="about-title">About Us</h1>
            <p className="about-subtitle">
              Evidence-based guidance, practical insights, and clear recommendations.
            </p>
          </div>
        </section>

        <section className="about-content">
          <div className="container">
            <div className="about-text-grid">
              <div className="about-text-main">
                <h2>Our Mission</h2>
                <p>
                  We help readers make informed decisions with practical, trustworthy information.
                </p>
                <p>
                  Our focus is clear guidance, transparent recommendations, and useful content that supports long-term outcomes.
                </p>
              </div>
              <div className="about-stats">
                <div className="stat-item">
                  <span className="stat-number">Evidence</span>
                  <span className="stat-label">First Approach</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">Practical</span>
                  <span className="stat-label">Actionable Insights</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Founder Section */}
        {author && (
          <section className="founder-section">
            <div className="container">
              <h2 className="section-title">Meet the Founder</h2>
              
              <div className="founder-hero">
                <div className="founder-avatar">
                  {author.avatar_url ? (
                    <Image
                      src={author.avatar_url}
                      alt={author.name}
                      width={150}
                      height={150}
                      style={{ objectFit: 'cover', borderRadius: '999px' }}
                    />
                  ) : (
                    <div className="founder-avatar-fallback">{author.name?.slice(0, 1)?.toUpperCase()}</div>
                  )}
                </div>
                <div className="founder-info">
                  <h3 className="founder-name">{author.name}</h3>
                  <p className="founder-role">Founder & CEO</p>
                  {author.bio && <p className="founder-bio">{author.bio}</p>}
                  <div className="founder-links">
                    {author.linkedin_url && (
                      <a className="btn btn-secondary" href={author.linkedin_url} target="_blank" rel="noreferrer">
                        LinkedIn
                      </a>
                    )}
                    <Link className="btn btn-secondary" href="/blog">View all posts</Link>
                  </div>
                </div>
              </div>

              {posts && posts.length > 0 && (
                <div className="founder-posts">
                  <h3 className="founder-posts-title">Recent Posts by {author.name}</h3>
                  <div className="blog-grid">
                    {posts.map((post: any) => (
                      <Link key={post.id} href={`/blog/${post.slug || post.id}`} className="blog-card">
                        {post.featured_image && (
                          <div className="blog-card-image">
                            <Image
                              src={post.featured_image}
                              alt={post.title}
                              width={600}
                              height={340}
                              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            />
                          </div>
                        )}
                        <div className="blog-card-content">
                          <div className="blog-card-meta">
                            <span className="blog-card-date">
                              {new Date(post.published_date || post.created_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <h4 className="blog-card-title">{post.title}</h4>
                          {post.meta_description && <p className="blog-card-excerpt">{post.meta_description}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
