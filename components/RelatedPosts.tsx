'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
        const res = await fetch(`/api/blog?status=published&limit=4&category=${encodeURIComponent(category)}`);
        const data = await res.json();

        if (data.success && data.data) {
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

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <>
      <section
        style={{
          borderTop: '1px solid var(--color-border)',
          marginTop: '32px',
          paddingTop: '24px',
          paddingBottom: '24px',
        }}
      >
        <div className="container">
          <div
            style={{
              fontSize: '9px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2.5px',
              color: 'var(--color-text)',
              paddingBottom: '8px',
              borderBottom: '2px solid var(--color-text)',
              marginBottom: '16px',
            }}
          >
            Related Insights
          </div>

          <div
            className="related-posts-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '0',
            }}
          >
            {posts.map((post, i) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug || post.id}`}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  color: 'inherit',
                  padding: '0 16px',
                  borderRight: i < posts.length - 1 && i < 2 ? '1px solid var(--color-border)' : 'none',
                  ...(i === 0 ? { paddingLeft: 0 } : {}),
                  ...(i === posts.length - 1 || i === 2 ? { paddingRight: 0 } : {}),
                }}
              >
                {post.featured_image && (
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '3 / 2',
                      overflow: 'hidden',
                      marginBottom: '10px',
                    }}
                  >
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      style={{ objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                )}

                {post.category && (
                  <span
                    style={{
                      fontSize: '8px',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: 'var(--color-accent)',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    {post.category}
                  </span>
                )}

                <h3
                  style={{
                    fontSize: '14px',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    margin: '0 0 6px',
                    color: 'var(--color-text)',
                  }}
                >
                  {post.title}
                </h3>

                {post.meta_description && (
                  <p
                    style={{
                      fontSize: '10px',
                      lineHeight: 1.5,
                      color: 'var(--color-text-secondary)',
                      margin: '0 0 6px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {post.meta_description}
                  </p>
                )}

                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {formatDate(post.published_date || post.created_date)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 1024px) and (min-width: 769px) {
          .related-posts-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .related-posts-grid > a:nth-child(2) {
            border-right: none !important;
          }
          .related-posts-grid > a:nth-child(3) {
            padding-left: 0 !important;
            padding-top: 16px;
            border-top: 1px solid var(--color-border-light);
          }
        }
        @media (max-width: 768px) {
          .related-posts-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .related-posts-grid > a {
            border-right: none !important;
            padding: 0 !important;
            padding-bottom: 16px !important;
            border-bottom: 1px solid var(--color-border-light);
          }
          .related-posts-grid > a:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </>
  );
}
