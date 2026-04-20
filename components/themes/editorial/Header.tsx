'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useCallback, useEffect, useRef } from 'react'
import type { HeaderProps } from '../types'

export default function EditorialHeader({
  brandName,
  logoUrl,
  tagline,
  categories = [],
  pages = [],
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen((prev) => !prev)
  }, [])

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  useEffect(() => {
    if (isMenuOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isMenuOpen])

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
        .editorial-mobile-pills-inner {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 8px 16px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          border-bottom: 1px solid var(--color-border);
        }
        .editorial-mobile-pills-inner::-webkit-scrollbar {
          display: none;
        }
        .editorial-pill {
          flex-shrink: 0;
          font-family: var(--font-sans);
          font-size: var(--text-xs);
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--color-text-muted);
          text-decoration: none;
          padding: 4px 10px;
          border: 1px solid var(--color-border);
          border-radius: 999px;
          white-space: nowrap;
        }
        .editorial-mobile-menu {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: var(--color-bg);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
        }
        .editorial-mobile-menu-close {
          align-self: flex-end;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text);
          padding: 4px;
        }
        .editorial-mobile-menu-link {
          font-family: var(--font-serif);
          font-size: var(--text-2xl);
          font-weight: 700;
          text-decoration: none;
          color: var(--color-text);
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 12px;
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
            borderTop: '3px double var(--color-text)',
            borderBottom: '3px double var(--color-text)',
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
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={brandName}
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
                  {brandName}
                </span>
              )}
            </Link>
            {tagline && (
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  marginTop: '4px',
                  marginBottom: 0,
                }}
              >
                {tagline}
              </p>
            )}
          </div>
        </div>

        {/* Desktop: CategoryNav */}
        <nav
          className="editorial-categorynav"
          aria-label="Primary navigation"
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
            {pages.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                style={{
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  textDecoration: 'none',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {p.label}
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
              {brandName}
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

        {/* Mobile: Category + Page Pills (horizontal scroll) */}
        {(categories.length > 0 || pages.length > 0) && (
          <div className="editorial-mobile-pills">
            <div className="editorial-mobile-pills-inner">
              <Link href="/" className="editorial-pill">
                Home
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/blog/category/${encodeURIComponent(cat.toLowerCase())}`}
                  className="editorial-pill"
                >
                  {cat}
                </Link>
              ))}
              {pages.map((p) => (
                <Link key={p.href} href={p.href} className="editorial-pill">
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Mobile: Full-screen menu overlay */}
      {isMenuOpen && (
        <div className="editorial-mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            ref={closeButtonRef}
            type="button"
            className="editorial-mobile-menu-close"
            onClick={handleMenuClose}
            aria-label="Close menu"
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
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <Link href="/" className="editorial-mobile-menu-link" onClick={handleMenuClose}>
            Home
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog/category/${encodeURIComponent(cat.toLowerCase())}`}
              className="editorial-mobile-menu-link"
              onClick={handleMenuClose}
            >
              {cat}
            </Link>
          ))}
          {pages.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="editorial-mobile-menu-link"
              onClick={handleMenuClose}
            >
              {p.label}
            </Link>
          ))}
          <Link href="/newsletter" className="editorial-mobile-menu-link" onClick={handleMenuClose}>
            Newsletter
          </Link>
        </div>
      )}
    </>
  )
}
