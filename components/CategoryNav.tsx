import Link from 'next/link'
import { getTenantConfig } from '@/lib/tenant'
import { createServiceClient } from '@/lib/supabase/service'

async function getCategories(): Promise<string[]> {
  try {
    const { username } = getTenantConfig()
    if (!username) return []

    const supabase = createServiceClient()
    const { data } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('user_name', username)
      .eq('status', 'published')
      .not('category', 'is', null)

    if (!data) return []

    const unique = [...new Set(data.map((r) => r.category).filter(Boolean))]
    return unique.slice(0, 6)
  } catch {
    return []
  }
}

export { getCategories }

export default async function CategoryNav() {
  const categories = await getCategories()

  return (
    <nav
      style={{
        borderBottom: '1px solid var(--color-border)',
        padding: '10px 0',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            textDecoration: 'none',
            color: 'var(--color-text-secondary)',
            transition: 'color 0.2s ease',
          }}
        >
          Home
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/blog/category/${encodeURIComponent(cat.toLowerCase())}`}
            style={{
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              textDecoration: 'none',
              color: 'var(--color-text-secondary)',
              transition: 'color 0.2s ease',
            }}
          >
            {cat}
          </Link>
        ))}
      </div>
      <style>{`
        @media (max-width: 767px) {
          .categorynav-hide { display: none !important; }
        }
      `}</style>
    </nav>
  )
}
