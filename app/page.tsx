import Link from 'next/link'
import { getBrandData } from '@/lib/brand'
import { getPublishedPosts } from '@/lib/posts'
import { getTenantConfig } from '@/lib/tenant'
import SiteHeader from '@/components/SiteHeader'
import BlogCarousel from '@/components/BlogCarousel'
import LeadCaptureForm from '@/components/LeadCaptureForm'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/service'

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

async function getTopics(username: string): Promise<string[]> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('user_name', username)
      .eq('status', 'published')
      .not('category', 'is', null)

    if (data && data.length > 0) {
      const unique = [...new Set(data.map((r) => r.category).filter(Boolean))]
      if (unique.length >= 2) return unique as string[]
    }
  } catch {}

  // Fallback: derive from brand target market or use generic defaults
  return [
    'Health & Wellness',
    'Nutrition & Diet',
    'Fitness & Exercise',
    'Mental Wellbeing',
    'Science & Research',
  ]
}

export default async function HomePage() {
  const config = getTenantConfig()
  const brand = await getBrandData()
  const posts = await getPublishedPosts(6)
  const topics = await getTopics(config.username)

  const brandName = brand.guidelines?.name || config.siteName
  const tagline = brand.company?.blurb || brand.guidelines?.brand_personality || ''

  return (
    <>
      <SiteHeader
        logoText={brandName}
        logoImage={brand.specs?.logo_url || undefined}
      />
      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-overlay" />
          <div className="container hero-grid">
            <div className="hero-content">
              <h1 className="hero-title">{brandName}</h1>
              {tagline && <p className="hero-description">{tagline}</p>}
              <div className="hero-actions">
                <Link href="/blog" className="btn btn-hero-primary">
                  Read Our Blog
                </Link>
                <Link href="/about" className="btn btn-hero-secondary">
                  About Us
                </Link>
              </div>
            </div>

            <div className="hero-form-col">
              <LeadCaptureForm
                topics={topics}
                leadMagnetTitle="Get Our Free Longevity Guide"
                leadMagnetDescription="Evidence-based strategies for a longer, healthier life — delivered to your inbox."
                username={config.username}
              />
            </div>
          </div>
        </section>

        {/* About Intro */}
        {(brand.guidelines?.brand_personality || brand.guidelines?.voice_and_tone) && (
          <section className="about-intro-section">
            <div className="container">
              <h2>About</h2>
              <p>{brand.guidelines?.brand_personality || brand.guidelines?.voice_and_tone}</p>
              <Link href="/about" className="about-link">
                Learn more about us &rarr;
              </Link>
            </div>
          </section>
        )}

        {/* Blog Carousel */}
        {posts.length > 0 && (
          <BlogCarousel posts={posts} title="Latest Posts" />
        )}
      </main>
    </>
  )
}
