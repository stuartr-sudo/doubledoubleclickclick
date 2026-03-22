import Image from 'next/image'
import type { BlogPostPageProps } from '../types'
import { getPostDate, estimateReadTime } from '@/lib/posts'
import TableOfContents from '@/components/TableOfContents'
import NewsletterSidebar from '@/components/NewsletterSidebar'
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

export default function ModernBlogPost({ brand, post, config }: BlogPostPageProps) {
  const authorName = post.author || brand.guidelines?.default_author || brand.guidelines?.name || 'Author'
  const postDate = getPostDate(post)
  const readTime = estimateReadTime(post) + ' min read'

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div className="container">
        {/* Header — left-aligned */}
        <header
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            padding: '24px 0 0',
          }}
        >
          {post.category && (
            <span
              style={{
                fontSize: '9px',
                fontFamily: "'SF Mono', 'Fira Code', ui-monospace, monospace",
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
              fontSize: '30px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              lineHeight: 1.2,
              margin: '0 0 10px',
              color: 'var(--color-text)',
            }}
          >
            {post.title}
          </h1>

          {/* Compact author bar — no avatar */}
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontWeight: 700 }}>{authorName}</span>
            {' \u00B7 '}
            {formatDate(postDate)}
            {' \u00B7 '}
            {readTime}
          </div>

          {/* Thin separator */}
          <div
            style={{
              borderBottom: '1px solid var(--color-border)',
              margin: '0 0 16px',
            }}
          />
        </header>

        {/* Two-Column Layout */}
        <div
          className="modern-two-col"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 260px',
            maxWidth: '960px',
            margin: '0 auto',
            gap: '0',
          }}
        >
          {/* Left Column — Article Body */}
          <div
            style={{
              paddingRight: '24px',
            }}
          >
            {/* Featured Image */}
            {post.featured_image && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '3 / 2',
                    overflow: 'hidden',
                    borderRadius: '4px',
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
              </div>
            )}

            {/* Mobile TOC */}
            <div className="modern-toc-mobile" style={{ display: 'none', marginBottom: '16px' }}>
              <TableOfContents htmlContent={post.content || ''} />
            </div>

            {/* Article Content */}
            <div
              className="modern-article-body"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />

            {/* End of Article CTA */}
            <div style={{ marginTop: '24px', marginBottom: '24px' }}>
              <EndOfArticleCTA username={config.username} />
            </div>

            <ArticleReactions />
            <ArticleComments postSlug={post.slug} />
          </div>

          {/* Right Sidebar */}
          <aside
            className="modern-sidebar"
            style={{
              borderLeft: '1px solid var(--color-border)',
              paddingLeft: '16px',
            }}
          >
            <div className="modern-toc-sidebar" style={{ marginBottom: '24px' }}>
              <TableOfContents htmlContent={post.content || ''} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <NewsletterSidebar username={config.username} />
            </div>
          </aside>
        </div>
      </div>

      {/* Related Posts — full width */}
      <RelatedPosts currentPostId={post.id} category={post.category || 'General'} />

      {/* Modern article body styles */}
      <style>{`
        .modern-article-body {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--color-text-body);
          line-height: 1.75;
        }
        .modern-article-body h2 {
          margin-top: 32px;
          margin-bottom: 12px;
          font-size: 20px;
          font-family: var(--font-heading);
          font-weight: 700;
          color: var(--color-text);
          letter-spacing: -0.3px;
        }
        .modern-article-body h3 {
          margin-top: 24px;
          margin-bottom: 8px;
          font-size: 16px;
          font-family: var(--font-heading);
          font-weight: 600;
          color: var(--color-text);
        }
        .modern-article-body p { margin-bottom: 16px; }
        .modern-article-body a { color: var(--color-accent); text-decoration: underline; }
        .modern-article-body a:hover { opacity: 0.8; }
        .modern-article-body img { max-width: 100%; height: auto; border-radius: 4px; margin: 16px 0; }
        .modern-article-body blockquote {
          border-left: 3px solid var(--color-accent);
          background: var(--color-bg-warm);
          margin: 24px 0;
          padding: 12px 16px;
          font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
          font-size: 13px;
          color: var(--color-text-secondary);
          border-radius: 0 4px 4px 0;
        }
        .modern-article-body ul, .modern-article-body ol { margin-bottom: 16px; padding-left: 24px; }
        .modern-article-body li { margin-bottom: 6px; }
        .modern-article-body table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
        .modern-article-body th, .modern-article-body td { border: 1px solid var(--color-border); padding: 8px 12px; text-align: left; }
        .modern-article-body th { background: var(--color-bg-warm); font-weight: 600; font-family: var(--font-sans); }
        .modern-article-body tr:nth-child(even) td { background: var(--color-bg-warm); }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .modern-two-col {
            grid-template-columns: 1fr !important;
          }
          .modern-two-col > div:first-child {
            border-right: none !important;
            padding-right: 0 !important;
          }
          .modern-sidebar {
            padding-left: 0 !important;
            margin-top: 24px;
            border-top: 1px solid var(--color-border);
            padding-top: 24px;
            border-left: none !important;
          }
          .modern-toc-sidebar { display: none !important; }
          .modern-toc-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
          .modern-toc-mobile { display: none !important; }
        }
      `}</style>
    </main>
  )
}
