import Link from 'next/link'
import Image from 'next/image'
import { getPublishedPosts, getCategoriesWithCounts, getPostDate, estimateReadTime } from '@/lib/posts'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import SiteHeader from '@/components/SiteHeader'
import InlineNewsletterBar from '@/components/InlineNewsletterBar'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const config = getTenantConfig()
  return {
    title: `Blog | ${config.siteName}`,
    description: `Latest articles and updates from ${config.siteName}.`,
    openGraph: {
      title: `Blog | ${config.siteName}`,
      description: `Latest articles and updates from ${config.siteName}.`,
      type: 'website',
    },
  }
}

export default async function BlogPage({ searchParams }: { searchParams?: { category?: string } }) {
  const config = getTenantConfig()
  const [brand, posts, categories] = await Promise.all([
    getBrandData(),
    getPublishedPosts(),
    getCategoriesWithCounts(),
  ])
  const brandName = brand.guidelines?.name || config.siteName

  const selectedCategory = typeof searchParams?.category === 'string' ? searchParams.category : 'All'

  const filteredPosts = selectedCategory === 'All'
    ? posts
    : posts.filter((p) => String(p.category).toLowerCase() === selectedCategory.toLowerCase())

  return (
    <>
      <SiteHeader logoText={brandName} logoImage={brand.specs?.logo_url || undefined} />
      <main className="blog-page-main">
        <section className="blog-page-header">
          <div className="container">
            <h1 className="blog-page-title">Blog</h1>
          </div>
        </section>

        {/* Category Filter Bar */}
        {categories.length > 0 && (
          <section className="blog-filter-bar">
            <div className="container">
              <div className="category-pills">
                <Link
                  href="/blog"
                  className={`category-pill ${selectedCategory === 'All' ? 'category-pill--active' : ''}`}
                >
                  All
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={`/blog?category=${encodeURIComponent(cat.name)}`}
                    className={`category-pill ${selectedCategory === cat.name ? 'category-pill--active' : ''}`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="blog-posts">
          <div className="container">
            {filteredPosts.length > 0 ? (
              <>
                {Array.from({ length: Math.ceil(filteredPosts.length / 6) }).map((_, chunkIndex) => {
                  const chunk = filteredPosts.slice(chunkIndex * 6, chunkIndex * 6 + 6)
                  const isLastChunk = chunkIndex >= Math.ceil(filteredPosts.length / 6) - 1
                  return (
                    <div key={chunkIndex}>
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
                                  <span className="read-time read-time-sm">
                                    {estimateReadTime(post)} min
                                  </span>
                                </div>
                                <h2 className="blog-card-title">{post.title}</h2>
                                {(post.meta_description || post.excerpt) && (
                                  <p className="blog-card-excerpt">{post.meta_description || post.excerpt}</p>
                                )}
                                <div className="blog-card-meta">
                                  <time dateTime={getPostDate(post)}>
                                    {new Date(getPostDate(post)).toLocaleDateString('en-US', {
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </time>
                                </div>
                              </div>
                            </article>
                          </Link>
                        ))}
                      </div>
                      {/* Inline newsletter between post chunks */}
                      {!isLastChunk && (
                        <div className="blog-newsletter-break">
                          <InlineNewsletterBar
                            username={config.username}
                            heading="Never miss an article"
                            subtext="Get the latest posts delivered to your inbox."
                            variant="light"
                          />
                        </div>
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
      </main>
    </>
  )
}
