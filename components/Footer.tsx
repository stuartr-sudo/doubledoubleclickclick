import Link from 'next/link'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'

export default async function Footer() {
  const config = getTenantConfig()
  let brandName = config.siteName
  let description = ''
  let email = config.contactEmail

  try {
    const brand = await getBrandData()
    brandName = brand.guidelines?.name || config.siteName
    description = brand.company?.blurb || brand.guidelines?.brand_personality || ''
    email = brand.company?.email || config.contactEmail
  } catch {
    // Fall back to env config
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="footer-logo">{brandName}</Link>
            {description && (
              <p className="footer-tagline">{description}</p>
            )}
          </div>

          <div className="footer-links">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-list">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/blog">Blog</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4 className="footer-heading">Legal</h4>
            <ul className="footer-list">
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4 className="footer-heading">Contact Us</h4>
            <ul className="footer-list">
              <li>
                <a href={`mailto:${email}`} className="footer-contact-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  {email}
                </a>
              </li>
              {config.contactPhone && (
                <li>
                  <a href={`tel:${config.contactPhone}`} className="footer-contact-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    {config.contactPhone}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
          <div className="footer-legal">
            <Link href="/privacy">Privacy Policy</Link>
            <span style={{ margin: '0 0.5rem', color: 'var(--color-text-light)' }}>|</span>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
