'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import MobileMenu from '@/components/MobileMenu'
import CategoryPills from '@/components/CategoryPills'

interface SiteHeaderClientProps {
  siteName?: string
  logoUrl?: string | null
  categories?: string[]
  // Legacy props for backward compatibility with page-level usage
  blogVisible?: boolean
  logoText?: string
  logoImage?: string
}

export default function SiteHeaderClient({
  siteName,
  logoUrl,
  categories = [],
  // Legacy props (ignored in new design — header is now in layout)
  logoText,
  logoImage,
  blogVisible,
}: SiteHeaderClientProps) {
  // Merge legacy props for backward compat
  const resolvedName = siteName || logoText || 'Site'
  const resolvedLogo = logoUrl ?? logoImage ?? null
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen((prev) => !prev)
  }, [])

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <style>{`
        .editorial-topbar,
        .editorial-masthead,
        .editorial-categorynav {
          display: block;
        }
        .editorial-mobile-header {
          display: none;
        }
        .editorial-mobile-pills {
          display: none;
        }
        @media (max-width: 767px) {
          .editorial-topbar,
          .editorial-masthead,
          .editorial-categorynav {
            display: none;
          }
          .editorial-mobile-header {
            display: block;
            position: sticky;
            top: 0;
            z-index: 100;
            background: var(--color-bg);
          }
          .editorial-mobile-pills {
            display: block;
          }
        }
      `}</style>

      <header>
        {/* Desktop: TopBar */}
        <div
          className="editorial-topbar"
          style={{
            background: 'var(--color-bg-warm)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div
            className="container"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '6px',
              paddingBottom: '6px',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span>{today}</span>
            <Link
              href="/newsletter"
              style={{
                color: 'var(--color-text-muted)',
                textDecoration: 'none',
              }}
            >
              Subscribe to our newsletter &rarr;
            </Link>
          </div>
        </div>

        {/* Desktop: Masthead */}
        <div
          className="editorial-masthead"
          style={{
            borderTop: '3px double #1a1a1a',
            borderBottom: '3px double #1a1a1a',
            padding: '16px 0',
            textAlign: 'center',
          }}
        >
          <div className="container">
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                color: 'var(--color-text)',
              }}
            >
              {resolvedLogo ? (
                <Image
                  src={resolvedLogo}
                  alt={resolvedName}
                  width={200}
                  height={60}
                  style={{
                    maxHeight: '60px',
                    width: 'auto',
                    margin: '0 auto',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'var(--text-5xl)',
                    fontWeight: 700,
                    letterSpacing: '-1px',
                    lineHeight: 1.2,
                    display: 'block',
                  }}
                >
                  {resolvedName}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Desktop: CategoryNav */}
        <nav
          className="editorial-categorynav"
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
                }}
              >
                {cat}
              </Link>
            ))}
          </div>
        </nav>

        {/* Mobile: Compact Header */}
        <div
          className="editorial-mobile-header"
          style={{
            borderBottom: '1px solid var(--color-border)',
            padding: '10px 0',
          }}
        >
          <div
            className="container"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                letterSpacing: '-0.5px',
              }}
            >
              {resolvedName}
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleMenuToggle()
              }}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--color-text)',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M4 12H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M4 18H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile: Category Pills */}
        {categories.length > 0 && (
          <div className="editorial-mobile-pills">
            <CategoryPills categories={categories} />
          </div>
        )}
      </header>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        categories={categories}
      />
    </>
  )
}
