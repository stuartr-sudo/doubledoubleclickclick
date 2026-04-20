import { getBrandData } from '@/lib/brand'
import { getPublishedPosts } from '@/lib/posts'
import { getTenantConfig } from '@/lib/tenant'
import { ThemeHomePage } from '@/components/themes/ThemeRenderer'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const config = getTenantConfig()
  let description = ''
  try {
    const brand = await getBrandData()
    description = brand.company?.blurb || brand.guidelines?.brand_personality || ''
  } catch {}
  return {
    title: config.siteName,
    description,
    alternates: { canonical: config.siteUrl },
    // openGraph + twitter are inherited from app/layout.tsx where they
    // include images (hero photo). Don't override here or images get
    // wiped (Next.js doesn't deep-merge metadata fields).
  }
}

export default async function HomePage() {
  const config = getTenantConfig()
  const [brand, posts] = await Promise.all([
    getBrandData(),
    getPublishedPosts(20),
  ])
  const theme = brand.specs?.theme || 'editorial'
  const brandName = brand.guidelines?.name || config.siteName

  // Schema.org CollectionPage — tells search engines + AI engines this is
  // a content hub. The mainEntity ItemList exposes the top posts so they
  // are more likely to surface in AI Overviews.
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${config.siteUrl}/#collectionpage`,
    url: config.siteUrl,
    name: brandName,
    description: brand.company?.blurb || brand.guidelines?.brand_personality || '',
    isPartOf: { '@id': `${config.siteUrl}/#website` },
    about: { '@id': `${config.siteUrl}/#organization` },
    ...(posts.length > 0 && {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: posts.length,
        itemListElement: posts.slice(0, 10).map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${config.siteUrl}/blog/${p.slug}`,
          name: p.title,
        })),
      },
    }),
  }

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }} />
      <ThemeHomePage theme={theme} brand={brand} posts={posts} config={config} />
    </main>
  )
}
