import Image from 'next/image'
import Link from 'next/link'
import type { HomePageProps } from '../types'
import { getPostDate, estimateReadTime } from '@/lib/posts'
import NewsletterBanner from '@/components/NewsletterBanner'
import ProductSpotlight from '@/components/ProductSpotlight'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ModernHomePage({ brand, posts, config }: HomePageProps) {
  const hero = posts[0]
  const gridPosts = posts.slice(1, 7)
  const morePosts = posts.slice(7)

  return (
    <div className="container" style={{ paddingTop: '32px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Hero Section */}
      {hero && (
        <section style={{
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '24px',
          marginBottom: '24px',
        }}>
          {hero.featured_image && (
            <Link href={`/blog/${hero.slug}`} style={{ display: 'block', marginBottom: '16px' }}>
              <div style={{ position: 'relative', aspectRatio: '2/1', overflow: 'hidden', borderRadius: '4px' }}>
                <Image
                  src={hero.featured_image}
                  alt={hero.title}
                  fill
                  sizes="960px"
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </div>
            </Link>
          )}
          {hero.category && (
            <p style={{
              fontFamily: "'SF Mono', 'Fira Code', ui-monospace, monospace",
              fontSize: '9px',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              letterSpacing: '1px',
              margin: '0 0 8px 0',
            }}>
              {hero.category}
            </p>
          )}
          <Link href={`/blog/${hero.slug}`} style={{ textDecoration: 'none' }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text)',
              lineHeight: 1.2,
              margin: '0 0 8px 0',
            }}>
              {hero.title}
            </h2>
          </Link>
          {hero.excerpt && (
            <p style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              margin: '0 0 10px 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.5,
            }}>
              {hero.excerpt}
            </p>
          )}
          <p style={{
            fontSize: '10px',
            color: 'var(--color-text-muted)',
            margin: 0,
          }}>
            {formatDate(getPostDate(hero))} &bull; {estimateReadTime(hero)} min read
          </p>
        </section>
      )}

      {/* LATEST Section */}
      {gridPosts.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <div style={{
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2.5px',
            color: 'var(--color-text)',
            borderBottom: '2px solid var(--color-text)',
            paddingBottom: '8px',
            marginBottom: '16px',
          }}>
            LATEST
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0',
          }} className="modern-card-grid">
            {gridPosts.map((post, i) => (
              <article
                key={post.id}
                style={{
                  padding: '0 16px',
                  borderRight: i < 2 && i < gridPosts.length - 1 ? '1px solid var(--color-border)' : 'none',
                  ...(i === 0 ? { paddingLeft: 0 } : {}),
                  ...(i === 2 || i === gridPosts.length - 1 ? { paddingRight: 0, borderRight: 'none' } : {}),
                  marginBottom: i < 3 && gridPosts.length > 3 ? '20px' : '0',
                }}
              >
                {post.featured_image && (
                  <Link href={`/blog/${post.slug}`} style={{ display: 'block', marginBottom: '10px' }}>
                    <div style={{ position: 'relative', aspectRatio: '3/2', overflow: 'hidden', borderRadius: '4px' }}>
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        fill
                        sizes="320px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </Link>
                )}
                {post.category && (
                  <p style={{
                    fontFamily: "'SF Mono', 'Fira Code', ui-monospace, monospace",
                    fontSize: '8px',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent)',
                    letterSpacing: '1px',
                    margin: '0 0 6px 0',
                  }}>
                    {post.category}
                  </p>
                )}
                <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    lineHeight: 1.3,
                    margin: '0 0 6px 0',
                  }}>
                    {post.title}
                  </h3>
                </Link>
                {post.excerpt && (
                  <p style={{
                    fontSize: '10px',
                    color: 'var(--color-text-secondary)',
                    margin: '0 0 6px 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.5,
                  }}>
                    {post.excerpt}
                  </p>
                )}
                <p style={{
                  fontSize: '9px',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}>
                  {estimateReadTime(post)} min read
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Interstitial: Product Spotlight + Newsletter */}
      <div style={{ marginBottom: '24px' }}>
        <ProductSpotlight limit={1} offset={0} />
      </div>
      <div style={{ marginBottom: '32px' }}>
        <NewsletterBanner username={config.username} />
      </div>

      {/* MORE Section */}
      {morePosts.length > 0 && (
        <section style={{ marginBottom: '48px' }}>
          <div style={{
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2.5px',
            color: 'var(--color-text)',
            borderBottom: '2px solid var(--color-text)',
            paddingBottom: '8px',
            marginBottom: '16px',
          }}>
            MORE
          </div>
          <div>
            {morePosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '12px',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--color-border)',
                  textDecoration: 'none',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  flex: 1,
                  lineHeight: 1.3,
                }}>
                  {post.title}
                </span>
                {post.category && (
                  <span style={{
                    fontFamily: "'SF Mono', 'Fira Code', ui-monospace, monospace",
                    fontSize: '8px',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent)',
                    letterSpacing: '1px',
                    whiteSpace: 'nowrap',
                  }}>
                    {post.category}
                  </span>
                )}
                <span style={{
                  fontSize: '10px',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {formatDate(getPostDate(post))}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .modern-card-grid {
            grid-template-columns: 1fr !important;
          }
          .modern-card-grid article {
            border-right: none !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin-bottom: 20px !important;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--color-border);
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .modern-card-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .modern-card-grid article:nth-child(2n) {
            border-right: none !important;
            padding-right: 0 !important;
          }
          .modern-card-grid article:nth-child(2n+1) {
            padding-left: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
