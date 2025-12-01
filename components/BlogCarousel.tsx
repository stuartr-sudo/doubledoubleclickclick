import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function BlogCarousel() {
  const supabase = await createClient()
  
  // Fetch latest 4 published posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, meta_description, featured_image, created_date')
    .eq('status', 'published')
    .order('created_date', { ascending: false })
    .limit(4)

  // Only show real posts from database
  const displayPosts = posts || []

  // Don't render carousel if no posts
  if (displayPosts.length === 0) {
    return null
  }

  return (
    <section className="blog-carousel-section">
      <div className="container">
        <div className="blog-carousel-header">
          <h2>Blog Carousel</h2>
          <p>
            With this innovative tool, you can easily display your blog posts in a beautiful and engaging carousel format
          </p>
        </div>
        <div className="blog-carousel">
          {displayPosts.map((post) => (
            <Link
              href={`/blog/${post.slug || post.id}`}
              key={post.id}
              className="carousel-card"
            >
              {post.featured_image && (
                <div className="carousel-card-image">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    loading="lazy"
                    width={400}
                    height={300}
                  />
                </div>
              )}
              <div className="carousel-card-content">
                <div className="carousel-card-date">
                  {new Date(post.created_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </div>
                <h3 className="carousel-card-title">{post.title}</h3>
                {post.meta_description && (
                  <p className="carousel-card-excerpt">
                    {post.meta_description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

