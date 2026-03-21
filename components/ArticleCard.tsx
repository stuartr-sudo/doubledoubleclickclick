import Image from 'next/image'
import Link from 'next/link'

interface ArticleCardProps {
  post: {
    title: string
    slug: string
    excerpt?: string
    category?: string
    featured_image?: string
    author_name?: string
    author_image?: string
    created_date?: string
    read_time?: string
  }
}

export default function ArticleCard({ post }: ArticleCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{
        display: 'flex',
        gap: '16px',
        padding: '16px 0',
        borderBottom: '1px solid var(--color-border-light)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      {post.featured_image && (
        <div
          style={{
            width: 140,
            height: 93,
            flexShrink: 0,
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            sizes="140px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {post.category && (
          <span
            style={{
              fontSize: '8px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--color-accent)',
            }}
          >
            {post.category}
          </span>
        )}

        <h3
          style={{
            fontSize: '17px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            lineHeight: 1.3,
            margin: 0,
            color: 'var(--color-text)',
          }}
        >
          {post.title}
        </h3>

        {post.excerpt && (
          <p
            style={{
              fontSize: '12px',
              lineHeight: 1.5,
              color: 'var(--color-text-secondary)',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.excerpt}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: 'auto',
            fontSize: '11px',
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text-muted)',
          }}
        >
          {post.author_image ? (
            <Image
              src={post.author_image}
              alt={post.author_name || ''}
              width={20}
              height={20}
              style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: 'var(--color-border)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
          )}
          {post.author_name && (
            <span style={{ fontWeight: 600, color: 'var(--color-text-body)' }}>
              {post.author_name}
            </span>
          )}
          {post.created_date && (
            <span style={{ color: 'var(--color-text-faint)' }}>{post.created_date}</span>
          )}
          {post.read_time && (
            <>
              <span style={{ color: 'var(--color-text-faint)' }}>·</span>
              <span style={{ color: 'var(--color-text-faint)' }}>{post.read_time}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
