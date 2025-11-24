import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

// Main sitemap index that groups content by type
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sewo.io'
  
  // Return sitemap index pointing to grouped sitemaps
  return [
    {
      url: `${baseUrl}/sitemap-pages.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/sitemap-services.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/sitemap-blog.xml`,
      lastModified: new Date(),
    },
  ]
}
