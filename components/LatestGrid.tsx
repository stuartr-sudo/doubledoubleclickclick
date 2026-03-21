import Image from 'next/image'
import Link from 'next/link'
import type { BlogPost } from '@/lib/posts'
import { estimateReadTime } from '@/lib/posts'

interface LatestGridProps {
  posts: BlogPost[]
}

export default function LatestGrid({ posts }: LatestGridProps) {
  if (posts.length === 0) return null

  return (
    <>
      <section style={{ marginBottom: '24px' }}>
        {/* Section Label */}
        <div
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2.5px',
            color: 'var(--color-text)',
            paddingBottom: '8px',
            borderBottom: '2px solid var(--color-text)',
            marginBottom: '16px',
          }}
        >
          Latest
        </div>

        {/* 3-column grid */}
        <div
          className="latest-grid-cols"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0',
          }}
        >
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                padding: '0 16px',
                borderRight: i < posts.length - 1 && i < 2 ? '1px solid var(--color-border)' : 'none',
                ...(i === 0 ? { paddingLeft: 0 } : {}),
                ...(i === posts.length - 1 || i === 2 ? { paddingRight: 0 } : {}),
              }}
            >
              {post.featured_image && (
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '3 / 2',
                    overflow: 'hidden',
                    marginBottom: '10px',
                  }}
                >
                  <Image
                    src={post.featured_image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}

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
                  fontSize: '14px',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  lineHeight: 1.3,
                  margin: '0 0 6px',
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
                    margin: '0 0 6px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {post.meta_description || post.excerpt}
                </p>
              )}

              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {estimateReadTime(post)} min read
              </span>
            </Link>
          ))}
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .latest-grid-cols {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .latest-grid-cols > a {
            border-right: none !important;
            padding: 0 !important;
            padding-bottom: 16px !important;
            border-bottom: 1px solid var(--color-border-light);
          }
          .latest-grid-cols > a:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </>
  )
}
