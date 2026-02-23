import Link from 'next/link'
import Image from 'next/image'
import { getPublishedPosts } from '@/lib/posts'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import SiteHeader from '@/components/SiteHeader'
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
  const brand = await getBrandData()
  const brandName = brand.guidelines?.name || config.siteName

  const posts = await getPublishedPosts()
  const selectedCategory = typeof searchParams?.category === 'string' ? searchParams.category : 'All'

  const filteredPosts = selectedCategory === 'All'
    ? posts
    : posts.filter((p) => String(p.category).toLowerCase() === selectedCategory.toLowerCase())

  return (
    <>
      <SiteHeader logoText={brandName} logoImage={brand.specs?.logo_url || undefined} />
      <main style={{ paddingTop: '100px' }}>
        <section className="blog-page-header" style={{ padding: 'var(--spacing-sm) 0', marginBottom: '0', background: 'var(--color-bg)' }}>
          <div className="container">
            <h1 className="blog-page-title" style={{ marginBottom: 'var(--spacing-sm)', textAlign: 'center' }}>Blog</h1>
          </div>
        </section>

        <section className="blog-posts" style={{ paddingTop: 'var(--spacing-md)' }}>
          <div className="container">
            {filteredPosts.length > 0 ? (
              <>
                {Array.from({ length: Math.ceil(filteredPosts.length / 3) }).map((_, chunkIndex) => {
                  const chunk = filteredPosts.slice(chunkIndex * 3, chunkIndex * 3 + 3)
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
                                </div>
                                <h2 className="blog-card-title">{post.title}</h2>
                                {(post.meta_description || post.excerpt) && (
                                  <p className="blog-card-excerpt">{post.meta_description || post.excerpt}</p>
                                )}
                                <div className="blog-card-meta">
                                  <time dateTime={post.published_date || post.created_date}>
                                    {new Date(post.published_date || post.created_date || '').toLocaleDateString('en-US', {
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
