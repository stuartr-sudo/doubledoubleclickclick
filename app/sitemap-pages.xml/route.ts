import { NextResponse } from 'next/server'
import { getTenantConfig } from '@/lib/tenant'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

/**
 * Sitemap of all static + tenant-custom pages.
 *
 * Default routes (always present): /, /blog, /about, /contact, /privacy, /terms
 * Custom routes (tenant-defined): all keys under app_settings.static_pages.
 *   {username}.custom_pages — e.g. for TVW: /school /apothecary /gathering /community /resources
 */
export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin
  const lastmod = new Date().toISOString()

  // Default static routes
  const urls: Array<{ loc: string; changefreq: string; priority: string }> = [
    { loc: baseUrl, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/blog`, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: '0.8' },
    { loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: '0.8' },
    { loc: `${baseUrl}/privacy`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${baseUrl}/terms`, changefreq: 'monthly', priority: '0.5' },
  ]

  // Tenant-specific custom pages from app_settings
  try {
    const config = getTenantConfig()
    if (config.username) {
      const supabase = createServiceClient()
      const { data } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_name', `static_pages:${config.username}`)
        .maybeSingle()
      const sv = (data?.setting_value as Record<string, unknown>) || null
      const customPages = (sv?.custom_pages as Record<string, unknown>) || null
      if (customPages && typeof customPages === 'object') {
        for (const slug of Object.keys(customPages)) {
          if (slug && /^[a-z0-9-]+$/i.test(slug)) {
            urls.push({
              loc: `${baseUrl}/${slug}`,
              changefreq: 'monthly',
              priority: '0.7',
            })
          }
        }
      }
    }
  } catch {
    // Fail open — static routes still ship
  }

  const urlEntries = urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urlEntries}

</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
