import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Analytics from '@/components/Analytics'
import CookieConsent from '@/components/CookieConsent'
import StructuredData from '@/components/StructuredData'
import Footer from '@/components/Footer'
import Script from 'next/script'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Modern Longevity - Modern Knowledge for Longevity',
    template: '%s | Modern Longevity',
  },
  description: 'Information for longevity',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.modernlongevity.co'),
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
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.modernlongevity.co',
    siteName: 'Modern Longevity',
    title: 'Modern Longevity - Modern Knowledge for Longevity',
    description: 'Information for longevity',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Modern Longevity - Modern Knowledge for Longevity',
    description: 'Information for longevity',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-M4RMX5TG');`}
        </Script>
      </head>
      <body className="antialiased">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-M4RMX5TG"
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        
        <Analytics />
        <CookieConsent />
        <StructuredData />
        {children}
        <Footer />
      </body>
    </html>
  )
}

