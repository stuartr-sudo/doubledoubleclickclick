import Image from 'next/image'
import Link from 'next/link'
import type { HomePageProps } from '../types'
import { getPostDate, estimateReadTime } from '@/lib/posts'
import NewsletterBanner from '@/components/NewsletterBanner'
import ProductSpotlight from '@/components/ProductSpotlight'

export default function BoutiqueHomePage({ brand, posts, config }: HomePageProps) {
  const hero = posts[0]
  const gridPosts = posts.slice(1)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
      {/* Hero Section */}
      {hero && (
        <Link href={`/blog/${hero.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <article style={{ paddingBottom: 32, marginBottom: 32, borderBottom: '1px solid var(--color-border, #e5e5e5)' }}>
            {hero.featured_image && (
              <div style={{
                position: 'relative',
                aspectRatio: '16/9',
                borderRadius: 'var(--border-radius, 12px)',
                overflow: 'hidden',
                marginBottom: 16,
              }}>
                <Image
                  src={hero.featured_image}
                  alt={hero.title}
                  fill
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </div>
            )}
            {hero.category && (
              <span style={{
                display: 'inline-block',
                background: 'var(--color-accent, #c7a17a)',
                color: '#fff',
                fontSize: 8,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '4px 10px',
                borderRadius: 999,
                marginBottom: 10,
              }}>
                {hero.category}
              </span>
            )}
            <h2 style={{
              fontFamily: 'var(--font-heading, Georgia, serif)',
              fontSize: 24,
              fontWeight: 700,
              margin: '0 0 8px',
              lineHeight: 1.3,
              color: 'var(--color-text, #1a1a1a)',
            }}>
              {hero.title}
            </h2>
            {hero.excerpt && (
              <p style={{
                fontSize: 14,
                color: 'var(--color-text-secondary, #666)',
                margin: '0 0 10px',
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {hero.excerpt}
              </p>
            )}
            <p style={{
              fontSize: 10,
              color: 'var(--color-text-muted, #999)',
              margin: 0,
            }}>
              {hero.author && <span>{hero.author}</span>}
              {hero.author && ' \u00B7 '}
              <time dateTime={getPostDate(hero)}>
                {new Date(getPostDate(hero)).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </time>
            </p>
          </article>
        </Link>
      )}

      {/* Card Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 24,
      }}>
        {gridPosts.map((post, i) => {
          const items: React.ReactNode[] = []

          {/* After card 3 (index 2), insert NewsletterBanner */}
          if (i === 3) {
            items.push(
              <div key="newsletter-mid" style={{ gridColumn: '1 / -1' }}>
                <NewsletterBanner username={config.username} />
              </div>
            )
          }

          {/* After card 6 (index 5), insert ProductSpotlight */}
          if (i === 6) {
            items.push(
              <div key="product-mid" style={{ gridColumn: '1 / -1' }}>
                <ProductSpotlight limit={1} offset={0} />
              </div>
            )
          }

          items.push(
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <article style={{
                background: 'var(--color-bg, #fff)',
                borderRadius: 'var(--border-radius, 12px)',
                boxShadow: 'var(--card-shadow, 0 2px 12px rgba(0,0,0,0.08))',
                overflow: 'hidden',
              }}>
                {post.featured_image && (
                  <div style={{
                    position: 'relative',
                    aspectRatio: '4/3',
                    overflow: 'hidden',
                  }}>
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ padding: 'var(--card-padding, 16px)' }}>
                  {post.category && (
                    <span style={{
                      display: 'inline-block',
                      background: 'var(--color-bg-warm, #faf5f0)',
                      color: 'var(--color-accent, #c7a17a)',
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '3px 8px',
                      borderRadius: 999,
                      marginBottom: 8,
                    }}>
                      {post.category}
                    </span>
                  )}
                  <h3 style={{
                    fontFamily: 'var(--font-heading, Georgia, serif)',
                    fontSize: 16,
                    fontWeight: 600,
                    margin: '0 0 6px',
                    lineHeight: 1.35,
                    color: 'var(--color-text, #1a1a1a)',
                  }}>
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p style={{
                      fontSize: 12,
                      color: 'var(--color-text-secondary, #666)',
                      margin: '0 0 10px',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {post.excerpt}
                    </p>
                  )}
                  <p style={{
                    fontSize: 10,
                    color: 'var(--color-text-muted, #999)',
                    margin: 0,
                  }}>
                    {post.author && <span>{post.author}</span>}
                    {post.author && ' \u00B7 '}
                    {estimateReadTime(post)} min read
                  </p>
                </div>
              </article>
            </Link>
          )

          return items
        })}
      </div>

      {/* Bottom CTA Section */}
      <div style={{
        background: 'var(--color-bg-warm, #faf5f0)',
        borderRadius: 'var(--border-radius, 12px)',
        padding: '48px 24px',
        marginTop: 48,
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-heading, Georgia, serif)',
          fontSize: 22,
          fontWeight: 700,
          margin: '0 0 8px',
          color: 'var(--color-text, #1a1a1a)',
        }}>
          Stay in the loop
        </h2>
        <p style={{
          fontSize: 14,
          color: 'var(--color-text-secondary, #666)',
          margin: '0 0 24px',
          maxWidth: 480,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6,
        }}>
          Get the latest stories, tips, and inspiration delivered straight to your inbox.
        </p>
        <NewsletterBanner username={config.username} />
      </div>
    </div>
  )
}
