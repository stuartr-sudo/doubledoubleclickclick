import Link from 'next/link'
import Image from 'next/image'
import { getPostBySlug, getPublishedPosts, getPostDate } from '@/lib/posts'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import BlogCarousel from '@/components/BlogCarousel'
import BlogTracker from '@/components/BlogTracker'
import ContactForm from '@/components/ContactForm'
import ArticleReactions from '@/components/ArticleReactions'
import ArticleComments from '@/components/ArticleComments'
import RelatedPosts from '@/components/RelatedPosts'
import SiteHeader from '@/components/SiteHeader'

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
    articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.meta_description || post.excerpt || '',
      image: post.featured_image || '',
      datePublished: getPostDate(post),
      dateModified: post.updated_date || getPostDate(post),
      author: {
        '@type': 'Person',
        name: post.author || brand.guidelines?.default_author || brandName,
        url: baseUrl,
      },
      publisher: {
        '@type': 'Organization',
        name: brandName,
        logo: {
          '@type': 'ImageObject',
          url: brand.specs?.logo_url || `${baseUrl}/favicon.svg`,
        },
      },
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
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${baseUrl}/blog/${post.slug}` },
    ],
  }

  // Fetch posts for carousel
  const carouselPosts = await getPublishedPosts(12)

  // CTA colors from brand specs
  const ctaBgColor = brand.specs?.primary_color || '#000000'
  const ctaTextColor = brand.specs?.secondary_color || '#ffffff'

  return (
    <>
      <SiteHeader logoText={brandName} logoImage={brand.specs?.logo_url || undefined} />
      <main>
        <BlogTracker slug={post.slug} title={post.title} category={post.category || undefined} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />

        <article className="blog-post">
          <div className="container">
            <div className="blog-post-header">
              <Link href="/blog" className="back-link">
                &larr; Back to Blog
              </Link>
              <h1 className="blog-post-title">{post.title}</h1>
              <div className="blog-post-meta">
                <time dateTime={getPostDate(post)}>
                  {new Date(getPostDate(post)).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                {post.tags && post.tags.length > 0 && (
                  <div className="blog-post-tags">
                    {post.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {post.featured_image && (
              <div className="blog-post-image">
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  loading="eager"
                  width={1200}
                  height={600}
                  style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
                />
              </div>
            )}

            <div
              className="blog-post-content"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />

            <div className="blog-post-cta">
              <Link
                href="/contact"
                className="blog-post-cta-button"
                style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
              >
                Contact Us
              </Link>
            </div>

            <ArticleReactions />
            <ArticleComments postSlug={post.slug} />
          </div>
        </article>

        <RelatedPosts currentPostId={post.id} category={post.category || 'General'} />

        {carouselPosts.length > 0 && (
          <BlogCarousel posts={carouselPosts} title="More Posts" />
        )}

        <ContactForm />
      </main>
    </>
  )
}
