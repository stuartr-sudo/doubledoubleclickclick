/**
 * Brand data fetching - reads from Doubleclicker's multi-tenant tables.
 * Replaces the old single-tenant homepage_content table.
 *
 * DB Column Naming (important — not consistent across tables):
 *   brand_guidelines    → uses `user_name`
 *   brand_specifications → uses `user_name`
 *   authors             → uses `user_name`
 *   company_information → uses `username` (different column name, same value)
 */

import { createServiceClient } from '@/lib/supabase/service'
import { getTenantConfig } from '@/lib/tenant'

export interface BrandGuidelines {
  name: string
  website_url: string | null
  voice_and_tone: string | null
  target_market: string | null
  brand_personality: string | null
  tagline?: string | null
  default_author: string | null
  author_bio: string | null
  author_image_url: string | null
  author_url: string | null
  author_social_urls: Record<string, string> | null
}

export interface BrandSpecs {
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  logo_url: string | null
  hero_image_url: string | null
  heading_font: string | null
  body_font: string | null
  border_radius: string | null
  custom_css: string | null
  theme: string | null
}

export interface CompanyInfo {
  client_website: string | null
  email: string | null
  blurb: string | null
  target_market: string | null
}

export interface BrandData {
  guidelines: BrandGuidelines | null
  specs: BrandSpecs | null
  company: CompanyInfo | null
}

export async function getBrandData(): Promise<BrandData> {
  const { username } = getTenantConfig()
  const supabase = createServiceClient()

  const [guidelinesRes, companyRes] = await Promise.all([
    supabase
      .from('brand_guidelines')
      .select(
        `name, website_url, voice_and_tone, target_market,
         brand_personality, tagline, default_author, author_bio,
         author_image_url, author_url, author_social_urls,
         brand_specifications (
           primary_color, secondary_color, accent_color,
           logo_url, hero_image_url, heading_font, body_font,
           border_radius, custom_css, theme
         )`
      )
      .eq('user_name', username)
      .limit(1)
      .single(),
    supabase
      .from('company_information')
      .select('client_website, email, blurb, target_market')
      .eq('username', username)
      .limit(1)
      .single(),
  ])

  const guidelinesData = guidelinesRes.data as any
  const specs = guidelinesData?.brand_specifications
  // brand_specifications is a 1:many relation, take first row
  const specsRow = Array.isArray(specs) ? specs[0] : specs

  return {
    guidelines: guidelinesData
      ? {
          name: guidelinesData.name,
          website_url: guidelinesData.website_url,
          voice_and_tone: guidelinesData.voice_and_tone,
          target_market: guidelinesData.target_market,
          brand_personality: guidelinesData.brand_personality,
          tagline: guidelinesData.tagline,
          default_author: guidelinesData.default_author,
          author_bio: guidelinesData.author_bio,
          author_image_url: guidelinesData.author_image_url,
          author_url: guidelinesData.author_url,
          author_social_urls: guidelinesData.author_social_urls,
        }
      : null,
    specs: specsRow || null,
    company: companyRes.data || null,
  }
}
