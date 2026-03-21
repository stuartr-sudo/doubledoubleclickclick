import Image from 'next/image'
import Link from 'next/link'
import type { BlogPost } from '@/lib/posts'
import { getPostDate, estimateReadTime } from '@/lib/posts'

interface MoreStoriesProps {
  posts: BlogPost[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function MoreStories({ posts }: MoreStoriesProps) {
  if (posts.length === 0) return null

  // Split into two columns
  const mid = Math.ceil(posts.length / 2)
  const leftCol = posts.slice(0, mid)
  const rightCol = posts.slice(mid)

  const renderRow = (post: BlogPost, isLast: boolean) => (
    <Link
      key={post.id}
      href={`/blog/${post.slug}`}
      style={{
        display: 'flex',
        gap: '12px',
        padding: '10px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--color-border-light)',
        textDecoration: 'none',
        color: 'inherit',
        alignItems: 'flex-start',
      }}
    >
      {post.featured_image && (
        <div
          style={{
            width: 64,
            height: 43,
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            sizes="64px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}

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
              marginBottom: '2px',
            }}
          >
            {post.category}
          </span>
        )}

        <h3
          style={{
            fontSize: '13px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            lineHeight: 1.3,
            margin: '0 0 4px',
            color: 'var(--color-text)',
          }}
        >
          {post.title}
        </h3>

        <div
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text-muted)',
            display: 'flex',
            gap: '6px',
          }}
        >
          <time dateTime={getPostDate(post)}>
            {formatDate(getPostDate(post))}
          </time>
          <span>·</span>
          <span>{estimateReadTime(post)} min read</span>
        </div>
      </div>
    </Link>
  )

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
          More Stories
        </div>

        {/* 2-column grid */}
        <div
          className="more-stories-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0',
          }}
        >
          <div
            style={{
              borderRight: '1px solid var(--color-border)',
              paddingRight: '16px',
            }}
          >
            {leftCol.map((post, i) => renderRow(post, i === leftCol.length - 1))}
          </div>

          <div style={{ paddingLeft: '16px' }}>
            {rightCol.map((post, i) => renderRow(post, i === rightCol.length - 1))}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .more-stories-grid {
            grid-template-columns: 1fr !important;
          }
          .more-stories-grid > div:first-child {
            border-right: none !important;
            padding-right: 0 !important;
            border-bottom: 1px solid var(--color-border);
            margin-bottom: 8px;
          }
          .more-stories-grid > div:last-child {
            padding-left: 0 !important;
          }
        }
      `}</style>
    </>
  )
}
