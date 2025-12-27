import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Script from 'next/script'
import BlogCarousel from '@/components/BlogCarousel'
import BlogTracker from '@/components/BlogTracker'
import BlogQuizCTA from '@/components/BlogQuizCTA'
import ContactForm from '@/components/ContactForm'
import ArticleReactions from '@/components/ArticleReactions'
import ArticleComments from '@/components/ArticleComments'
import RelatedPosts from '@/components/RelatedPosts'
import SiteHeader from '@/components/SiteHeader'

const demoPosts = [
  {
    slug: 'how-to-build-a-startup-from-scratch',
    title: 'How to build a startup from scratch',
    meta_title: 'How to build a startup from scratch',
    meta_description: 'A practical walkthrough on validating ideas, building the first version, and reaching product‑market fit.',
    featured_image: null,
    published_date: null,
    created_date: '2025-01-01',
    updated_date: '2025-01-01',
    author: 'SEWO',
    tags: [],
    content: '<p>Demo content for startup growth.</p>',
    category: 'Business',
    generated_llm_schema: null,
  },
  {
    slug: 'mastering-the-art-of-pitching-your-business-idea',
    title: 'Mastering the art of pitching your business idea',
    meta_title: 'Mastering the art of pitching your business idea',
    meta_description: 'Structure, narrative, and visuals that make investors and customers say yes.',
    featured_image: null,
    published_date: null,
    created_date: '2025-01-01',
    updated_date: '2025-01-01',
    author: 'SEWO',
    tags: [],
    content: '<p>Demo content for pitching.</p>',
    category: 'Business',
    generated_llm_schema: null,
  },
  {
    slug: 'turning-your-passion-into-a-full-time-career',
    title: 'Turning your passion into a full‑time career',
    meta_title: 'Turning your passion into a full‑time career',
    meta_description: 'Playbooks for creators to monetize, build audience, and scale sustainably.',
    featured_image: null,
    published_date: null,
    created_date: '2025-01-01',
    updated_date: '2025-01-01',
    author: 'SEWO',
    tags: [],
    content: '<p>Demo content for careers.</p>',
    category: 'Lifestyle',
    generated_llm_schema: null,
  },
  {
    slug: 'the-latest-tech-trends-every-creator-should-know',
    title: 'The latest tech trends every creator should know',
    meta_title: 'The latest tech trends every creator should know',
    meta_description: 'From AI tools to new platforms—what matters this year and how to adapt fast.',
    featured_image: null,
    published_date: null,
    created_date: '2025-01-01',
    updated_date: '2025-01-01',
    author: 'SEWO',
    tags: [],
    content: '<p>Demo content for tech trends.</p>',
    category: 'Tech',
    generated_llm_schema: null,
  },
]

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let post: any = null

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_posts')
      .select('title, meta_title, meta_description, featured_image, published_date, created_date, author, tags')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()
    post = data
  } catch (error) {
    post = demoPosts.find(p => p.slug === params.slug)
  }

  if (!post) {
    post = demoPosts.find(p => p.slug === params.slug)
  }

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The blog post you are looking for does not exist.',
    }
  }

  // SEO: Use meta_title for <title> tag if available, otherwise fallback to regular title
  const seoTitle = (post as any).meta_title || (post as any).title
  const description = (post as any).meta_description || ''
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sewo.io'
  const url = `${baseUrl}/blog/${params.slug}`

  return {
    title: seoTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: seoTitle,
      description,
      type: 'article',
      url: url,
      images: (post as any).featured_image ? [
        {
          url: (post as any).featured_image,
          width: 1200,
          height: 630,
          alt: seoTitle,
        }
      ] : [],
      publishedTime: (post as any).published_date || (post as any).created_date,
      authors: [(post as any).author || 'SEWO'],
      tags: (post as any).tags || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description,
      images: (post as any).featured_image ? [(post as any).featured_image] : [],
    },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  let post: any = null
  let homepageContent: any = null

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_posts')
      .select('*')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()
    post = data

    // Fetch homepage content for quiz styling
    const { data: hpContent } = await supabase
      .from('homepage_content')
      .select('quiz_cta_bg_color, quiz_description, quiz_cta_text, hero_cta_bg_color, hero_cta_text_color, quiz_cta_border_color')
      .single()
    homepageContent = hpContent
  } catch (error) {
    console.error('Error fetching post:', error)
  }

  // Fallback to demo posts if database is empty
  if (!post) {
    post = demoPosts.find(p => p.slug === params.slug)
    
    if (!post) {
      notFound()
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sewo.io'
  
  // JSON-LD structured data for the article
  // Use generated_llm_schema if provided, otherwise create default schema
  let articleJsonLd
  if (post.generated_llm_schema) {
    try {
      articleJsonLd = JSON.parse(post.generated_llm_schema)
    } catch (e) {
      console.error('Error parsing generated_llm_schema:', e)
    }
  }

  if (!articleJsonLd) {
    articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.meta_description || '',
      image: post.featured_image || '',
      datePublished: post.published_date || post.created_date,
      dateModified: post.updated_date || post.published_date || post.created_date,
      author: {
        '@type': 'Person',
        name: post.author || 'SEWO Editorial Team',
        url: baseUrl,
      },
      publisher: {
        '@type': 'Organization',
        name: 'SEWO',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/favicon.svg`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/blog/${post.slug}`,
      },
    }
  }

  // Breadcrumb Schema
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${baseUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${baseUrl}/blog/${post.slug}`,
      },
    ],
  }

  return (
    <>
      <SiteHeader />
      <main>
        {/* Analytics Tracking */}
      <BlogTracker slug={post.slug} title={post.title} category={post.category} />
      
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      
      {/* Blog Post */}
      <article className="blog-post">
        <div className="container">
          <div className="blog-post-header">
            <Link href="/blog" className="back-link">
              ← Back to Blog
            </Link>
            {/* Main title - displays post.title (NOT meta_title) */}
            <h1 className="blog-post-title">{post.title}</h1>
            <div className="blog-post-meta">
              <time dateTime={post.published_date || post.created_date}>
                {new Date(post.published_date || post.created_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
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

          {/* Article Reactions */}
          <ArticleReactions />

          {/* Comments Section */}
          <ArticleComments postSlug={post.slug} />
        </div>
      </article>

      {/* Related Posts Section */}
      <RelatedPosts currentPostId={post.id} category={post.category || 'General'} />

      {/* Quiz CTA Section */}
      <BlogQuizCTA
        quizCtaBgColor={homepageContent?.quiz_cta_bg_color || '#f8f9fa'}
        quizDescription={homepageContent?.quiz_description || 'Discover how visible your brand is to AI assistants like ChatGPT, Claude, and Gemini in just 3 minutes.'}
        quizCTAText={homepageContent?.quiz_cta_text || 'Start Quiz →'}
        heroCTABgColor={homepageContent?.hero_cta_bg_color || '#000000'}
        heroCTATextColor={homepageContent?.hero_cta_text_color || '#ffffff'}
        quizCTABorderColor={homepageContent?.quiz_cta_border_color || '#000000'}
      />

      {/* Blog Carousel */}
      <BlogCarousel />

      {/* Contact Form */}
      <ContactForm />
    </main>
  )
}

