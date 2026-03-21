import Link from 'next/link'
import Image from 'next/image'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'

export default async function Masthead() {
  const config = getTenantConfig()
  let siteName = config.siteName
  let logoUrl: string | null = null

  try {
    const brand = await getBrandData()
    siteName = brand.guidelines?.name || config.siteName
    logoUrl = brand.specs?.logo_url || null
  } catch {
    // Fall back to env config
  }

  return (
    <div
      style={{
        borderTop: '3px double #1a1a1a',
        borderBottom: '3px double #1a1a1a',
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
              alt={siteName}
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
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-5xl)',
                fontWeight: 700,
                letterSpacing: '-1px',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {siteName}
            </h1>
          )}
        </Link>
      </div>
    </div>
  )
}
