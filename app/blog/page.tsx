import Link from 'next/link'
import { getPublishedPosts, getCategoriesWithCounts, getPostDate, estimateReadTime } from '@/lib/posts'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import FeaturedCard from '@/components/FeaturedCard'
import ArticleCard from '@/components/ArticleCard'
import Pagination from '@/components/Pagination'
import CategoryPills from '@/components/CategoryPills'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const POSTS_PER_PAGE = 12

export async function generateMetadata({ searchParams }: { searchParams?: { category?: string } }): Promise<Metadata> {
  const config = getTenantConfig()
  const category = searchParams?.category
  const title = category ? `${category} | ${config.siteName}` : `All Articles | ${config.siteName}`

  return {
    title,
    description: `Latest articles and updates from ${config.siteName}.`,
    openGraph: {
      title,
      description: `Latest articles and updates from ${config.siteName}.`,
      type: 'website',
    },
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: { category?: string; page?: string }
}) {
  const config = getTenantConfig()
  const [brand, allPosts, categories] = await Promise.all([
    getBrandData(),
    getPublishedPosts(200),
    getCategoriesWithCounts(),
  ])

  const selectedCategory =
    typeof searchParams?.category === 'string' ? searchParams.category : null
  const currentPage = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1)

  // Filter by category
  const filteredPosts = selectedCategory
    ? allPosts.filter(
        (p) =>
          String(p.category).toLowerCase() === selectedCategory.toLowerCase()
      )
    : allPosts

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE
  const paginatedPosts = filteredPosts.slice(
    startIndex,
    startIndex + POSTS_PER_PAGE
  )

  const pageTitle = selectedCategory || 'All Articles'
  const baseUrl = selectedCategory
    ? `/blog?category=${encodeURIComponent(selectedCategory)}`
    : '/blog'

  const categoryNames = categories.map((c) => c.name)

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div className="container">
        {/* Page Header */}
        <div
          style={{
            paddingTop: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '16px',
          }}
        >
          <h1
            style={{
              fontSize: '28px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              margin: 0,
              color: 'var(--color-text)',
            }}
          >
            {pageTitle}
          </h1>
          <p
            style={{
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              color: 'var(--color-text-secondary)',
              margin: '6px 0 0',
            }}
          >
            {selectedCategory
              ? `Articles in ${selectedCategory}`
              : 'The latest articles, insights, and stories'}
          </p>
        </div>

        {/* Desktop Category Tabs */}
        {categories.length > 0 && (
          <div
            className="blog-category-tabs"
            style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '24px',
              borderBottom: '1px solid var(--color-border-light)',
              paddingBottom: '12px',
            }}
          >
            <Link
              href="/blog"
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-sans)',
                fontWeight: !selectedCategory ? 700 : 400,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                textDecoration: 'none',
                color: !selectedCategory
                  ? 'var(--color-text)'
                  : 'var(--color-text-muted)',
                paddingBottom: '10px',
                borderBottom: !selectedCategory
                  ? '2px solid var(--color-text)'
                  : '2px solid transparent',
                marginBottom: '-13px',
              }}
            >
              All
            </Link>
            {categories.map((cat) => {
              const isActive =
                selectedCategory?.toLowerCase() === cat.name.toLowerCase()
              return (
                <Link
                  key={cat.name}
                  href={`/blog?category=${encodeURIComponent(cat.name)}`}
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: isActive ? 700 : 400,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    textDecoration: 'none',
                    color: isActive
                      ? 'var(--color-text)'
                      : 'var(--color-text-muted)',
                    paddingBottom: '10px',
                    borderBottom: isActive
                      ? '2px solid var(--color-text)'
                      : '2px solid transparent',
                    marginBottom: '-13px',
                  }}
                >
                  {cat.name}
                </Link>
              )
            })}
          </div>
        )}

        {/* Mobile Category Pills */}
        {categories.length > 0 && (
          <div className="blog-category-pills-mobile">
            <CategoryPills
              categories={['All', ...categoryNames]}
              activeCategory={selectedCategory || 'All'}
            />
          </div>
        )}

        {/* Posts */}
        {paginatedPosts.length > 0 ? (
          <>
            {/* Featured first post */}
            {currentPage === 1 && paginatedPosts.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <FeaturedCard
                  post={{
                    title: paginatedPosts[0].title,
                    slug: paginatedPosts[0].slug,
                    excerpt:
                      paginatedPosts[0].meta_description ||
                      paginatedPosts[0].excerpt,
                    category: paginatedPosts[0].category || undefined,
                    featured_image:
                      paginatedPosts[0].featured_image || undefined,
                    author_name: paginatedPosts[0].author || undefined,
                    created_date: formatDate(getPostDate(paginatedPosts[0])),
                    read_time: `${estimateReadTime(paginatedPosts[0])} min read`,
                  }}
                />
              </div>
            )}

            {/* Remaining posts as ArticleCard list */}
            <div>
              {(currentPage === 1
                ? paginatedPosts.slice(1)
                : paginatedPosts
              ).map((post) => (
                <ArticleCard
                  key={post.id}
                  post={{
                    title: post.title,
                    slug: post.slug,
                    excerpt:
                      post.meta_description || post.excerpt || undefined,
                    category: post.category || undefined,
                    featured_image: post.featured_image || undefined,
                    author_name: post.author || undefined,
                    created_date: formatDate(getPostDate(post)),
                    read_time: `${estimateReadTime(post)} min read`,
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl={baseUrl}
            />
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <p>No articles found. Check back soon!</p>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .blog-category-tabs {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .blog-category-pills-mobile {
            display: none !important;
          }
        }
      `}</style>
    </main>
  )
}
