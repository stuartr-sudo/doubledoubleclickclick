'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import MobileMenu from '@/components/MobileMenu'

type SiteHeaderProps = {
  blogVisible?: boolean
  logoText?: string
  logoImage?: string
  ctaText?: string
  ctaLink?: string
}

export default function SiteHeader({
  blogVisible = true,
  logoText = 'SEWO',
  logoImage,
  ctaText = 'Apply to Work With Us',
  ctaLink = '/#apply-form',
}: SiteHeaderProps) {
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
          <Link href="/" className="logo" aria-label={`${logoText} Home`}>
            {logoImage ? (
              <span className="logo-image-wrap">
                <Image src={logoImage} alt={logoText} width={80} height={40} className="logo-image" />
              </span>
            ) : (
              logoText
            )}
          </Link>

          <div className="nav-links">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            {blogVisible && <Link href="/blog">Blog</Link>}
            <Link href={ctaLink} className="nav-cta-button">{ctaText}</Link>
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

      <MobileMenu isOpen={isMenuOpen} onClose={handleMenuClose} blogVisible={blogVisible} ctaText={ctaText} ctaLink={ctaLink} />
    </header>
  )
}


