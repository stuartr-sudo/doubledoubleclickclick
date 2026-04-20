import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
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

export default async function CustomPage({ params }: { params: { slug: string } }) {
  const page = await loadCustomPage(params.slug)
  if (!page) notFound()
  const config = getTenantConfig()

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

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
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
      </article>
    </main>
  )
}
