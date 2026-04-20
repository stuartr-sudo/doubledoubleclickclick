import { getPostBySlug, getPostDate } from '@/lib/posts'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import BlogTracker from '@/components/BlogTracker'
import { ThemeBlogPost } from '@/components/themes/ThemeRenderer'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const config = getTenantConfig()
  const post = await getPostBySlug(params.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The blog post you are looking for does not exist.',
    }
  }

  const seoTitle = post.meta_title || post.title
  const description = post.meta_description || post.excerpt || ''
  const url = `${config.siteUrl}/blog/${params.slug}`

  return {
    title: seoTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: seoTitle,
      description,
      type: 'article',
      url,
      images: post.featured_image ? [{ url: post.featured_image, width: 1200, height: 630, alt: seoTitle }] : [],
      publishedTime: getPostDate(post),
      tags: post.tags || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description,
      images: post.featured_image ? [post.featured_image] : [],
    },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const config = getTenantConfig()
  const brand = await getBrandData()
  const brandName = brand.guidelines?.name || config.siteName
  const post = await getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  const baseUrl = config.siteUrl
  const theme = brand.specs?.theme || 'editorial'

  // JSON-LD structured data
  let articleJsonLd
  if (post.generated_llm_schema) {
    try {
      const parsedSchema = JSON.parse(post.generated_llm_schema)

      const hasValidFAQContent = (faqSchema: any): boolean => {
        if (faqSchema.mainEntity && Array.isArray(faqSchema.mainEntity) && faqSchema.mainEntity.length > 0) {
          return faqSchema.mainEntity.some((item: any) =>
            item['@type'] === 'Question' &&
            item.name &&
            item.acceptedAnswer &&
            item.acceptedAnswer.text
          )
        }
        return false
      }

      if (parsedSchema['@graph'] && Array.isArray(parsedSchema['@graph'])) {
        const filteredGraph = parsedSchema['@graph'].filter((item: any) => {
          if (item['@type'] === 'FAQPage') return hasValidFAQContent(item)
          return true
        })
        if (filteredGraph.length > 0) {
          parsedSchema['@graph'] = filteredGraph
          articleJsonLd = parsedSchema
        }
      } else if (parsedSchema['@type'] === 'FAQPage') {
        if (hasValidFAQContent(parsedSchema)) articleJsonLd = parsedSchema
      } else {
        articleJsonLd = parsedSchema
      }
    } catch (e) {
      console.error('Error parsing generated_llm_schema:', e)
    }
  }

  if (!articleJsonLd) {
    const authorName = post.author || brand.guidelines?.default_author || brandName
    // Slugify the author name to link to /authors/{slug}.
    const authorSlug = authorName
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    // Word count for the body — helps AI engines size the article.
    const wordCount = post.content
      ? post.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
      : undefined

    articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${baseUrl}/blog/${post.slug}#article`,
      headline: post.title,
      description: post.meta_description || post.excerpt || '',
      image: post.featured_image || brand.specs?.hero_image_url || '',
      datePublished: getPostDate(post),
      dateModified: post.updated_date || getPostDate(post),
      inLanguage: 'en',
      ...(wordCount && { wordCount }),
      ...(post.category && { articleSection: post.category }),
      author: {
        '@type': 'Person',
        name: authorName,
        url: `${baseUrl}/authors/${authorSlug}`,
      },
      publisher: {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: brandName,
        logo: {
          '@type': 'ImageObject',
          url: brand.specs?.logo_url || `${baseUrl}/favicon.svg`,
        },
      },
      isPartOf: { '@id': `${baseUrl}/#website` },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/blog/${post.slug}`,
      },
    }
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      ...(post.category
        ? [{ '@type': 'ListItem', position: 2, name: post.category, item: `${baseUrl}/blog?category=${encodeURIComponent(post.category)}` }]
        : []),
      {
        '@type': 'ListItem',
        position: post.category ? 3 : 2,
        name: post.title,
        item: `${baseUrl}/blog/${post.slug}`,
      },
    ],
  }

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <BlogTracker slug={post.slug} title={post.title} category={post.category || undefined} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ThemeBlogPost theme={theme} brand={brand} post={post} config={config} />
    </main>
  )
}
