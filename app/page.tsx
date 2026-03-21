import { getBrandData } from '@/lib/brand'
import { getPublishedPosts } from '@/lib/posts'
import { getTenantConfig } from '@/lib/tenant'
import HomeHero from '@/components/HomeHero'
import LatestGrid from '@/components/LatestGrid'
import NewsletterBanner from '@/components/NewsletterBanner'
import MoreStories from '@/components/MoreStories'
import ProductSpotlight from '@/components/ProductSpotlight'
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
    openGraph: {
      title: config.siteName,
      description,
      type: 'website',
      url: config.siteUrl,
    },
  }
}

export default async function HomePage() {
  const config = getTenantConfig()

  const [brand, posts] = await Promise.all([
    getBrandData(),
    getPublishedPosts(20),
  ])

  const brandName = brand.guidelines?.name || config.siteName

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: '24px' }}>
        {/* Hero: lead story + 3 sidebar stories */}
        <HomeHero posts={posts.slice(0, 4)} />

        {/* Latest: 3-column grid */}
        <LatestGrid posts={posts.slice(4, 7)} />

        {/* Featured Product — full-width banner style */}
        <div style={{ marginBottom: '24px' }}>
          <ProductSpotlight limit={1} offset={1} />
        </div>

        {/* Newsletter Banner */}
        <div style={{ marginBottom: '24px' }}>
          <NewsletterBanner username={config.username} />
        </div>

        {/* More Stories: 2-column compact list */}
        <MoreStories posts={posts.slice(7)} />
      </div>
    </main>
  )
}
