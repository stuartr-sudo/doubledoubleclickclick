import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Prefer explicit canonical URL, fall back to Vercel-provided hostname.
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.sewo.io')
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-pages.xml`,
      `${baseUrl}/sitemap-services.xml`,
      `${baseUrl}/sitemap-blog.xml`,
    ],
  }
}

