'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  blogVisible?: boolean
}

export default function MobileMenu({ isOpen, onClose, blogVisible = true }: MobileMenuProps) {
  const pathname = usePathname()
  const initialPathname = useRef(pathname)

  // Close menu when pathname changes (meaning we've navigated to a new page)
  useEffect(() => {
    if (pathname !== initialPathname.current) {
      onClose()
      initialPathname.current = pathname
    }
  }, [pathname, onClose])

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
    
    // If clicking a link to the current page, close the menu manually
    if (href === pathname || href === '/') {
      onClose()
    }
    
    if (href?.startsWith('#')) {
      // Smooth scroll to anchor
      e.preventDefault()
      const targetId = href.substring(1)
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
      onClose()
    }
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
        <Link href="/" className="mobile-menu-link" onClick={handleLinkClick}>
          Home
        </Link>
        <Link href="/guide" className="mobile-menu-link" onClick={handleLinkClick}>
          The Playbook
        </Link>
        <Link href="/course" className="mobile-menu-link" onClick={handleLinkClick}>
          The Accelerator
        </Link>
        <Link href="/book-call" className="mobile-menu-link" onClick={handleLinkClick}>
          Strategy Audit
        </Link>
        <Link href="/consulting" className="mobile-menu-link" onClick={handleLinkClick}>
          Consulting
        </Link>
        {blogVisible && (
          <Link href="/blog" className="mobile-menu-link" onClick={handleLinkClick}>
            Blog
          </Link>
        )}
      </nav>
    </div>
  )
}

