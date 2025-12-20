'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface BlogPost {
  id: string
  title: string
  slug: string
  meta_description: string | null
  featured_image: string | null
  created_date: string
  published_date?: string | null
  is_popular?: boolean
}

export default function BlogCarousel() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isPaused, setIsPaused] = useState(false)

  // Fetch posts on mount
  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('/api/blog?status=published&limit=12')
        const data = await response.json()
        if (data.success && data.data) {
          // Sort by popular first, then published_date (or created_date) newest first
          const sortedPosts = [...data.data].sort((a: any, b: any) => {
            if (a.is_popular && !b.is_popular) return -1
            if (!a.is_popular && b.is_popular) return 1
            const dateA = new Date(a.published_date || a.created_date).getTime()
            const dateB = new Date(b.published_date || b.created_date).getTime()
            return dateB - dateA
          })
          setPosts(sortedPosts)
        }
      } catch (error) {
        console.error('Error fetching carousel posts:', error)
      }
    }
    fetchPosts()
  }, [])

  // No longer using manual JS interval for scrolling
  // We will use CSS animations for a smoother, continuous experience

  // Don't render if no posts
  if (posts.length === 0) {
    return null
  }

  // Duplicate posts for seamless looping
  const duplicatedPosts = [...posts, ...posts, ...posts]

  return (
    <section className="blog-carousel-section">
      <div className="container">
        <div className="blog-carousel-header">
          <h2>Popular posts</h2>
          <p>
            Discover our most popular insights on LLM ranking, AI search optimization, and making your brand the answer AI suggests
          </p>
        </div>
        
        <style dangerouslySetInnerHTML={{
          __html: `
            .blog-carousel-container {
              overflow: hidden;
              width: 100%;
              padding: 2rem 0;
              position: relative;
            }
            
            .blog-carousel-track {
              display: flex;
              gap: 2rem;
              width: fit-content;
              animation: scroll 60s linear infinite;
            }
            
            .blog-carousel-track:hover {
              animation-play-state: paused;
            }
            
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(calc(-320px * ${posts.length} - 2rem * ${posts.length}));
              }
            }
            
            @media (max-width: 768px) {
              .blog-carousel-track {
                animation-duration: 40s;
              }
            }
          `
        }} />

        <div className="blog-carousel-container">
          <div 
            className="blog-carousel-track"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {duplicatedPosts.map((post, index) => (
              <Link
                href={`/blog/${post.slug || post.id}`}
                key={`${post.id}-${index}`}
                className="carousel-card"
              >
                {post.featured_image && (
                  <div className="carousel-card-image">
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      loading="lazy"
                      width={400}
                      height={300}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  </div>
                )}
                <div className="carousel-card-content">
                  <div className="carousel-card-date">
                    {new Date(post.published_date || post.created_date).toLocaleDateString('en-US', {
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
      </div>
    </section>
  )
}

