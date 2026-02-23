'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface CarouselPost {
  id: string
  title: string
  slug: string
  meta_description?: string | null
  excerpt?: string | null
  featured_image?: string | null
  created_date?: string
  published_date?: string | null
}

interface BlogCarouselProps {
  posts: CarouselPost[]
  title?: string
  description?: string
}

export default function BlogCarousel({ posts, title = 'Latest Posts', description }: BlogCarouselProps) {
  const [isPaused, setIsPaused] = useState(false)

  if (posts.length === 0) return null

  const duplicatedPosts = [...posts, ...posts, ...posts]

  return (
    <section className="blog-carousel-section">
      <div className="container">
        <div className="blog-carousel-header">
          <h2>{title}</h2>
          {description && <p>{description}</p>}
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
                    {new Date(post.published_date || post.created_date || '').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </div>
                  <h3 className="carousel-card-title">{post.title}</h3>
                  {(post.meta_description || post.excerpt) && (
                    <p className="carousel-card-excerpt">
                      {post.meta_description || post.excerpt}
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
