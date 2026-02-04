'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import MobileMenu from '@/components/MobileMenu'

type SiteHeaderProps = {
  blogVisible?: boolean
}

export default function SiteHeader({ blogVisible = true }: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen(prev => !prev)
  }, [])

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  return (
    <header className="header site-header">
      <div className="container">
        <nav className="nav">
          <Link href="/" className="logo" aria-label="Modern Longevity Home">
            Modern Longevity
          </Link>

          <div className="nav-links">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            {blogVisible && <Link href="/blog">Blog</Link>}
            <Link href="/#apply-form" className="nav-cta-button">Apply to Work With Us</Link>
          </div>

          <button
            type="button"
            className="site-header-menu-btn"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleMenuToggle()
            }}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </nav>
      </div>

      <MobileMenu isOpen={isMenuOpen} onClose={handleMenuClose} blogVisible={blogVisible} />
    </header>
  )
}


