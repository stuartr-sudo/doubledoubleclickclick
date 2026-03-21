import Image from 'next/image'
import { getPostBySlug, getPostDate, estimateReadTime } from '@/lib/posts'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import BlogTracker from '@/components/BlogTracker'
import ArticleReactions from '@/components/ArticleReactions'
import ArticleComments from '@/components/ArticleComments'
import RelatedPosts from '@/components/RelatedPosts'
import Breadcrumb from '@/components/Breadcrumb'
import AuthorBar from '@/components/AuthorBar'
import TableOfContents from '@/components/TableOfContents'
import NewsletterSidebar from '@/components/NewsletterSidebar'
import EndOfArticleCTA from '@/components/EndOfArticleCTA'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const config = getTenantConfig()
  const post = await getPostBySlug(params.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The blog post you are looking for does not exist.',
    }
  }

  const seoTitle = post.meta_title || post.title
  const description = post.meta_description || post.excerpt || ''
  const url = `${config.siteUrl}/blog/${params.slug}`

  return {
    title: seoTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: seoTitle,
      description,
      type: 'article',
      url,
      images: post.featured_image ? [{ url: post.featured_image, width: 1200, height: 630, alt: seoTitle }] : [],
      publishedTime: getPostDate(post),
      tags: post.tags || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description,
      images: post.featured_image ? [post.featured_image] : [],
    },
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const config = getTenantConfig()
  const brand = await getBrandData()
  const brandName = brand.guidelines?.name || config.siteName
  const post = await getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  const baseUrl = config.siteUrl

  // JSON-LD structured data
  let articleJsonLd
  if (post.generated_llm_schema) {
    try {
      const parsedSchema = JSON.parse(post.generated_llm_schema)

      const hasValidFAQContent = (faqSchema: any): boolean => {
        if (faqSchema.mainEntity && Array.isArray(faqSchema.mainEntity) && faqSchema.mainEntity.length > 0) {
          return faqSchema.mainEntity.some((item: any) =>
            item['@type'] === 'Question' &&
            item.name &&
            item.acceptedAnswer &&
            item.acceptedAnswer.text
          )
        }
        return false
      }

      if (parsedSchema['@graph'] && Array.isArray(parsedSchema['@graph'])) {
        const filteredGraph = parsedSchema['@graph'].filter((item: any) => {
          if (item['@type'] === 'FAQPage') return hasValidFAQContent(item)
          return true
        })
        if (filteredGraph.length > 0) {
          parsedSchema['@graph'] = filteredGraph
          articleJsonLd = parsedSchema
        }
      } else if (parsedSchema['@type'] === 'FAQPage') {
        if (hasValidFAQContent(parsedSchema)) articleJsonLd = parsedSchema
      } else {
        articleJsonLd = parsedSchema
      }
    } catch (e) {
      console.error('Error parsing generated_llm_schema:', e)
    }
  }

  if (!articleJsonLd) {
    articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.meta_description || post.excerpt || '',
      image: post.featured_image || '',
      datePublished: getPostDate(post),
      dateModified: post.updated_date || getPostDate(post),
      author: {
        '@type': 'Person',
        name: post.author || brand.guidelines?.default_author || brandName,
        url: baseUrl,
      },
      publisher: {
        '@type': 'Organization',
        name: brandName,
        logo: {
          '@type': 'ImageObject',
          url: brand.specs?.logo_url || `${baseUrl}/favicon.svg`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/blog/${post.slug}`,
      },
    }
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      ...(post.category
        ? [{ '@type': 'ListItem', position: 2, name: post.category, item: `${baseUrl}/blog?category=${encodeURIComponent(post.category)}` }]
        : []),
      {
        '@type': 'ListItem',
        position: post.category ? 3 : 2,
        name: post.title,
        item: `${baseUrl}/blog/${post.slug}`,
      },
    ],
  }

  const authorName = post.author || brand.guidelines?.default_author || brandName
  const postDate = getPostDate(post)
  const readTime = `${estimateReadTime(post)} min read`

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <BlogTracker slug={post.slug} title={post.title} category={post.category || undefined} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

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

            {/* Mobile TOC (above article body) */}
            <div className="toc-mobile-wrapper" style={{ marginBottom: '16px' }}>
              <TableOfContents htmlContent={post.content || ''} />
            </div>

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
            {/* Desktop TOC */}
            <div className="toc-sidebar-wrapper" style={{ marginBottom: '24px' }}>
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
          .toc-sidebar-wrapper {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .toc-mobile-wrapper {
            display: none !important;
          }
        }
      `}</style>
    </main>
  )
}
