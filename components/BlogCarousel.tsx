'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface BlogPost {
  id: string
  title: string
  slug: string
  meta_description: string | null
  featured_image: string | null
  created_date: string
}

export default function BlogCarousel() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Fetch posts on mount
  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('/api/blog?status=published&limit=12')
        const data = await response.json()
        if (data.success && data.data) {
          setPosts(data.data)
        }
      } catch (error) {
        console.error('Error fetching carousel posts:', error)
      }
    }
    fetchPosts()
  }, [])

  // Auto-scroll functionality
  useEffect(() => {
    if (!carouselRef.current || posts.length === 0 || isPaused) return

    const carousel = carouselRef.current
    const scrollSpeed = 1 // pixels per interval
    const scrollInterval = 30 // ms between scrolls

    const autoScroll = setInterval(() => {
      if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth) {
        // Reset to start when reaching the end
        carousel.scrollLeft = 0
      } else {
        carousel.scrollLeft += scrollSpeed
      }
    }, scrollInterval)

    return () => clearInterval(autoScroll)
  }, [posts, isPaused])

  // Don't render if no posts
  if (posts.length === 0) {
    return null
  }

  return (
    <section className="blog-carousel-section">
      <div className="container">
        <div className="blog-carousel-header">
          <h2>Latest Blog Posts</h2>
          <p>
            Discover our latest insights on LLM ranking, AI search optimization, and making your brand the answer AI suggests
          </p>
        </div>
        <div 
          ref={carouselRef}
          className="blog-carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {posts.map((post) => (
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
        <div style={{ textAlign: 'center', marginTop: '1rem', color: '#666', fontSize: '0.875rem' }}>
          Hover or touch to pause scrolling
        </div>
      </div>
    </section>
  )
}

