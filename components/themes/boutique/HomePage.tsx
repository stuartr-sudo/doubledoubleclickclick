import Image from 'next/image'
import Link from 'next/link'
import type { HomePageProps } from '../types'
import { getPostDate, estimateReadTime } from '@/lib/posts'
import NewsletterBanner from '@/components/NewsletterBanner'
import ProductSpotlight from '@/components/ProductSpotlight'

export default function BoutiqueHomePage({ brand, posts, config }: HomePageProps) {
  const hero = posts[0]
  const gridPosts = posts.slice(1)
  const heroImageUrl = brand.specs?.hero_image_url
  const tagline = brand.guidelines?.tagline
  const blurb = brand.company?.blurb
  const brandName = brand.guidelines?.name || config.siteName

  return (
    <>
      {/* Brand Welcome — image spans the full viewport width, no side
          gutters, with a CAPPED height so it doesn't dominate the page.
          The image cover-crops to fit the box. Lives outside the
          maxWidth:1200 container so it can bleed to viewport edges. */}
      {heroImageUrl && (
        <section>
          <div style={{
            position: 'relative',
            width: '100%',
            // Capped height: 297px on small mobile, scales up to a max
            // of 567px on large screens (35% taller than the original
            // 220/32vw/420 spec, per request).
            height: 'clamp(297px, 43vw, 567px)',
            overflow: 'hidden',
          }}>
            <Image
              src={heroImageUrl}
              alt={brandName}
              fill
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              priority
            />
          </div>
          {(tagline || blurb) && (
            <div style={{
              textAlign: 'center',
              maxWidth: 720,
              margin: '32px auto 0',
              padding: '0 16px',
            }}>
              {tagline && (
                <h1 style={{
                  fontFamily: 'var(--font-heading, Georgia, serif)',
                  fontSize: 'clamp(24px, 5vw, 36px)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  margin: '0 0 16px',
                  lineHeight: 1.25,
                  color: 'var(--color-text, #1a1a1a)',
                }}>
                  {tagline}
                </h1>
              )}
              {blurb && (
                <p style={{
                  fontSize: 'clamp(15px, 2.2vw, 17px)',
                  color: 'var(--color-text-secondary, #666)',
                  margin: 0,
                  lineHeight: 1.7,
                }}>
                  {blurb}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>

      {/* Empty state copy when no posts exist yet */}
      {posts.length === 0 && (
        <section style={{
          textAlign: 'center',
          padding: '32px 16px 48px',
          borderTop: '1px solid var(--color-border, #e5e5e5)',
          marginTop: heroImageUrl ? 0 : 32,
        }}>
          <p style={{
            fontFamily: 'var(--font-heading, Georgia, serif)',
            fontStyle: 'italic',
            fontSize: 18,
            color: 'var(--color-text-secondary, #666)',
            margin: 0,
            lineHeight: 1.6,
          }}>
            Stories from inside the rhythm are on their way.
          </p>
          <p style={{
            fontSize: 14,
            color: 'var(--color-text-muted, #999)',
            margin: '8px 0 0',
          }}>
            Subscribe below — the first letter lands soon.
          </p>
        </section>
      )}

      {/* Hero Section */}
      {hero && (
        <Link href={`/blog/${hero.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <article style={{ paddingBottom: 32, marginBottom: 32, borderBottom: '1px solid var(--color-border, #e5e5e5)', textAlign: 'center' }}>
            {hero.featured_image && (
              <div style={{
                position: 'relative',
                aspectRatio: '5/2',
                width: '100%',
                maxWidth: 900,
                margin: '0 auto 16px',
                borderRadius: 'var(--border-radius, 16px)',
                overflow: 'hidden',
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
                    borderRadius: 'var(--border-radius, 16px) var(--border-radius, 16px) 0 0',
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
          fontSize: 24,
          fontWeight: 400,
          fontStyle: 'italic',
          margin: '0 0 8px',
          color: 'var(--color-text, #1a1a1a)',
        }}>
          {tagline ? 'Join the village' : 'Stay in the loop'}
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
          {tagline
            ? `One letter, most weeks, from ${brandName}.`
            : 'Get the latest stories, tips, and inspiration delivered straight to your inbox.'}
        </p>
        <NewsletterBanner username={config.username} />
      </div>
      </div>
    </>
  )
}
