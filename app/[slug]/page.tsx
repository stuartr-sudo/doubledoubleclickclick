import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getTenantConfig } from '@/lib/tenant'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Catch-all dynamic page route.
 *
 * Reads tenant-specific custom pages from
 *   app_settings.setting_value.custom_pages.{slug}
 *
 * Schema for each custom page:
 *   {
 *     title:           string         // page H1 + <title>
 *     subtitle?:       string         // dek under H1
 *     meta_description?: string       // <meta description> override
 *     hero_image_url?: string         // optional banner above content
 *     body_html:       string         // pre-rendered HTML body
 *   }
 *
 * Next.js routes specific paths first, so this only fires for paths
 * that don't have their own page (i.e. NOT /about, /blog, /contact,
 * /privacy, /terms, /quiz, /admin, /api, /). Unknown slugs 404.
 */

interface CustomPage {
  title?: string
  subtitle?: string
  meta_description?: string
  hero_image_url?: string
  body_html?: string
}

async function loadCustomPage(slug: string): Promise<CustomPage | null> {
  const config = getTenantConfig()
  if (!config.username) return null

  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_name', `static_pages:${config.username}`)
      .maybeSingle()
    const sv = data?.setting_value as Record<string, unknown> | null
    const customPages = (sv?.custom_pages as Record<string, CustomPage> | undefined) || null
    if (!customPages) return null
    const page = customPages[slug]
    if (!page || typeof page !== 'object') return null
    if (!page.body_html && !page.title) return null
    return page
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await loadCustomPage(params.slug)
  if (!page) return { title: 'Not found' }
  const config = getTenantConfig()
  return {
    title: page.title ? `${page.title} | ${config.siteName}` : config.siteName,
    description: page.meta_description || page.subtitle || '',
  }
}

async function loadRecentPosts(limit: number): Promise<Array<{ slug: string; title: string; excerpt?: string | null; featured_image?: string | null }>> {
  const config = getTenantConfig()
  if (!config.username) return []
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('blog_posts')
      .select('slug, title, excerpt, featured_image')
      .eq('user_name', config.username)
      .eq('status', 'published')
      .order('published_date', { ascending: false, nullsFirst: false })
      .limit(limit)
    return data || []
  } catch {
    return []
  }
}

export default async function CustomPage({ params }: { params: { slug: string } }) {
  const page = await loadCustomPage(params.slug)
  if (!page) notFound()
  const config = getTenantConfig()
  const relatedPosts = await loadRecentPosts(3)

  // Schema.org WebPage + BreadcrumbList for SEO/AEO
  const pageUrl = `${config.siteUrl}/${params.slug}`
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: page.title || params.slug,
    ...(page.subtitle && { description: page.subtitle }),
    ...(page.meta_description && { description: page.meta_description }),
    ...(page.hero_image_url && {
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: page.hero_image_url,
      },
    }),
    isPartOf: { '@id': `${config.siteUrl}/#website` },
    inLanguage: 'en',
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: config.siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.title || params.slug,
        item: pageUrl,
      },
    ],
  }

  // FAQPage detection — find H2 elements that are questions (end with '?')
  // followed by their answer block (until next H2/H3 or end). If we find
  // 2+, emit FAQPage schema for AI / Google rich-results visibility.
  const faqSchema = (() => {
    if (!page.body_html) return null
    const html = page.body_html
    // Match: <h2>Question?</h2> ...content until next <h2 or <h3 or end
    const pattern = /<h2[^>]*>\s*([^<]+\?)\s*<\/h2>([\s\S]*?)(?=<h[23]\b|$)/gi
    const items: Array<{ q: string; a: string }> = []
    let m: RegExpExecArray | null
    while ((m = pattern.exec(html)) !== null) {
      const q = m[1].replace(/&[a-z]+;/g, ' ').trim()
      // Strip HTML tags from the answer for the schema (keep plain text).
      const a = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (q && a && a.length > 30) items.push({ q, a })
    }
    if (items.length < 2) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    }
  })()

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <article style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 64px' }}>
        {page.hero_image_url && (
          <div
            style={{
              position: 'relative',
              aspectRatio: '21/9',
              width: '100%',
              borderRadius: 'var(--border-radius, 16px)',
              overflow: 'hidden',
              marginBottom: 32,
            }}
          >
            <Image
              src={page.hero_image_url}
              alt={page.title || ''}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        )}

        <header style={{ textAlign: 'center', marginBottom: 32 }}>
          {page.title && (
            <h1
              style={{
                fontFamily: 'var(--font-heading, Georgia, serif)',
                fontSize: 36,
                fontWeight: 400,
                fontStyle: 'italic',
                margin: '0 0 12px',
                lineHeight: 1.2,
                color: 'var(--color-text, #1a1a1a)',
              }}
            >
              {page.title}
            </h1>
          )}
          {page.subtitle && (
            <p
              style={{
                fontSize: 18,
                color: 'var(--color-text-secondary, #666)',
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 560,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {page.subtitle}
            </p>
          )}
        </header>

        {page.body_html && (
          <div
            className="custom-page-body"
            style={{
              fontFamily: 'var(--font-body, Georgia, serif)',
              fontSize: 17,
              color: 'var(--color-text-body, #333)',
              lineHeight: 1.8,
            }}
            // Body HTML is provisioner-controlled (markdown converted by the
            // bundle ingester). Tenants don't get user-input here.
            dangerouslySetInnerHTML={{ __html: page.body_html }}
          />
        )}

        {/* Internal linking — surfaces 3 recent blog posts to drive
            topical authority + give visitors a next-step on the page.
            SEO/AEO win: AI engines weight pages with strong internal
            linking patterns more heavily. */}
        {relatedPosts.length > 0 && (
          <aside style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--color-border, #e5e5e5)' }}>
            <h2 style={{
              fontFamily: 'var(--font-sans, system-ui)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted, #999)',
              marginBottom: 20,
              fontWeight: 400,
            }}>
              Latest from the journal
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {relatedPosts.map((post) => (
                <li key={post.slug} style={{ marginBottom: 24 }}>
                  <Link href={`/blog/${post.slug}`} style={{
                    textDecoration: 'none',
                    color: 'var(--color-text, #1a1a1a)',
                    display: 'block',
                  }}>
                    <h3 style={{
                      fontFamily: 'var(--font-heading, Georgia, serif)',
                      fontSize: 18,
                      fontWeight: 600,
                      margin: '0 0 4px',
                      lineHeight: 1.35,
                    }}>
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p style={{
                        fontSize: 14,
                        color: 'var(--color-text-secondary, #666)',
                        margin: 0,
                        lineHeight: 1.6,
                      }}>
                        {post.excerpt}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/blog" style={{
              display: 'inline-block',
              marginTop: 12,
              fontFamily: 'var(--font-sans, system-ui)',
              fontSize: 13,
              color: 'var(--color-accent, #c4a882)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              All articles →
            </Link>
          </aside>
        )}
      </article>
    </main>
  )
}
