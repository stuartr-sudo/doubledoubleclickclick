import { MetadataRoute } from 'next'
import { getTenantConfig } from '@/lib/tenant'

export default function robots(): MetadataRoute.Robots {
  const config = getTenantConfig()
  const baseUrl = config.siteUrl

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
      `${baseUrl}/sitemap-blog.xml`,
    ],
  }
}
