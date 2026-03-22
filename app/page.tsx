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
    openGraph: { title: config.siteName, description, type: 'website', url: config.siteUrl },
  }
}

export default async function HomePage() {
  const config = getTenantConfig()
  const [brand, posts] = await Promise.all([
    getBrandData(),
    getPublishedPosts(20),
  ])
  const theme = brand.specs?.theme || 'editorial'

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <ThemeHomePage theme={theme} brand={brand} posts={posts} config={config} />
    </main>
  )
}
