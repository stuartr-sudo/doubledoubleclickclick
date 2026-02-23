import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getTenantConfig } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin
  const config = getTenantConfig()

  let blogEntries = ''

  try {
    const supabase = createServiceClient()
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, title, meta_description, updated_date, created_date, published_date, category')
      .eq('user_name', config.username)
      .eq('status', 'published')
      .order('created_date', { ascending: false })

    if (posts && posts.length > 0) {
      const validPosts = posts.filter(post => post.slug && post.slug !== 'null')

      blogEntries = validPosts.map((post) => {
        const lastmod = post.updated_date || post.published_date || post.created_date
        return `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      }).join('')
    }
  } catch (error) {
    console.error('Error generating blog sitemap:', error)
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${blogEntries || '<!-- No published blog posts yet -->'}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
