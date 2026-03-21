import Link from 'next/link'

interface BreadcrumbProps {
  category: string
  subcategory?: string
}

export default function Breadcrumb({ category, subcategory }: BreadcrumbProps) {
  return (
    <nav
      style={{
        fontSize: '10px',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <Link
        href={`/blog?category=${encodeURIComponent(category)}`}
        style={{
          color: 'var(--color-accent)',
          textDecoration: 'none',
        }}
      >
        {category}
      </Link>
      {subcategory && (
        <>
          <span style={{ color: 'var(--color-text-muted)' }}>›</span>
          <span style={{ color: 'var(--color-text-muted)' }}>{subcategory}</span>
        </>
      )}
    </nav>
  )
}
