import type { Metadata } from 'next'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import { createServiceClient } from '@/lib/supabase/service'
import WriterCard from '@/components/WriterCard'
import AboutNewsletter from './AboutNewsletter'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const config = getTenantConfig()
  return {
    title: `About | ${config.siteName}`,
    description: `Learn more about ${config.siteName} and our team.`,
  }
}

export default async function AboutPage() {
  const config = getTenantConfig()
  const brand = await getBrandData()
  const brandName = brand.guidelines?.name || config.siteName

  // Fetch mission text from company_information
  const missionText =
    brand.company?.blurb ||
    'We bring you evidence-based insights, practical guidance, and expert perspectives to help you make informed decisions.'

  // Fetch all authors for this tenant
  const supabase = createServiceClient()
  const { data: authors } = await supabase
    .from('authors')
    .select('name, bio, profile_image_url, slug')
    .eq('user_name', config.username)

  return (
    <main>
      {/* Page Header */}
      <header
        style={{
          padding: '32px 32px 24px',
          borderBottom: '1px solid var(--color-border)',
          maxWidth: '680px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--color-accent)',
            marginBottom: '8px',
          }}
        >
          About
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Our Mission
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            margin: '12px 0 0',
            maxWidth: '520px',
          }}
        >
          {brandName} — built on evidence, driven by curiosity.
        </p>
      </header>

      {/* Body Content */}
      <div
        style={{
          maxWidth: '560px',
          padding: '20px 32px 40px',
        }}
      >
        {/* Mission Paragraphs */}
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '13px',
            color: '#333',
            lineHeight: 1.75,
          }}
        >
          <p style={{ margin: '0 0 16px' }}>{missionText}</p>
          {brand.guidelines?.brand_personality && (
            <p style={{ margin: '0 0 16px' }}>{brand.guidelines.brand_personality}</p>
          )}
        </div>

        {/* Our Writers Section */}
        {authors && authors.length > 0 && (
          <section style={{ marginTop: '40px' }}>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-border)',
                marginBottom: '4px',
              }}
            >
              Our Writers
            </div>
            {authors.map((author, i) => (
              <WriterCard
                key={author.slug || i}
                name={author.name}
                role="Writer"
                bio={author.bio || undefined}
                imageUrl={author.profile_image_url || undefined}
              />
            ))}
          </section>
        )}

        {/* Newsletter CTA */}
        <div style={{ marginTop: '40px' }}>
          <AboutNewsletter username={config.username} />
        </div>
      </div>
    </main>
  )
}
