import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'

export default async function StructuredData() {
  const config = getTenantConfig()
  let brandName = config.siteName
  let description = ''
  let logoUrl = `${config.siteUrl}/favicon.svg`
  let socialLinks: string[] = []

  try {
    const brand = await getBrandData()
    brandName = brand.guidelines?.name || config.siteName
    description = brand.company?.blurb || brand.guidelines?.brand_personality || ''
    if (brand.specs?.logo_url) logoUrl = brand.specs.logo_url

    const socials = brand.guidelines?.author_social_urls
    if (socials && typeof socials === 'object') {
      socialLinks = Object.values(socials).filter(Boolean)
    }
  } catch {
    // Fall back to env config
  }

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${config.siteUrl}/#organization`,
    name: brandName,
    url: config.siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
      width: '180',
      height: '180',
    },
    ...(socialLinks.length > 0 && { sameAs: socialLinks }),
    ...(description && { description }),
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${config.siteUrl}/#website`,
    url: config.siteUrl,
    name: brandName,
    ...(description && { description }),
    publisher: {
      '@id': `${config.siteUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${config.siteUrl}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
