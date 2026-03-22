import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Analytics from '@/components/Analytics'
import CookieConsent from '@/components/CookieConsent'
import StructuredData from '@/components/StructuredData'
import BrandStyles from '@/components/BrandStyles'
import Footer from '@/components/Footer'
import { ThemeHeader } from '@/components/themes/ThemeRenderer'
import { getCategories } from '@/components/CategoryNav'
import Script from 'next/script'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export async function generateMetadata(): Promise<Metadata> {
  const config = getTenantConfig()
  let description = ''

  try {
    const brand = await getBrandData()
    description = brand.company?.blurb || brand.guidelines?.brand_personality || ''
  } catch {
    // Fall back to empty description if DB is unavailable
  }

  return {
    title: {
      default: config.siteName,
      template: `%s | ${config.siteName}`,
    },
    description,
    metadataBase: new URL(config.siteUrl),
    alternates: {
      canonical: '/',
    },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: 'any' },
      ],
      apple: '/apple-touch-icon.png',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: config.siteUrl,
      siteName: config.siteName,
      title: config.siteName,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: config.siteName,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const config = getTenantConfig()
  const gtmId = config.gtmId

  // Read theme + brand data for header
  let themeName = 'editorial'
  let brandName = config.siteName
  let logoUrl: string | undefined
  let tagline = ''
  let categories: string[] = []
  try {
    const brand = await getBrandData()
    themeName = brand.specs?.theme || 'editorial'
    brandName = brand.guidelines?.name || config.siteName
    logoUrl = brand.specs?.logo_url || undefined
    tagline = brand.company?.blurb || ''
  } catch {}
  try {
    categories = await getCategories()
  } catch {
    categories = []
  }

  return (
    <html lang="en" className={inter.variable} data-theme={themeName}>
      <head>
        <BrandStyles />
        {gtmId && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        )}
      </head>
      <body className="antialiased">
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}

        <Analytics />
        <CookieConsent />
        <StructuredData />
        <ThemeHeader
          theme={themeName}
          brandName={brandName}
          logoUrl={logoUrl}
          tagline={tagline}
          categories={categories}
        />
        {children}
        <Footer />
      </body>
    </html>
  )
}
