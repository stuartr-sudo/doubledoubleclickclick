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

  // Optional rich page content seeded by the provisioner
  // (founder_story, philosophy, immutable_rules, mission_long).
  // Lives in app_settings under setting_name='static_pages:{username}'.
  const { data: staticPagesRow } = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_name', `static_pages:${config.username}`)
    .maybeSingle()
  const staticPages = (staticPagesRow?.setting_value as Record<string, unknown> | null) || null
  const founderStory = typeof staticPages?.founder_story === 'string' ? staticPages.founder_story : null
  const philosophy = typeof staticPages?.philosophy === 'string' ? staticPages.philosophy : null
  const immutableRules = Array.isArray(staticPages?.immutable_rules) ? (staticPages.immutable_rules as Array<{ title: string; body: string }>) : null
  const missionLong = typeof staticPages?.mission_long === 'string' ? staticPages.mission_long : null
  const founderSectionHeader = typeof staticPages?.founder_section_header === 'string' ? staticPages.founder_section_header : 'The story behind it'
  const philosophySectionHeader = typeof staticPages?.philosophy_section_header === 'string' ? staticPages.philosophy_section_header : 'What makes this different'

  // Helper: split a long markdown-ish string into paragraphs by blank lines.
  const splitParas = (s: string) => s.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)

  // Schema.org AboutPage + Person (per author) for E-E-A-T signals.
  // Helps AI search (Perplexity, Google AI Overviews) attribute expertise.
  const aboutPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${config.siteUrl}/about#aboutpage`,
    url: `${config.siteUrl}/about`,
    name: `About ${brandName}`,
    description: missionLong || missionText,
    isPartOf: { '@id': `${config.siteUrl}/#website` },
    mainEntity: { '@id': `${config.siteUrl}/#organization` },
  }
  const personSchemas = (authors || []).map((a, i) => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${config.siteUrl}/about#person-${a.slug || i}`,
    name: a.name,
    description: a.bio || undefined,
    image: a.profile_image_url || undefined,
    url: `${config.siteUrl}/about`,
    worksFor: { '@id': `${config.siteUrl}/#organization` },
  }))

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }} />
      {personSchemas.map((s, i) => (
        <script key={`p-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
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
          {missionLong ? (
            splitParas(missionLong).map((p, i) => (
              <p key={`m-${i}`} style={{ margin: '0 0 16px' }}>{p}</p>
            ))
          ) : (
            <>
              <p style={{ margin: '0 0 16px' }}>{missionText}</p>
              {brand.guidelines?.brand_personality && (
                <p style={{ margin: '0 0 16px' }}>{brand.guidelines.brand_personality}</p>
              )}
            </>
          )}
        </div>

        {/* Founder Story (provisioner-seeded) */}
        {founderStory && (
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
                marginBottom: '20px',
              }}
            >
              {founderSectionHeader}
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', color: '#333', lineHeight: 1.8 }}>
              {splitParas(founderStory).map((p, i) => (
                <p key={`f-${i}`} style={{ margin: '0 0 16px' }}>{p}</p>
              ))}
            </div>
          </section>
        )}

        {/* Philosophy + Immutable Rules (provisioner-seeded) */}
        {(philosophy || immutableRules) && (
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
                marginBottom: '20px',
              }}
            >
              {philosophySectionHeader}
            </div>
            {philosophy && (
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', color: '#333', lineHeight: 1.8, marginBottom: 24 }}>
                {splitParas(philosophy).map((p, i) => (
                  <p key={`p-${i}`} style={{ margin: '0 0 16px' }}>{p}</p>
                ))}
              </div>
            )}
            {immutableRules && immutableRules.length > 0 && (
              <ol style={{ paddingLeft: 20, fontFamily: 'var(--font-heading)', fontSize: '14px', color: '#333', lineHeight: 1.7 }}>
                {immutableRules.map((rule, i) => (
                  <li key={`r-${i}`} style={{ marginBottom: 12 }}>
                    <strong>{rule.title}.</strong> {rule.body}
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

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
