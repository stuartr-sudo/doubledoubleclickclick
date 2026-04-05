'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useCallback } from 'react'
import type { HeaderProps } from '../types'

export default function ModernHeader({
  brandName,
  logoUrl,
  tagline,
  categories = [],
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen((prev) => !prev)
  }, [])

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  return (
    <>
      <style>{`
        .modern-desktop-nav {
          display: flex;
        }
        .modern-mobile-bar {
          display: none;
        }
        .modern-slide-panel {
          display: none;
        }
        @media (max-width: 767px) {
          .modern-desktop-nav {
            display: none;
          }
          .modern-mobile-bar {
            display: flex;
          }
          .modern-slide-panel {
            display: block;
          }
        }
        .modern-nav-link {
          font-family: var(--font-sans);
          font-size: 9px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          text-decoration: none;
          color: var(--color-text-secondary);
          transition: color 0.15s ease;
        }
        .modern-nav-link:hover {
          color: var(--color-text);
        }
        .modern-panel-link {
          display: block;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          text-decoration: none;
          color: var(--color-text-secondary);
          padding: 14px 0;
          border-bottom: 1px solid var(--color-border);
          transition: color 0.15s ease;
        }
        .modern-panel-link:hover {
          color: var(--color-text);
        }
      `}</style>

      <header
        style={{
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {/* Desktop */}
        <div
          className="modern-desktop-nav"
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '14px 24px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: 'var(--color-text)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={brandName}
                width={120}
                height={28}
                style={{
                  maxHeight: 28,
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {brandName}
              </span>
            )}
          </Link>
          {tagline && (
            <span style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted, #6b7280)',
              marginLeft: '12px',
              fontWeight: 400,
            }}>
              {tagline}
            </span>
          )}

          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
            }}
          >
            <Link href="/" className="modern-nav-link">
              Home
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/blog/category/${encodeURIComponent(cat.toLowerCase())}`}
                className="modern-nav-link"
              >
                {cat}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile */}
        <div
          className="modern-mobile-bar"
          style={{
            padding: '14px 16px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: 'var(--color-text)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={brandName}
                width={100}
                height={24}
                style={{
                  maxHeight: 24,
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {brandName}
              </span>
            )}
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
              padding: 4,
              color: 'var(--color-text)',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <>
                  <path
                    d="M4 4L16 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 4L4 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <>
                  <path
                    d="M3 5H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3 10H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3 15H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile slide-down panel */}
      {isMenuOpen && (
        <div
          className="modern-slide-panel"
          style={{
            padding: '0 16px 8px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <nav>
            <Link href="/" className="modern-panel-link" onClick={handleMenuClose}>
              Home
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/blog/category/${encodeURIComponent(cat.toLowerCase())}`}
                className="modern-panel-link"
                onClick={handleMenuClose}
              >
                {cat}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
