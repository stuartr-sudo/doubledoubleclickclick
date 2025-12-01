import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Script from 'next/script'
import BlogCarousel from '@/components/BlogCarousel'
import BlogTracker from '@/components/BlogTracker'
import BlogQuizCTA from '@/components/BlogQuizCTA'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let post = null

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('blog_posts')
      .select('title, meta_title, meta_description')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()
    post = data
  } catch (error) {
    // Fallback to demo posts
    const demoPosts = [
      {
        slug: 'how-to-build-a-startup-from-scratch',
        title: 'How to build a startup from scratch',
        meta_title: 'How to build a startup from scratch',
        meta_description: 'A practical walkthrough on validating ideas, building the first version, and reaching product‑market fit.',
      },
      {
        slug: 'mastering-the-art-of-pitching-your-business-idea',
        title: 'Mastering the art of pitching your business idea',
        meta_title: 'Mastering the art of pitching your business idea',
        meta_description: 'Structure, narrative, and visuals that make investors and customers say yes.',
      },
      {
        slug: 'turning-your-passion-into-a-full-time-career',
        title: 'Turning your passion into a full‑time career',
        meta_title: 'Turning your passion into a full‑time career',
        meta_description: 'Playbooks for creators to monetize, build audience, and scale sustainably.',
      },
      {
        slug: 'the-latest-tech-trends-every-creator-should-know',
        title: 'The latest tech trends every creator should know',
        meta_title: 'The latest tech trends every creator should know',
        meta_description: 'From AI tools to new platforms—what matters this year and how to adapt fast.',
      },
    ]
    post = demoPosts.find(p => p.slug === params.slug)
  }

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The blog post you are looking for does not exist.',
    }
  }

  const title = post.meta_title || post.title
  const description = post.meta_description || ''
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sewo.io'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${baseUrl}/blog/${params.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  let post = null
  let homepageContent = null

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('blog_posts')
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
    const demoPosts = [
      {
        id: 'demo-1',
        title: 'How to build a startup from scratch',
        slug: 'how-to-build-a-startup-from-scratch',
        content: '<h2>Building Your Startup</h2><p>A practical walkthrough on validating ideas, building the first version, and reaching product‑market fit. This guide will help you navigate the challenging early stages of startup development.</p><h3>Key Steps</h3><ul><li>Validate your idea with real customers</li><li>Build an MVP quickly</li><li>Iterate based on feedback</li><li>Focus on product-market fit</li></ul>',
        meta_description: 'A practical walkthrough on validating ideas, building the first version, and reaching product‑market fit.',
        featured_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1600&auto=format&fit=crop',
        created_date: new Date().toISOString(),
        category: 'Tech',
        tags: ['startup', 'entrepreneurship', 'mvp'],
      },
      {
        id: 'demo-2',
        title: 'Mastering the art of pitching your business idea',
        slug: 'mastering-the-art-of-pitching-your-business-idea',
        content: '<h2>The Perfect Pitch</h2><p>Structure, narrative, and visuals that make investors and customers say yes. Learn how to craft a compelling story that resonates with your audience.</p><h3>Pitch Essentials</h3><ul><li>Start with a hook</li><li>Define the problem clearly</li><li>Present your solution</li><li>Show traction and metrics</li><li>End with a clear ask</li></ul>',
        meta_description: 'Structure, narrative, and visuals that make investors and customers say yes.',
        featured_image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop',
        created_date: new Date(Date.now() - 86400000 * 3).toISOString(),
        category: 'Entrepreneurship',
        tags: ['pitching', 'investors', 'fundraising'],
      },
      {
        id: 'demo-3',
        title: 'Turning your passion into a full‑time career',
        slug: 'turning-your-passion-into-a-full-time-career',
        content: '<h2>From Passion to Profession</h2><p>Playbooks for creators to monetize, build audience, and scale sustainably. This comprehensive guide will show you how to turn what you love into a thriving business.</p><h3>The Creator Journey</h3><ul><li>Find your niche</li><li>Build an engaged audience</li><li>Diversify income streams</li><li>Scale your content</li><li>Maintain work-life balance</li></ul><h3>Monetization Strategies</h3><p>Multiple revenue streams are key to sustainable creator businesses. Consider courses, consulting, sponsorships, and digital products.</p>',
        meta_description: 'Playbooks for creators to monetize, build audience, and scale sustainably.',
        featured_image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1600&auto=format&fit=crop',
        created_date: new Date(Date.now() - 86400000 * 7).toISOString(),
        category: 'Creator',
        tags: ['creator-economy', 'monetization', 'passion'],
      },
      {
        id: 'demo-4',
        title: 'The latest tech trends every creator should know',
        slug: 'the-latest-tech-trends-every-creator-should-know',
        content: '<h2>Tech Trends for Creators</h2><p>From AI tools to new platforms—what matters this year and how to adapt fast.</p><h3>Top Trends</h3><ul><li>AI-powered content creation</li><li>Web3 and NFTs</li><li>Live streaming platforms</li><li>Creator DAOs</li></ul>',
        meta_description: 'From AI tools to new platforms—what matters this year and how to adapt fast.',
        featured_image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1600&auto=format&fit=crop',
        created_date: new Date(Date.now() - 86400000 * 10).toISOString(),
        category: 'Tech',
        tags: ['technology', 'trends', 'ai'],
      },
    ]

    post = demoPosts.find(p => p.slug === params.slug)
    
    if (!post) {
      notFound()
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sewo.io'
  
  // JSON-LD structured data for the article
  // Use generated_llm_schema if provided, otherwise create default schema
  let jsonLd
  if (post.generated_llm_schema) {
    try {
      jsonLd = JSON.parse(post.generated_llm_schema)
    } catch (e) {
      console.error('Error parsing generated_llm_schema:', e)
      // Fallback to default schema
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.meta_description || '',
        image: post.featured_image || '',
        datePublished: post.created_date,
        dateModified: post.updated_date || post.created_date,
        author: {
          '@type': 'Organization',
          name: post.author || 'SEWO',
          url: baseUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: 'SEWO',
          url: baseUrl,
        },
      }
    }
  } else {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.meta_description || '',
      image: post.featured_image || '',
      datePublished: post.created_date,
      dateModified: post.updated_date || post.created_date,
      author: {
        '@type': 'Organization',
        name: post.author || 'SEWO',
        url: baseUrl,
      },
      publisher: {
        '@type': 'Organization',
        name: 'SEWO',
        url: baseUrl,
      },
    }
  }

  return (
    <main>
      {/* Analytics Tracking */}
      <BlogTracker slug={post.slug} title={post.title} category={post.category} />
      
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Header */}
      <header className="header">
        <div className="container">
          <nav className="nav">
            <Link href="/" className="logo">
              SEWO
            </Link>
            <div className="nav-links">
              <Link href="/">Home</Link>
              <Link href="/blog">Blog</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Blog Post */}
      <article className="blog-post">
        <div className="container">
          <div className="blog-post-header">
            <Link href="/blog" className="back-link">
              ← Back to Blog
            </Link>
            <h1 className="blog-post-title">{post.title}</h1>
            <div className="blog-post-meta">
              <time dateTime={post.created_date}>
                {new Date(post.created_date).toLocaleDateString('en-US', {
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
              <img 
                src={post.featured_image} 
                alt={post.title}
                loading="eager"
                width={1200}
                height={600}
              />
            </div>
          )}

          <div 
            className="blog-post-content"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />
        </div>
      </article>

      {/* Quiz CTA Section */}
      <BlogQuizCTA
        quizCtaBgColor={homepageContent?.quiz_cta_bg_color || '#f8f9fa'}
        quizDescription={homepageContent?.quiz_description || 'Discover how visible your brand is to AI assistants like ChatGPT, Claude, and Gemini in just 3 minutes.'}
        quizCTAText={homepageContent?.quiz_cta_text || 'Start Quiz →'}
        heroCTABgColor={homepageContent?.hero_cta_bg_color || '#000000'}
        heroCTATextColor={homepageContent?.hero_cta_text_color || '#ffffff'}
        quizCTABorderColor={homepageContent?.quiz_cta_border_color || '#000000'}
      />

      {/* ScoreApp Quiz Script */}
      <Script
        src="https://static.scoreapp.com/js/integration/v1/embedding.js?v=PtHIIH"
        strategy="afterInteractive"
      />

      {/* Blog Carousel */}
      <BlogCarousel />

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} SEWO. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}

