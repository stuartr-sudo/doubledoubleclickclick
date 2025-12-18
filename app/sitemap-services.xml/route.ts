import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  
  <!-- Service Plans & Solutions -->
  
  <!-- Agencies - White-label Ai optimization for agencies -->
  <url>
    <loc>${baseUrl}/agencies</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Enterprise - Custom Ai visibility solutions for large organizations -->
  <url>
    <loc>${baseUrl}/enterprise</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Premium Managed Service (Beta) - Done-for-you Ai visibility optimization -->
  <url>
    <loc>${baseUrl}/beta</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Course - Team training for Ai ranking -->
  <url>
    <loc>${baseUrl}/course</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Guide - The Ai Ranking Playbook -->
  <url>
    <loc>${baseUrl}/guide</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

