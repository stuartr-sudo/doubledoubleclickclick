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
  const username = process.env.NEXT_PUBLIC_BRAND_USERNAME || ''

  return {
    username,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || (username ? `https://www.${username}.com` : 'http://localhost:3000'),
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || username || 'Site',
    contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || (username ? `contact@${username}.com` : ''),
    contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
    gtmId: process.env.NEXT_PUBLIC_GTM_ID || '',
    gaId: process.env.NEXT_PUBLIC_GA_ID || '',
  }
}
