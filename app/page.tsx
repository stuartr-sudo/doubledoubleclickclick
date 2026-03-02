import Link from 'next/link'
import Image from 'next/image'
import { getBrandData, getAuthorData } from '@/lib/brand'
import { getPublishedPosts, getFeaturedPosts, getCategoriesWithCounts, getPostDate, estimateReadTime } from '@/lib/posts'
import { getFeaturedQuiz } from '@/lib/quiz'
import { getTenantConfig } from '@/lib/tenant'
import SiteHeader from '@/components/SiteHeader'
import InlineNewsletterBar from '@/components/InlineNewsletterBar'
import NewsletterForm from '@/components/NewsletterForm'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const config = getTenantConfig()
  let description = ''

  try {
    const brand = await getBrandData()
    description = brand.company?.blurb || brand.guidelines?.brand_personality || ''
  } catch {}

  return {
    title: config.siteName,
    description,
    alternates: { canonical: config.siteUrl },
    openGraph: {
      title: config.siteName,
      description,
      type: 'website',
      url: config.siteUrl,
    },
  }
}

/* Social icon SVGs */
function TwitterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function getSocialIcon(key: string) {
  const k = key.toLowerCase()
  if (k === 'twitter' || k === 'x') return <TwitterIcon />
  if (k === 'linkedin') return <LinkedInIcon />
  if (k === 'instagram') return <InstagramIcon />
  if (k === 'youtube') return <YouTubeIcon />
  return <GlobeIcon />
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function HomePage() {
  const config = getTenantConfig()

  const [brand, posts, featuredPosts, categories, author, quiz] = await Promise.all([
    getBrandData(),
    getPublishedPosts(9),
    getFeaturedPosts(4),
    getCategoriesWithCounts(),
    getAuthorData(),
    getFeaturedQuiz().catch(() => null),
  ])

  const brandName = brand.guidelines?.name || config.siteName
  const tagline = brand.company?.blurb || brand.guidelines?.brand_personality || ''
  const heroImageUrl = brand.specs?.hero_image_url || null

  return (
    <>
      <SiteHeader
        logoText={brandName}
        logoImage={brand.specs?.logo_url || undefined}
      />
      <main>
        {/* 1. Hero Banner */}
        <section className="hero-banner-section">
          {heroImageUrl && (
            <Image
              src={heroImageUrl}
              alt={`${brandName}`}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover' }}
              className="hero-banner-bg"
            />
          )}
          <div className="hero-banner-overlay" />
          <div className="container hero-banner-content">
            <h1 className="hero-banner-title">{brandName}</h1>
            {tagline && <p className="hero-banner-tagline">{tagline}</p>}
            <Link href="/blog" className="btn btn-hero-cta">
              Explore Articles
            </Link>
          </div>
        </section>

        {/* 2. Inline Newsletter Bar */}
        <InlineNewsletterBar
          username={config.username}
          heading={`Get ${brandName} insights delivered weekly`}
          subtext="No spam. Unsubscribe anytime."
          variant="accent"
        />

        {/* 3. Featured Articles */}
        {featuredPosts.length > 0 && (
          <section className="featured-section">
            <div className="container">
              <h2 className="section-title">Featured Articles</h2>
              <div className="featured-layout">
                {/* Hero featured card */}
                <Link href={`/blog/${featuredPosts[0].slug}`} className="featured-hero-card">
                  <div className="featured-hero-image">
                    <Image
                      src={featuredPosts[0].featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1600&auto=format&fit=crop'}
                      alt={featuredPosts[0].title}
                      width={700}
                      height={440}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  </div>
                  <div className="featured-hero-text">
                    {featuredPosts[0].category && (
                      <span className="featured-hero-category">{featuredPosts[0].category}</span>
                    )}
                    <h3 className="featured-hero-title">{featuredPosts[0].title}</h3>
                    <p className="featured-hero-excerpt">
                      {featuredPosts[0].meta_description || featuredPosts[0].excerpt || ''}
                    </p>
                    <div className="featured-hero-meta">
                      <time dateTime={getPostDate(featuredPosts[0])}>
                        {formatDate(getPostDate(featuredPosts[0]))}
                      </time>
                      <span aria-hidden="true">&middot;</span>
                      <span className="read-time">{estimateReadTime(featuredPosts[0])} min read</span>
                    </div>
                  </div>
                </Link>

                {/* Grid of remaining featured cards */}
                {featuredPosts.length > 1 && (
                  <div className="featured-grid">
                    {featuredPosts.slice(1, 4).map((post) => (
                      <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card">
                        <article>
                          <div className="blog-card-image">
                            <Image
                              src={post.featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1600&auto=format&fit=crop'}
                              alt={post.title}
                              width={400}
                              height={250}
                              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            />
                          </div>
                          <div className="blog-card-content">
                            <div className="blog-card-top">
                              {post.category && <span className="tag-pill">{post.category}</span>}
                              <span className="read-time read-time-sm">
                                {estimateReadTime(post)} min
                              </span>
                            </div>
                            <h3 className="blog-card-title">{post.title}</h3>
                            <p className="blog-card-excerpt">
                              {post.meta_description || post.excerpt || ''}
                            </p>
                            <div className="blog-card-meta">
                              <time dateTime={getPostDate(post)}>
                                {formatDate(getPostDate(post))}
                              </time>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 4. Explore Topics */}
        {categories.length > 0 && (
          <section className="topics-section">
            <div className="container">
              <h2 className="section-title">Explore Topics</h2>
              <p className="section-subtitle">Browse our content by category</p>
              <div className="topics-grid">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={`/blog?category=${encodeURIComponent(cat.name)}`}
                    className="topic-card"
                  >
                    <div className="topic-card-icon">
                      <span className="topic-card-letter">{cat.name.charAt(0)}</span>
                    </div>
                    <h3 className="topic-card-name">{cat.name}</h3>
                    <span className="topic-card-count">
                      {cat.count} {cat.count === 1 ? 'article' : 'articles'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. Latest Articles */}
        {posts.length > 0 && (
          <section className="latest-section">
            <div className="container">
              <h2 className="section-title">Latest Articles</h2>
              <div className="latest-grid">
                {posts.slice(0, 9).map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card">
                    <article>
                      <div className="blog-card-image">
                        <Image
                          src={post.featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1600&auto=format&fit=crop'}
                          alt={post.title}
                          loading="lazy"
                          width={400}
                          height={250}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      </div>
                      <div className="blog-card-content">
                        <div className="blog-card-top">
                          {post.category && <span className="tag-pill">{post.category}</span>}
                          <span className="read-time read-time-sm">
                            {estimateReadTime(post)} min
                          </span>
                        </div>
                        <h3 className="blog-card-title">{post.title}</h3>
                        {(post.meta_description || post.excerpt) && (
                          <p className="blog-card-excerpt">{post.meta_description || post.excerpt}</p>
                        )}
                        <div className="blog-card-meta">
                          <time dateTime={getPostDate(post)}>
                            {formatDate(getPostDate(post))}
                          </time>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
              <div className="latest-cta">
                <Link href="/blog" className="btn btn-secondary">View All Articles</Link>
              </div>
            </div>
          </section>
        )}

        {/* 6. Mid-Page Email Capture */}
        <section className="midpage-capture-section">
          <div className="container">
            <div className="midpage-capture-content">
              <h2 className="midpage-capture-title">Get Our Weekly Digest</h2>
              <p className="midpage-capture-desc">
                The best articles, tips, and insights from {brandName} &mdash; delivered every week.
              </p>
              <InlineNewsletterBar
                username={config.username}
                variant="dark"
                buttonText="Subscribe Free"
              />
              <p className="midpage-capture-trust">No spam. Unsubscribe anytime.</p>
            </div>
          </div>
        </section>

        {/* 7. Meet the Author */}
        {author && (
          <section className="author-section">
            <div className="container">
              <div className="author-grid">
                <div className="author-photo">
                  {author.image ? (
                    <Image
                      src={author.image}
                      alt={author.name}
                      width={400}
                      height={400}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  ) : (
                    <div className="author-avatar-fallback">
                      {author.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="author-info">
                  <span className="author-label">Meet the Author</span>
                  <h2 className="author-name">{author.name}</h2>
                  {brand.guidelines?.target_market && (
                    <span className="author-expertise-badge">
                      Expert in {brand.guidelines.target_market}
                    </span>
                  )}
                  {author.bio && <p className="author-bio">{author.bio}</p>}
                  {Object.keys(author.socialLinks).length > 0 && (
                    <div className="author-socials">
                      {Object.entries(author.socialLinks).map(([key, url]) => {
                        if (!url) return null
                        return (
                          <a
                            key={key}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="social-icon-link"
                            aria-label={key}
                          >
                            {getSocialIcon(key)}
                          </a>
                        )
                      })}
                    </div>
                  )}
                  <Link href="/about" className="btn btn-secondary">
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 8. Popular Articles */}
        {posts.length >= 3 && (
          <section className="popular-section">
            <div className="container">
              <h2 className="section-title">Popular Articles</h2>
              <div className="popular-list">
                {posts.slice(0, 5).map((post, index) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="popular-item">
                    <span className="popular-number">{String(index + 1).padStart(2, '0')}</span>
                    <div className="popular-text">
                      {post.category && <span className="popular-category">{post.category}</span>}
                      <h3 className="popular-title">{post.title}</h3>
                    </div>
                    {post.featured_image && (
                      <div className="popular-image">
                        <Image
                          src={post.featured_image}
                          alt=""
                          width={72}
                          height={72}
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 9. Quiz CTA */}
        {quiz && (
          <section className="quiz-cta-section">
            <div className="container">
              <div className="quiz-cta-grid">
                <div className="quiz-cta-text">
                  <span className="quiz-cta-badge">INTERACTIVE QUIZ</span>
                  <h2 className="quiz-cta-title">{quiz.title}</h2>
                  {quiz.description && (
                    <p className="quiz-cta-description">{quiz.description}</p>
                  )}
                  <div className="quiz-cta-stats">
                    <span>{quiz.question_count} questions</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>{quiz.time_limit_minutes} min</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>{quiz.passing_score}% to pass</span>
                  </div>
                </div>
                <div className="quiz-cta-action">
                  <div className="quiz-cta-card">
                    <div className="quiz-cta-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <p className="quiz-cta-card-text">Test your knowledge and see how you score!</p>
                    <Link href={`/quiz/${quiz.id}`} className="btn btn-primary quiz-cta-btn">
                      Take the Quiz
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 10. Footer Newsletter */}
        <section className="newsletter-section">
          <div className="container">
            <div className="newsletter-grid">
              <div className="newsletter-text">
                <h2 className="newsletter-heading">Stay in the Loop</h2>
                <p className="newsletter-description">
                  Get the latest articles, tips, and insights delivered straight to your inbox. No spam, ever.
                </p>
              </div>
              <div className="newsletter-form-col">
                <NewsletterForm username={config.username} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
