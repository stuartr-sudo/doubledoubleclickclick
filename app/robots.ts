import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Prefer explicit canonical URL, fall back to Vercel-provided hostname.
  // Also normalize to our canonical host (www) to avoid sitemap URLs redirecting.
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.sewo.io')

  let baseUrl = rawBaseUrl
  try {
    const u = new URL(rawBaseUrl)
    if (u.hostname === 'sewo.io') {
      u.hostname = 'www.sewo.io'
      u.protocol = 'https:'
      baseUrl = u.origin
    } else {
      baseUrl = u.origin
    }
  } catch {
    // If parsing fails, keep rawBaseUrl as-is.
  }
  
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

