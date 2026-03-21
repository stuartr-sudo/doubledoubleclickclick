import Image from 'next/image'
import Link from 'next/link'
import type { BlogPost } from '@/lib/posts'
import { getPostDate, estimateReadTime } from '@/lib/posts'

interface HomeHeroProps {
  posts: BlogPost[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function HomeHero({ posts }: HomeHeroProps) {
  if (posts.length === 0) return null

  const lead = posts[0]
  const sidebar = posts.slice(1, 4)

  return (
    <>
      <section
        style={{
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '24px',
          marginBottom: '24px',
        }}
      >
        <div
          className="home-hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.3fr 1fr',
            gap: '0',
          }}
        >
          {/* Lead Story */}
          <div
            style={{
              borderRight: '1px solid var(--color-border)',
              paddingRight: '24px',
            }}
          >
            <Link
              href={`/blog/${lead.slug}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              {lead.featured_image && (
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '3 / 2',
                    overflow: 'hidden',
                    marginBottom: '12px',
                  }}
                >
                  <Image
                    src={lead.featured_image}
                    alt={lead.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 560px"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
              )}

              {lead.category && (
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'var(--color-accent)',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  {lead.category}
                </span>
              )}

              <h2
                style={{
                  fontSize: '26px',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  lineHeight: 1.25,
                  margin: '0 0 8px',
                  color: 'var(--color-text)',
                }}
              >
                {lead.title}
              </h2>

              {(lead.meta_description || lead.excerpt) && (
                <p
                  style={{
                    fontSize: '13px',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.6,
                    color: 'var(--color-text-secondary)',
                    margin: '0 0 8px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {lead.meta_description || lead.excerpt}
                </p>
              )}

              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                {lead.author && (
                  <span style={{ fontWeight: 600, color: 'var(--color-text-body)' }}>
                    {lead.author}
                  </span>
                )}
                <time dateTime={getPostDate(lead)}>
                  {formatDate(getPostDate(lead))}
                </time>
              </div>
            </Link>
          </div>

          {/* Sidebar Stories */}
          <div style={{ paddingLeft: '24px' }}>
            {sidebar.map((post, i) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: i < sidebar.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                  textDecoration: 'none',
                  color: 'inherit',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {post.category && (
                    <span
                      style={{
                        fontSize: '8px',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        color: 'var(--color-accent)',
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      {post.category}
                    </span>
                  )}

                  <h3
                    style={{
                      fontSize: '15px',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      lineHeight: 1.3,
                      margin: '0 0 4px',
                      color: 'var(--color-text)',
                    }}
                  >
                    {post.title}
                  </h3>

                  {(post.meta_description || post.excerpt) && (
                    <p
                      style={{
                        fontSize: '10px',
                        lineHeight: 1.5,
                        color: 'var(--color-text-secondary)',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {post.meta_description || post.excerpt}
                    </p>
                  )}
                </div>

                {post.featured_image && (
                  <div
                    style={{
                      width: 90,
                      height: 60,
                      flexShrink: 0,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      sizes="90px"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .home-hero-grid {
            grid-template-columns: 1fr !important;
          }
          .home-hero-grid > div:first-child {
            border-right: none !important;
            padding-right: 0 !important;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--color-border);
            margin-bottom: 8px;
          }
          .home-hero-grid > div:last-child {
            padding-left: 0 !important;
          }
        }
      `}</style>
    </>
  )
}
