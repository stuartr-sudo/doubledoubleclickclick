'use client'

import Link from 'next/link'

interface CategoryPillsProps {
  categories: string[]
  activeCategory?: string
}

export default function CategoryPills({
  categories,
  activeCategory,
}: CategoryPillsProps) {
  return (
    <div
      style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        padding: '8px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '0 var(--space-md)',
          whiteSpace: 'nowrap',
        }}
      >
        {categories.map((cat) => {
          const isActive =
            activeCategory?.toLowerCase() === cat.toLowerCase()
          return (
            <Link
              key={cat}
              href={`/blog/category/${encodeURIComponent(cat.toLowerCase())}`}
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-sans)',
                textDecoration: 'none',
                borderRadius: '20px',
                transition: 'all 0.2s ease',
                ...(isActive
                  ? {
                      background: 'var(--color-text)',
                      color: '#fff',
                      border: '1px solid var(--color-text)',
                    }
                  : {
                      background: 'transparent',
                      color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border)',
                    }),
              }}
            >
              {cat}
            </Link>
          )
        })}
      </div>
      <style>{`
        @media (min-width: 768px) {
          .categorypills-hide { display: none !important; }
        }
      `}</style>
    </div>
  )
}
