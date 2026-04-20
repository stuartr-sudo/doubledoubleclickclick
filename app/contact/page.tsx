import type { Metadata } from 'next'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import ContactForm from './ContactForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const config = getTenantConfig()
  return {
    title: `Contact | ${config.siteName}`,
    description: `Get in touch with ${config.siteName}.`,
  }
}

export default async function ContactPage() {
  const config = getTenantConfig()
  let brandName = config.siteName

  try {
    const brand = await getBrandData()
    brandName = brand.guidelines?.name || config.siteName
  } catch {}

  const contactEmail = config.contactEmail || 'contact@example.com'
  const contactPhone = config.contactPhone || ''

  // Schema.org ContactPage + BreadcrumbList for SEO
  const contactPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${config.siteUrl}/contact#contactpage`,
    url: `${config.siteUrl}/contact`,
    name: `Contact ${brandName}`,
    description: `Get in touch with ${brandName}.`,
    isPartOf: { '@id': `${config.siteUrl}/#website` },
    mainEntity: { '@id': `${config.siteUrl}/#organization` },
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: config.siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: `${config.siteUrl}/contact` },
    ],
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {/* Page Header */}
      <header
        style={{
          padding: '32px 32px 24px',
          borderBottom: '1px solid var(--color-border)',
          maxWidth: '780px',
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
          Contact
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
          Get in Touch
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
          Have a question, story tip, or partnership inquiry? We&apos;d love to hear from you.
        </p>
      </header>

      {/* Form + Info */}
      <div
        style={{
          padding: '32px',
          maxWidth: '780px',
        }}
      >
        <ContactForm contactEmail={contactEmail} contactPhone={contactPhone} />
      </div>
    </main>
  )
}
