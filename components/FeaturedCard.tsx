import Image from 'next/image'
import Link from 'next/link'
import AuthorBar from './AuthorBar'

interface FeaturedCardProps {
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

export default function FeaturedCard({ post }: FeaturedCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '24px',
        paddingBottom: '24px',
        borderBottom: '1px solid var(--color-border)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      {post.featured_image && (
        <div
          style={{
            position: 'relative',
            aspectRatio: '3 / 2',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 560px"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        {post.category && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              Featured
            </span>
          </div>
        )}

        <h2
          style={{
            fontSize: '22px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            lineHeight: 1.3,
            margin: 0,
            color: 'var(--color-text)',
          }}
        >
          {post.title}
        </h2>

        {post.excerpt && (
          <p
            style={{
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.6,
              color: 'var(--color-text-secondary)',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.excerpt}
          </p>
        )}

        <AuthorBar
          name={post.author_name || ''}
          imageUrl={post.author_image}
          date={post.created_date || ''}
          readTime={post.read_time}
        />
      </div>
    </Link>
  )
}
