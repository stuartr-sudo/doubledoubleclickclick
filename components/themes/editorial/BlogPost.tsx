import Image from 'next/image'
import Breadcrumb from '@/components/Breadcrumb'
import AuthorBar from '@/components/AuthorBar'
import NewsletterSidebar from '@/components/NewsletterSidebar'
import EndOfArticleCTA from '@/components/EndOfArticleCTA'
import ArticleReactions from '@/components/ArticleReactions'
import ArticleComments from '@/components/ArticleComments'
import RelatedPosts from '@/components/RelatedPosts'
import { getPostDate, estimateReadTime } from '@/lib/posts'
import type { BlogPostPageProps } from '../types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function EditorialBlogPost({ brand, post, config }: BlogPostPageProps) {
  const authorName = post.author || brand.guidelines?.default_author || brand.guidelines?.name || 'Author'
  const postDate = getPostDate(post)
  const readTime = estimateReadTime(post) + ' min read'

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div className="container">
        {/* Breadcrumb */}
        {post.category && (
          <div style={{ paddingTop: '16px' }}>
            <Breadcrumb category={post.category} />
          </div>
        )}

        {/* Article Header — centered */}
        <header
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            textAlign: 'center',
            padding: '24px 0 16px',
          }}
        >
          {post.category && (
            <span
              style={{
                fontSize: '9px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'var(--color-accent)',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              {post.category}
            </span>
          )}

          <h1
            style={{
              fontSize: '32px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.5px',
              margin: '0 0 10px',
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

          {/* Author Bar */}
          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
              padding: '10px 0',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <AuthorBar
              name={authorName}
              date={formatDate(postDate)}
              readTime={readTime}
              avatarSize={36}
            />
          </div>
        </header>

        {/* Two-Column Layout */}
        <div
          className="article-two-col"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 260px',
            maxWidth: '960px',
            margin: '0 auto',
            gap: '0',
          }}
        >
          {/* Main Column */}
          <div
            style={{
              borderRight: '1px solid var(--color-border)',
              paddingRight: '24px',
            }}
          >
            {/* Hero Image */}
            {post.featured_image && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '3 / 2',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={post.featured_image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 680px"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
                <p
                  style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-sans)',
                    fontStyle: 'italic',
                    color: 'var(--color-text-muted)',
                    marginTop: '6px',
                  }}
                >
                  {post.title}
                </p>
              </div>
            )}

            {/* Article Body */}
            <div
              className="article-body-content"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />

            {/* End of Article CTA */}
            <div style={{ marginTop: '24px', marginBottom: '24px' }}>
              <EndOfArticleCTA username={config.username} />
            </div>

            <ArticleReactions />
            <ArticleComments postSlug={post.slug} />
          </div>

          {/* Sidebar */}
          <aside
            className="article-sidebar"
            style={{
              paddingLeft: '16px',
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <NewsletterSidebar username={config.username} />
            </div>
          </aside>
        </div>
      </div>

      {/* Related Posts — full width */}
      <RelatedPosts currentPostId={post.id} category={post.category || 'General'} />

      {/* Article body styles */}
      <style>{`
        .article-body-content {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 14px;
          color: #333;
          line-height: 1.75;
        }
        .article-body-content h2 {
          border-top: 1px solid var(--color-border);
          padding-top: 20px;
          margin-top: 32px;
          margin-bottom: 12px;
          font-size: 20px;
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 700;
          line-height: 1.3;
          color: var(--color-text);
        }
        .article-body-content h3 {
          margin-top: 24px;
          margin-bottom: 8px;
          font-size: 17px;
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 700;
          line-height: 1.3;
          color: var(--color-text);
        }
        .article-body-content p {
          margin-bottom: 16px;
        }
        .article-body-content a {
          color: var(--color-accent);
          text-decoration: underline;
        }
        .article-body-content a:hover {
          opacity: 0.8;
        }
        .article-body-content blockquote {
          border-left: 3px solid #1a1a1a;
          margin: 24px 0;
          padding: 12px 0 12px 20px;
          font-style: italic;
          font-size: 16px;
          line-height: 1.6;
          color: var(--color-text);
        }
        .article-body-content img {
          max-width: 100%;
          height: auto;
          margin: 16px 0;
        }
        .article-body-content ul,
        .article-body-content ol {
          margin-bottom: 16px;
          padding-left: 24px;
        }
        .article-body-content li {
          margin-bottom: 6px;
        }
        .article-body-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 12px;
        }
        .article-body-content th,
        .article-body-content td {
          border: 1px solid var(--color-border);
          padding: 8px 12px;
          text-align: left;
        }
        .article-body-content th {
          background: var(--color-bg-warm);
          font-weight: 700;
        }

        /* Mobile: single column */
        @media (max-width: 768px) {
          .article-two-col {
            grid-template-columns: 1fr !important;
          }
          .article-two-col > div:first-child {
            border-right: none !important;
            padding-right: 0 !important;
          }
          .article-sidebar {
            padding-left: 0 !important;
            margin-top: 24px;
            border-top: 1px solid var(--color-border);
            padding-top: 24px;
          }
        }
      `}</style>
    </main>
  )
}
