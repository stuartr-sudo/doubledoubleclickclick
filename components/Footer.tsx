import Link from 'next/link'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import { getCategories } from '@/components/CategoryNav'

export default async function Footer() {
  const config = getTenantConfig()
  let brandName = config.siteName
  let description = ''

  try {
    const brand = await getBrandData()
    brandName = brand.guidelines?.name || config.siteName
    const rawDesc =
      brand.company?.blurb || brand.guidelines?.brand_personality || ''
    if (rawDesc.length > 160) {
      const truncated = rawDesc.slice(0, 160)
      const lastPeriod = truncated.lastIndexOf('.')
      description =
        lastPeriod > 60
          ? truncated.slice(0, lastPeriod + 1)
          : truncated.trimEnd() + '...'
    } else {
      description = rawDesc
    }
  } catch {
    // Fall back to env config
  }

  const categories = await getCategories()

  const columnHeaderStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: '#666',
    marginBottom: '16px',
    fontWeight: 400,
  }

  const linkStyle: React.CSSProperties = {
    color: '#999',
    textDecoration: 'none',
    fontSize: 'var(--text-sm)',
    lineHeight: 2,
    display: 'block',
  }

  return (
    <>
      <style>{`
        .footer-grid-editorial {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 40px;
        }
        @media (max-width: 1024px) and (min-width: 768px) {
          .footer-grid-editorial {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }
        @media (max-width: 767px) {
          .footer-grid-editorial {
            grid-template-columns: 1fr;
            gap: 28px;
            text-align: center;
          }
          .footer-grid-editorial nav a {
            line-height: 2.4;
          }
          .footer-grid-editorial > div:first-child {
            padding-bottom: 8px;
            border-bottom: 1px solid #333;
            margin-bottom: 4px;
          }
        }
      `}</style>
      <footer
        style={{
          background: 'var(--color-footer-bg)',
          padding: '48px 0 24px',
          marginTop: '48px',
        }}
      >
        <div className="container">
          <div className="footer-grid-editorial">
            {/* Brand column */}
            <div>
              <Link
                href="/"
                style={{
                  color: '#e5e0d8',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                  display: 'block',
                  marginBottom: '12px',
                }}
              >
                {brandName}
              </Link>
              {description && (
                <p
                  style={{
                    color: '#999',
                    fontSize: 'var(--text-sm)',
                    lineHeight: 2,
                    margin: 0,
                  }}
                >
                  {description}
                </p>
              )}
            </div>

            {/* Topics column */}
            <div>
              <h4 style={columnHeaderStyle}>Topics</h4>
              <nav>
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/blog/category/${encodeURIComponent(cat.toLowerCase())}`}
                    style={linkStyle}
                  >
                    {cat}
                  </Link>
                ))}
                {categories.length === 0 && (
                  <Link href="/blog" style={linkStyle}>
                    All Articles
                  </Link>
                )}
              </nav>
            </div>

            {/* Company column */}
            <div>
              <h4 style={columnHeaderStyle}>Company</h4>
              <nav>
                <Link href="/about" style={linkStyle}>
                  About
                </Link>
                <Link href="/contact" style={linkStyle}>
                  Contact
                </Link>
                <Link href="/privacy" style={linkStyle}>
                  Privacy
                </Link>
                <Link href="/terms" style={linkStyle}>
                  Terms
                </Link>
              </nav>
            </div>

            {/* Connect column */}
            <div>
              <h4 style={columnHeaderStyle}>Connect</h4>
              <nav>
                <Link href="/newsletter" style={linkStyle}>
                  Newsletter
                </Link>
              </nav>
            </div>
          </div>

          {/* Copyright */}
          <div
            style={{
              borderTop: '1px solid #333',
              marginTop: '40px',
              paddingTop: '16px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                color: '#666',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-sans)',
                margin: 0,
              }}
            >
              &copy; {new Date().getFullYear()} {brandName}. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
