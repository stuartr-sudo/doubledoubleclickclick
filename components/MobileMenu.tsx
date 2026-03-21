'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  categories?: string[]
}

export default function MobileMenu({
  isOpen,
  onClose,
  categories = [],
}: MobileMenuProps) {
  const pathname = usePathname()
  const prevPathnameRef = useRef(pathname)

  useEffect(() => {
    if (isOpen && pathname !== prevPathnameRef.current) {
      onClose()
    }
    prevPathnameRef.current = pathname
  }, [pathname, onClose, isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href')

    if (href === pathname || href === '/') {
      onClose()
    }

    if (href?.startsWith('#')) {
      e.preventDefault()
      const targetId = href.substring(1)
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
      onClose()
    }
  }

  const linkStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-serif)',
    fontSize: 'var(--text-xl)',
    color: 'var(--color-text)',
    textDecoration: 'none',
    padding: '12px 0',
    borderBottom: '1px solid var(--color-border-light)',
  }

  const categoryLinkStyle: React.CSSProperties = {
    ...linkStyle,
    fontSize: 'var(--text-lg)',
    color: 'var(--color-text-secondary)',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--color-bg-warm)',
        overflowY: 'auto',
        animation: 'mobileMenuFadeIn 0.25s ease',
      }}
    >
      <div
        style={{
          padding: 'var(--space-lg)',
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
        }}
      >
        {/* Close button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 'var(--space-2xl)',
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close Menu"
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
                d="M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <nav>
          <Link href="/" style={linkStyle} onClick={handleLinkClick}>
            Home
          </Link>
          <Link href="/about" style={linkStyle} onClick={handleLinkClick}>
            About
          </Link>
          <Link href="/contact" style={linkStyle} onClick={handleLinkClick}>
            Contact
          </Link>
          <Link href="/blog" style={linkStyle} onClick={handleLinkClick}>
            Blog
          </Link>

          {/* Category links */}
          {categories.length > 0 && (
            <div style={{ marginTop: 'var(--space-2xl)' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-sm)',
                }}
              >
                Topics
              </span>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/blog/category/${encodeURIComponent(cat.toLowerCase())}`}
                  style={categoryLinkStyle}
                  onClick={handleLinkClick}
                >
                  {cat}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </div>
    </div>
  )
}
