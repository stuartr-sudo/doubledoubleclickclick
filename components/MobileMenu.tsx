'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
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
    if (href?.startsWith('#')) {
      // Smooth scroll to anchor
      e.preventDefault()
      const targetId = href.substring(1)
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    onClose()
  }

  return (
    <div className="mobile-menu-overlay">
      <button 
        className="mobile-menu-close-btn" 
        onClick={onClose} 
        aria-label="Close Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <nav className="mobile-menu-nav">
        {/* Blog temporarily hidden */}
        {/* <Link href="/blog" className="mobile-menu-link" onClick={onClose}>
          Blog
        </Link> */}
        <Link href="/contact" className="mobile-menu-link" onClick={onClose}>
          Contact
        </Link>
        <a href="#services" className="mobile-menu-link" onClick={handleLinkClick}>
          Services
        </a>
        <Link href="/privacy" className="mobile-menu-link" onClick={onClose}>
          Privacy
        </Link>
      </nav>
    </div>
  )
}

