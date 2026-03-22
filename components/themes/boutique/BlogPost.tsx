import Image from 'next/image'
import type { BlogPostPageProps } from '../types'
import { getPostDate, estimateReadTime } from '@/lib/posts'
import EndOfArticleCTA from '@/components/EndOfArticleCTA'
import ArticleReactions from '@/components/ArticleReactions'
import ArticleComments from '@/components/ArticleComments'
import RelatedPosts from '@/components/RelatedPosts'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BoutiqueBlogPost({ brand, post, config }: BlogPostPageProps) {
  const authorName = post.author || brand.guidelines?.default_author || brand.guidelines?.name || 'Author'
  const postDate = getPostDate(post)
  const readTime = estimateReadTime(post) + ' min read'

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Header — centered, warm single-column */}
      <header
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '32px 16px 20px',
        }}
      >
        {post.category && (
          <span
            style={{
              display: 'inline-block',
              fontSize: '8px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#fff',
              background: 'var(--color-accent)',
              borderRadius: '20px',
              padding: '4px 14px',
              marginBottom: '14px',
            }}
          >
            {post.category}
          </span>
        )}

        <h1
          style={{
            fontSize: '28px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            lineHeight: 1.3,
            margin: '0 0 12px',
            color: 'var(--color-text)',
          }}
        >
          {post.title}
        </h1>

        {(post.meta_description || post.excerpt) && (
          <p
            style={{
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              lineHeight: 1.6,
              color: 'var(--color-text-secondary)',
              margin: '0 0 16px',
            }}
          >
            {post.meta_description || post.excerpt}
          </p>
        )}

        {/* Author bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--color-bg-warm)',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{authorName}</span>
            <span>&middot;</span>
            <span>{formatDate(postDate)}</span>
            <span>&middot;</span>
            <span>{readTime}</span>
          </div>
        </div>

        <div style={{ borderBottom: '1px solid var(--color-border)' }} />
      </header>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 16px' }}>
        {/* Featured Image */}
        {post.featured_image && (
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                position: 'relative',
                aspectRatio: '3 / 2',
                overflow: 'hidden',
                borderRadius: 'var(--border-radius)',
              }}
            >
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 720px"
                style={{ objectFit: 'cover' }}
                priority
              />
            </div>
            <p
              style={{
                fontSize: '9px',
                fontStyle: 'italic',
                color: 'var(--color-text-muted)',
                marginTop: '6px',
                textAlign: 'center',
              }}
            >
              {post.title}
            </p>
          </div>
        )}

        {/* Article Body */}
        <div
          className="boutique-article-body"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        {/* End of Article */}
        <div style={{ marginTop: '28px', marginBottom: '24px' }}>
          <EndOfArticleCTA username={config.username} />
        </div>

        <ArticleReactions />
        <ArticleComments postSlug={post.slug} />
      </div>

      {/* Related Posts — full width */}
      <RelatedPosts currentPostId={post.id} category={post.category || 'General'} />

      {/* Boutique article body styles */}
      <style>{`
        .boutique-article-body {
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--color-text-body);
          line-height: 1.8;
        }
        .boutique-article-body h2 {
          margin-top: 36px;
          margin-bottom: 14px;
          font-size: 22px;
          font-family: var(--font-heading);
          font-weight: 700;
          color: var(--color-text);
        }
        .boutique-article-body h3 {
          margin-top: 28px;
          margin-bottom: 10px;
          font-size: 18px;
          font-family: var(--font-heading);
          font-weight: 600;
          color: var(--color-text);
        }
        .boutique-article-body p { margin-bottom: 20px; }
        .boutique-article-body a { color: var(--color-accent); text-decoration: underline; }
        .boutique-article-body img { max-width: 100%; height: auto; border-radius: var(--border-radius); margin: 20px 0; }
        .boutique-article-body blockquote {
          border-left: 3px solid var(--color-accent);
          background: var(--color-bg-warm);
          margin: 24px 0;
          padding: 16px 20px;
          border-radius: 0 var(--border-radius) var(--border-radius) 0;
          font-style: italic;
        }
        .boutique-article-body ul, .boutique-article-body ol { margin-bottom: 20px; padding-left: 24px; }
        .boutique-article-body li { margin-bottom: 8px; }
        .boutique-article-body table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
        .boutique-article-body th, .boutique-article-body td { border: 1px solid var(--color-border); padding: 10px 14px; }
        .boutique-article-body th { background: var(--color-bg-warm); font-weight: 600; }
      `}</style>
    </main>
  )
}
