import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getTenantConfig } from '@/lib/tenant'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Author profile page — one per author slug.
 *
 * Why this exists: E-E-A-T (Experience, Expertise, Authoritativeness,
 * Trustworthiness) is the single biggest SEO + AEO signal for content
 * sites. A dedicated Person URL with all the author's articles:
 *   - Lets Google verify authorship (author entity linking)
 *   - Gives AI search engines one canonical place to cite
 *   - Surfaces the author's credentials + bio as Q&A context
 *
 * Reads: authors + blog_posts for the current tenant.
 */

interface Author {
  name: string
  slug: string | null
  bio: string | null
  profile_image_url: string | null
  linkedin_url: string | null
}

interface AuthorPost {
  slug: string
  title: string
  excerpt?: string | null
  featured_image?: string | null
  published_date?: string | null
  created_date?: string | null
}

async function loadAuthor(slug: string): Promise<Author | null> {
  const config = getTenantConfig()
  if (!config.username) return null
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('authors')
      .select('name, slug, bio, profile_image_url, linkedin_url')
      .eq('user_name', config.username)
      .eq('slug', slug)
      .maybeSingle()
    return (data as Author) || null
  } catch {
    return null
  }
}

async function loadAuthorPosts(authorName: string): Promise<AuthorPost[]> {
  const config = getTenantConfig()
  if (!config.username) return []
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('blog_posts')
      .select('slug, title, excerpt, featured_image, published_date, created_date')
      .eq('user_name', config.username)
      .eq('status', 'published')
      .eq('author', authorName)
      .order('published_date', { ascending: false, nullsFirst: false })
      .limit(30)
    return (data as AuthorPost[]) || []
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const author = await loadAuthor(params.slug)
  if (!author) return { title: 'Author not found' }
  const config = getTenantConfig()
  return {
    title: `${author.name} | ${config.siteName}`,
    description: author.bio || `Articles by ${author.name} on ${config.siteName}.`,
    alternates: { canonical: `${config.siteUrl}/authors/${author.slug}` },
    openGraph: {
      type: 'profile',
      title: `${author.name} — ${config.siteName}`,
      description: author.bio || undefined,
      url: `${config.siteUrl}/authors/${author.slug}`,
      ...(author.profile_image_url && {
        images: [{ url: author.profile_image_url, alt: author.name }],
      }),
    },
  }
}

export default async function AuthorPage({ params }: { params: { slug: string } }) {
  const author = await loadAuthor(params.slug)
  if (!author) notFound()
  const config = getTenantConfig()
  const posts = await loadAuthorPosts(author.name)

  const authorUrl = `${config.siteUrl}/authors/${author.slug}`
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${authorUrl}#person`,
    name: author.name,
    description: author.bio || undefined,
    image: author.profile_image_url || undefined,
    url: authorUrl,
    ...(author.linkedin_url && { sameAs: [author.linkedin_url] }),
    worksFor: { '@id': `${config.siteUrl}/#organization` },
    mainEntityOfPage: authorUrl,
  }
  const profilePageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${authorUrl}#profilepage`,
    url: authorUrl,
    name: author.name,
    mainEntity: { '@id': `${authorUrl}#person` },
    isPartOf: { '@id': `${config.siteUrl}/#website` },
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: config.siteUrl },
      { '@type': 'ListItem', position: 2, name: 'About', item: `${config.siteUrl}/about` },
      { '@type': 'ListItem', position: 3, name: author.name, item: authorUrl },
    ],
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <article style={{ maxWidth: 720, margin: '0 auto', padding: '48px 16px 64px' }}>
        <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 40 }}>
          {author.profile_image_url && (
            <div style={{
              position: 'relative',
              width: 120,
              height: 120,
              borderRadius: '50%',
              overflow: 'hidden',
              marginBottom: 20,
              border: '1px solid var(--color-border)',
            }}>
              <Image
                src={author.profile_image_url}
                alt={author.name}
                fill
                sizes="120px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
          <h1 style={{
            fontFamily: 'var(--font-heading, Georgia, serif)',
            fontSize: 32,
            fontWeight: 400,
            fontStyle: 'italic',
            margin: '0 0 12px',
            lineHeight: 1.2,
            color: 'var(--color-text, #1a1a1a)',
          }}>
            {author.name}
          </h1>
          {author.bio && (
            <p style={{
              fontSize: 16,
              color: 'var(--color-text-secondary, #666)',
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 560,
            }}>
              {author.bio}
            </p>
          )}
        </header>

        {posts.length > 0 && (
          <section>
            <h2 style={{
              fontFamily: 'var(--font-sans, system-ui)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted, #999)',
              paddingBottom: 8,
              borderBottom: '1px solid var(--color-border, #e5e5e5)',
              marginBottom: 20,
            }}>
              Articles by {author.name}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {posts.map((post) => (
                <li key={post.slug} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--color-border-light, #f2ece5)' }}>
                  <Link
                    href={`/blog/${post.slug}`}
                    style={{
                      textDecoration: 'none',
                      color: 'var(--color-text, #1a1a1a)',
                    }}
                  >
                    <h3 style={{
                      fontFamily: 'var(--font-heading, Georgia, serif)',
                      fontSize: 18,
                      fontWeight: 600,
                      margin: '0 0 6px',
                    }}>
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p style={{
                        fontSize: 14,
                        color: 'var(--color-text-secondary, #666)',
                        lineHeight: 1.6,
                        margin: 0,
                      }}>
                        {post.excerpt}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {posts.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted, #999)', fontStyle: 'italic' }}>
            Articles by {author.name} are on their way.
          </p>
        )}
      </article>
    </main>
  )
}
