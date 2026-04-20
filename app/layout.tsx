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
  let brandSpecs: { logo_url?: string | null } | null = null

  try {
    const brand = await getBrandData()
    description = brand.company?.blurb || brand.guidelines?.brand_personality || ''
    brandSpecs = brand.specs
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
    icons: (() => {
      // Prefer the brand logo as favicon when configured (multi-tenant).
      // Falls back to the bundled defaults for the base/admin app.
      const brandFavicon = brandSpecs?.logo_url
      if (brandFavicon) {
        return {
          icon: [{ url: brandFavicon }],
          apple: brandFavicon,
        }
      }
      return {
        icon: [
          { url: '/favicon.svg', type: 'image/svg+xml' },
          { url: '/favicon.ico', sizes: 'any' },
        ],
        apple: '/apple-touch-icon.png',
      }
    })(),
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
    tagline = brand.guidelines?.tagline || brand.company?.blurb || ''
  } catch {}
  try {
    categories = await getCategories()
  } catch {
    categories = []
  }

  // Header nav pages — sensible defaults (Blog, About, Contact) plus any
  // tenant-specific overrides from app_settings.static_pages.menu_items.
  // Provisioner can seed: { menu_items: [{ label: "School", href: "/school" }, ...] }
  let pages: { label: string; href: string }[] = []
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js')
      const supa = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
      const { data } = await supa
        .from('app_settings')
        .select('setting_value')
        .eq('setting_name', `static_pages:${config.username}`)
        .maybeSingle()
      const sv = data?.setting_value as Record<string, unknown> | null
      const customMenu = sv && Array.isArray(sv.menu_items) ? sv.menu_items as { label: string; href: string }[] : null
      if (customMenu && customMenu.length > 0) {
        pages = customMenu.filter(p => p && typeof p.label === 'string' && typeof p.href === 'string')
      }
    }
  } catch {}
  if (pages.length === 0) {
    pages = [
      { label: 'Blog', href: '/blog' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ]
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
          pages={pages}
        />
        {children}
        <Footer />
      </body>
    </html>
  )
}
