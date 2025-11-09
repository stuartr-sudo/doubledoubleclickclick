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

  // Fallback demo posts
  const demoPosts = [
    {
      id: 'demo-1',
      title: 'How to build a startup from scratch',
      slug: 'how-to-build-a-startup-from-scratch',
      meta_description: 'A practical walkthrough on validating ideas, building the first version, and reaching product‑market fit.',
      featured_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1600&auto=format&fit=crop',
      created_date: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      title: 'Mastering the art of pitching your business idea',
      slug: 'mastering-the-art-of-pitching-your-business-idea',
      meta_description: 'Structure, narrative, and visuals that make investors and customers say yes.',
      featured_image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop',
      created_date: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'demo-3',
      title: 'Turning your passion into a full‑time career',
      slug: 'turning-your-passion-into-a-full-time-career',
      meta_description: 'Playbooks for creators to monetize, build audience, and scale sustainably.',
      featured_image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1600&auto=format&fit=crop',
      created_date: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'demo-4',
      title: 'The latest tech trends every creator should know',
      slug: 'the-latest-tech-trends-every-creator-should-know',
      meta_description: 'From AI tools to new platforms—what matters this year and how to adapt fast.',
      featured_image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1600&auto=format&fit=crop',
      created_date: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
  ]

  const displayPosts = posts && posts.length > 0 ? posts : demoPosts

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

