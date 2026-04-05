'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useCallback } from 'react'
import type { HeaderProps } from '../types'

export default function BoutiqueHeader({
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
        .boutique-desktop {
          display: block;
        }
        .boutique-mobile-header {
          display: none;
        }
        .boutique-mobile-pills {
          display: none;
        }
        @media (max-width: 767px) {
          .boutique-desktop {
            display: none;
          }
          .boutique-mobile-header {
            display: block;
            position: sticky;
            top: 0;
            z-index: 100;
            background: var(--color-bg);
          }
          .boutique-mobile-pills {
            display: block;
          }
        }
        .boutique-pill {
          flex-shrink: 0;
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 500;
          text-decoration: none;
          color: var(--color-text-secondary);
          background: var(--color-bg-warm);
          padding: 6px 16px;
          border-radius: 20px;
          white-space: nowrap;
          transition: background 0.2s ease;
        }
        .boutique-pill:hover {
          filter: brightness(0.95);
        }
        .boutique-mobile-pills-inner {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 10px 16px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          border-bottom: 1px solid var(--color-border);
        }
        .boutique-mobile-pills-inner::-webkit-scrollbar {
          display: none;
        }
        .boutique-mobile-menu {
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
        .boutique-mobile-menu-close {
          align-self: flex-end;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text);
          padding: 4px;
        }
        .boutique-mobile-menu-link {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 500;
          text-decoration: none;
          color: var(--color-text);
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 12px;
        }
      `}</style>

      <header>
        {/* Accent top bar */}
        <div
          style={{
            height: '4px',
            background: 'var(--color-accent)',
          }}
        />

        {/* Desktop Layout */}
        <div className="boutique-desktop">
          {/* Masthead — centered brand */}
          <div
            style={{
              textAlign: 'center',
              padding: '20px 0',
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
                      fontFamily: 'var(--font-heading)',
                      fontSize: '30px',
                      fontWeight: 600,
                      letterSpacing: '-0.5px',
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
                    fontSize: '13px',
                    fontStyle: 'italic',
                    color: 'var(--color-text-secondary)',
                    marginTop: '4px',
                    marginBottom: 0,
                  }}
                >
                  {tagline}
                </p>
              )}
            </div>
          </div>

          {/* Desktop: Category pill navigation */}
          <nav
            style={{
              borderTop: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
              padding: '12px 0',
            }}
          >
            <div
              className="container"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <Link href="/" className="boutique-pill">
                Home
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/blog/category/${encodeURIComponent(cat.toLowerCase())}`}
                  className="boutique-pill"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        {/* Mobile: Compact Header */}
        <div
          className="boutique-mobile-header"
          style={{
            borderBottom: '1px solid var(--color-border)',
            padding: '12px 0',
          }}
        >
          <div
            className="container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-heading)',
                fontSize: '20px',
                fontWeight: 600,
                letterSpacing: '-0.3px',
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
                position: 'absolute',
                right: 0,
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

        {/* Mobile: Category Pills (horizontal scroll) */}
        {categories.length > 0 && (
          <div className="boutique-mobile-pills">
            <div className="boutique-mobile-pills-inner">
              <Link href="/" className="boutique-pill">
                Home
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/blog/category/${encodeURIComponent(cat.toLowerCase())}`}
                  className="boutique-pill"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Mobile: Full-screen menu overlay */}
      {isMenuOpen && (
        <div className="boutique-mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            className="boutique-mobile-menu-close"
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
          <Link href="/" className="boutique-mobile-menu-link" onClick={handleMenuClose}>
            Home
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog/category/${encodeURIComponent(cat.toLowerCase())}`}
              className="boutique-mobile-menu-link"
              onClick={handleMenuClose}
            >
              {cat}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
