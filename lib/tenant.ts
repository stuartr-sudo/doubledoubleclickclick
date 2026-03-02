/**
 * Tenant configuration - reads from environment variables set per-deployment.
 * Every deployed site gets its own NEXT_PUBLIC_BRAND_USERNAME.
 */

export interface TenantConfig {
  username: string
  siteUrl: string
  siteName: string
  contactEmail: string
  contactPhone: string
  gtmId: string
  gaId: string
}

export function getTenantConfig(): TenantConfig {
  // Non-prefixed env vars are read at runtime; NEXT_PUBLIC_ versions get inlined
  // at build time by Next.js so they can't vary per deployment.
  const username = process.env.BRAND_USERNAME || process.env.NEXT_PUBLIC_BRAND_USERNAME || ''

  return {
    username,
    siteUrl: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || (username ? `https://www.${username}.com` : 'http://localhost:3000'),
    siteName: process.env.SITE_NAME || process.env.NEXT_PUBLIC_SITE_NAME || username || 'Site',
    contactEmail: process.env.CONTACT_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || (username ? `contact@${username}.com` : ''),
    contactPhone: process.env.CONTACT_PHONE || process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
    gtmId: process.env.GTM_ID || process.env.NEXT_PUBLIC_GTM_ID || '',
    gaId: process.env.GA_ID || process.env.NEXT_PUBLIC_GA_ID || '',
  }
}
