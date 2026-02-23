import Link from 'next/link'
import Image from 'next/image'
import SiteHeader from '@/components/SiteHeader'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import { getPublishedPosts } from '@/lib/posts'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AboutPage() {
  const config = getTenantConfig()
  const brand = await getBrandData()
  const brandName = brand.guidelines?.name || config.siteName

  // Fetch author from Doubleclicker's multi-tenant authors table
  const supabase = createServiceClient()
  const { data: author } = await supabase
    .from('authors')
    .select('name, bio, profile_image_url, social_links')
    .eq('user_name', config.username)
    .limit(1)
    .single()

  // Fallback to brand_guidelines author data
  const authorName = author?.name || brand.guidelines?.default_author || brandName
  const authorBio = author?.bio || brand.guidelines?.author_bio || ''
  const authorImage = author?.profile_image_url || brand.guidelines?.author_image_url || ''
  const authorSocials = author?.social_links || brand.guidelines?.author_social_urls || {}
  const linkedinUrl = authorSocials?.linkedin || authorSocials?.LinkedIn || ''

  const posts = await getPublishedPosts(6)

  return (
    <>
      <SiteHeader logoText={brandName} logoImage={brand.specs?.logo_url || undefined} />
      <main>
        <section className="about-hero">
          <div className="container">
            <h1 className="about-title">About Us</h1>
            {brand.company?.blurb && (
              <p className="about-subtitle">{brand.company.blurb}</p>
            )}
          </div>
        </section>

        {(brand.guidelines?.brand_personality || brand.guidelines?.voice_and_tone) && (
          <section className="about-content">
            <div className="container">
              <div className="about-text-grid">
                <div className="about-text-main">
                  <h2>Our Mission</h2>
                  <p>{brand.guidelines?.brand_personality || brand.guidelines?.voice_and_tone}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Founder Section */}
        {authorName && (
          <section className="founder-section">
            <div className="container">
              <h2 className="section-title">Meet the Founder</h2>

              <div className="founder-hero">
                <div className="founder-avatar">
                  {authorImage ? (
                    <Image
                      src={authorImage}
                      alt={authorName}
                      width={150}
                      height={150}
                      style={{ objectFit: 'cover', borderRadius: '999px' }}
                    />
                  ) : (
                    <div className="founder-avatar-fallback">{authorName.slice(0, 1).toUpperCase()}</div>
                  )}
                </div>
                <div className="founder-info">
                  <h3 className="founder-name">{authorName}</h3>
                  <p className="founder-role">Founder</p>
                  {authorBio && <p className="founder-bio">{authorBio}</p>}
                  <div className="founder-links">
                    {linkedinUrl && (
                      <a className="btn btn-secondary" href={linkedinUrl} target="_blank" rel="noreferrer">
                        LinkedIn
                      </a>
                    )}
                    <Link className="btn btn-secondary" href="/blog">View all posts</Link>
                  </div>
                </div>
              </div>

              {posts.length > 0 && (
                <div className="founder-posts">
                  <h3 className="founder-posts-title">Recent Posts</h3>
                  <div className="blog-grid">
                    {posts.map((post) => (
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
                              {new Date(post.published_date || post.created_date || '').toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <h4 className="blog-card-title">{post.title}</h4>
                          {(post.meta_description || post.excerpt) && (
                            <p className="blog-card-excerpt">{post.meta_description || post.excerpt}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
