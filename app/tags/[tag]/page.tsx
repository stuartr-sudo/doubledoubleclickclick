import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function TagPage({ params }: { params: { tag: string } }) {
  const supabase = await createClient()
  const tag = decodeURIComponent(params.tag)

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, meta_description, featured_image, created_date, tags, category')
    .ilike('tags', `%${tag}%`)
    .eq('status', 'published')
    .order('created_date', { ascending: false })

  // Avoid "soft 404" (a 200 page with no meaningful content) for non-existent tags.
  if (!posts || posts.length === 0) {
    notFound()
  }

  return (
    <main>
      <section className="blog-header">
        <div className="container">
          <h1 className="page-title">Tag: {tag}</h1>
          <p className="page-description">Articles tagged with “{tag}”.</p>
        </div>
      </section>

      <section className="blog-posts">
        <div className="container">
          <div className="blog-grid blog-grid-cards">
            {posts.map((post) => (
              <article key={post.id} className="blog-card">
                {post.featured_image && (
                  <div className="blog-card-image">
                    <img src={post.featured_image} alt={post.title} loading="lazy" />
                  </div>
                )}
                <div className="blog-card-content">
                  <div className="blog-card-top">
                    {post.category && <span className="tag-pill">{post.category}</span>}
                  </div>
                  <h2 className="blog-card-title">
                    <Link href={`/blog/${post.slug || post.id}`}>{post.title}</Link>
                  </h2>
                  {post.meta_description && <p className="blog-card-excerpt">{post.meta_description}</p>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}


