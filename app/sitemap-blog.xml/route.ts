import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin
  
  let blogEntries = ''
  
  try {
    const supabase = await createClient()
    const { data: posts } = await supabase
      .from('site_posts')
      .select('slug, title, meta_description, updated_date, created_date, published_date, category')
      .eq('status', 'published')
      .order('created_date', { ascending: false })

    if (posts && posts.length > 0) {
      // Filter out posts with null slugs
      const validPosts = posts.filter(post => post.slug && post.slug !== 'null')
      
      blogEntries = validPosts.map((post) => {
        const lastmod = post.updated_date || post.published_date || post.created_date
        const description = post.meta_description || post.title
        const category = post.category || 'General'
        
        return `
  <!-- ${post.title} - ${category} -->
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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  
  <!-- Blog Articles - Ai optimization insights, guides, and best practices -->
  ${blogEntries || '<!-- No published blog posts yet -->'}

</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

