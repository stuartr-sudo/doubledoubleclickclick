import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/SiteHeader'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AuthorPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: author } = await supabase
    .from('authors')
    .select('slug, name, bio, linkedin_url, avatar_url')
    .eq('slug', params.slug)
    .single()

  if (!author) notFound()

  const { data: posts } = await supabase
    .from('site_posts')
    .select('id, slug, title, meta_description, featured_image, published_date, created_date, tags')
    .eq('status', 'published')
    .eq('author', author.name)
    .order('published_date', { ascending: false })
    .limit(50)

  return (
    <>
      <SiteHeader />
      <main>
        <section className="author-hero">
        <div className="container author-hero-inner">
          <div className="author-avatar">
            {author.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={author.name}
                width={120}
                height={120}
                style={{ objectFit: 'cover', borderRadius: '999px' }}
              />
            ) : (
              <div className="author-avatar-fallback">{author.name?.slice(0, 1)?.toUpperCase()}</div>
            )}
          </div>
          <div className="author-meta">
            <h1 className="author-name">{author.name}</h1>
            {author.bio && <p className="author-bio">{author.bio}</p>}
            <div className="author-links">
              {author.linkedin_url && (
                <a className="btn btn-secondary" href={author.linkedin_url} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              )}
              <Link className="btn btn-secondary" href="/blog">View all posts</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="author-posts">
        <div className="container">
          <h2 className="author-posts-title">Posts by {author.name}</h2>
          <div className="blog-grid">
            {(posts || []).map((post: any) => (
              <Link key={post.id} href={`/blog/${post.slug || post.id}`} className="blog-card">
                {post.featured_image && (
                  <div className="blog-card-image">
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      width={600}
                      height={340}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  </div>
                )}
                <div className="blog-card-content">
                  <div className="blog-card-meta">
                    <span className="blog-card-date">
                      {new Date(post.published_date || post.created_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="blog-card-title">{post.title}</h3>
                  {post.meta_description && <p className="blog-card-excerpt">{post.meta_description}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
    </>
  )
}

