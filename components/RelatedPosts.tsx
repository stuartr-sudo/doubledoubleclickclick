'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  category: string;
  published_date: string;
  created_date: string;
  meta_description: string | null;
}

interface RelatedPostsProps {
  currentPostId: string;
  category: string;
}

export default function RelatedPosts({ currentPostId, category }: RelatedPostsProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelated() {
      try {
        // Fetch posts from same category
        const res = await fetch(`/api/blog?status=published&limit=4&category=${encodeURIComponent(category)}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          // Filter out the current post and limit to 3
          const filtered = data.data
            .filter((p: BlogPost) => p.id !== currentPostId)
            .slice(0, 3);
          
          setPosts(filtered);
        }
      } catch (error) {
        console.error('Error fetching related posts:', error);
      } finally {
        setLoading(false);
      }
    }

    if (category) {
      fetchRelated();
    } else {
      setLoading(false);
    }
  }, [currentPostId, category]);

  if (loading || posts.length === 0) return null;

  return (
    <section className="related-posts">
      <div className="container">
        <div className="related-posts-header">
          <h2>Related Insights</h2>
          <p>More expert thoughts on {category} and AI optimization.</p>
        </div>
        
        <div className="blog-grid blog-grid-cards">
          {posts.map((post) => (
            <article key={post.id} className="blog-card">
              <div className="blog-card-image">
                <img 
                  src={post.featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1600&auto=format&fit=crop'} 
                  alt={post.title}
                  loading="lazy"
                  width={400}
                  height={250}
                />
              </div>
              <div className="blog-card-content">
                <div className="blog-card-top">
                  <span className="tag-pill">{post.category}</span>
                </div>
                <h3 className="blog-card-title">
                  <Link href={`/blog/${post.slug || post.id}`}>
                    {post.title}
                  </Link>
                </h3>
                {post.meta_description && (
                  <p className="blog-card-excerpt">{post.meta_description}</p>
                )}
                <div className="blog-card-meta">
                  <time dateTime={post.published_date || post.created_date}>
                    {new Date(post.published_date || post.created_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </time>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

