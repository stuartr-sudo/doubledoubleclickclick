/**
 * Dynamic /llms.txt — per-tenant AI-visibility manifest.
 *
 * Format spec: https://llmstxt.org/
 * Purpose: tells LLMs (ChatGPT, Claude, Perplexity, Google AI Overviews)
 * what this brand is, what it offers, and where to find authoritative
 * source material. Critical for AEO (Answer Engine Optimization).
 *
 * Reads:
 *   - brand_guidelines (name, niche, voice, tagline, author)
 *   - company_information (blurb, contact, website)
 *   - app_settings.static_pages (custom_pages, founder_story, philosophy)
 */

import { NextResponse } from 'next/server'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1 hour

export async function GET() {
  const config = getTenantConfig()
  let brand: Awaited<ReturnType<typeof getBrandData>> | null = null
  try {
    brand = await getBrandData()
  } catch {}

  const brandName = brand?.guidelines?.name || config.siteName
  const tagline = brand?.guidelines?.tagline || ''
  const blurb = brand?.company?.blurb || ''
  const niche = brand?.guidelines?.brand_personality || ''
  const author = brand?.guidelines?.default_author || ''
  const authorBio = brand?.guidelines?.author_bio || ''
  const baseUrl = config.siteUrl

  // Pull static_pages for custom-page links + founder voice
  let customPages: Array<{ slug: string; title: string; subtitle?: string }> = []
  let founderStory = ''
  let philosophy = ''
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_name', `static_pages:${config.username}`)
      .maybeSingle()
    const sv = (data?.setting_value as Record<string, unknown>) || null
    if (sv) {
      const cp = sv.custom_pages as Record<string, { title?: string; subtitle?: string }> | undefined
      if (cp) {
        customPages = Object.entries(cp).map(([slug, p]) => ({
          slug,
          title: p.title || slug,
          subtitle: p.subtitle,
        }))
      }
      if (typeof sv.founder_story === 'string') founderStory = sv.founder_story
      if (typeof sv.philosophy === 'string') philosophy = sv.philosophy
    }
  } catch {}

  // Pull recent published blog posts for "Latest Content" section
  let recentPosts: Array<{ title: string; slug: string; excerpt?: string }> = []
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('blog_posts')
      .select('title, slug, excerpt')
      .eq('user_name', config.username)
      .eq('status', 'published')
      .order('published_date', { ascending: false, nullsFirst: false })
      .limit(20)
    recentPosts = (data || []) as typeof recentPosts
  } catch {}

  // Build the llms.txt content
  const lines: string[] = []
  lines.push(`# ${brandName}`)
  lines.push('')
  if (tagline) lines.push(`> ${tagline}`)
  else if (blurb) lines.push(`> ${blurb}`)
  lines.push('')

  if (blurb && tagline) {
    lines.push(blurb)
    lines.push('')
  }

  if (niche) {
    lines.push(niche)
    lines.push('')
  }

  // Top-level pages
  lines.push('## About')
  lines.push('')
  lines.push(`- [About ${brandName}](${baseUrl}/about): The mission, the philosophy, and the founder behind ${brandName}.`)
  lines.push(`- [Contact](${baseUrl}/contact): Get in touch.`)
  lines.push('')

  // Custom pages
  if (customPages.length > 0) {
    lines.push('## Sections')
    lines.push('')
    for (const p of customPages) {
      const desc = p.subtitle ? `: ${p.subtitle}` : ''
      lines.push(`- [${p.title}](${baseUrl}/${p.slug})${desc}`)
    }
    lines.push('')
  }

  // Founder authority signal (E-E-A-T)
  if (author || authorBio || founderStory) {
    lines.push('## Author / Founder')
    lines.push('')
    if (author) lines.push(`Founder: ${author}`)
    if (authorBio) {
      lines.push('')
      lines.push(authorBio)
    }
    if (founderStory) {
      const summary = founderStory.split(/\n\s*\n/)[0]
      lines.push('')
      lines.push(summary)
    }
    lines.push('')
  }

  // Philosophy / methodology
  if (philosophy) {
    lines.push('## Philosophy / Method')
    lines.push('')
    lines.push(philosophy)
    lines.push('')
  }

  // Latest blog content
  if (recentPosts.length > 0) {
    lines.push('## Latest Articles')
    lines.push('')
    for (const post of recentPosts) {
      const desc = post.excerpt ? `: ${post.excerpt.substring(0, 200)}` : ''
      lines.push(`- [${post.title}](${baseUrl}/blog/${post.slug})${desc}`)
    }
    lines.push('')
  }

  // Reference URLs
  lines.push('## Source Material')
  lines.push('')
  lines.push(`- [Sitemap](${baseUrl}/sitemap.xml)`)
  lines.push(`- [All Blog Posts](${baseUrl}/blog)`)
  if (config.contactEmail) lines.push(`- Contact: ${config.contactEmail}`)
  lines.push('')

  // Optional metadata
  lines.push('## Optional')
  lines.push('')
  lines.push(`- Brand: ${brandName}`)
  if (config.siteUrl) lines.push(`- Website: ${config.siteUrl}`)
  lines.push(`- Last updated: ${new Date().toISOString().split('T')[0]}`)

  const body = lines.join('\n')

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
