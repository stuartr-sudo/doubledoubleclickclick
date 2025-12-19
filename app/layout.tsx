import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Analytics from '@/components/Analytics'
import CookieConsent from '@/components/CookieConsent'
import StructuredData from '@/components/StructuredData'
import Script from 'next/script'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'SEWO - Get Found Everywhere',
    template: '%s | SEWO',
  },
  description: 'Make your brand the answer AI suggests. Expert LLM ranking optimization to boost your visibility in AI-powered search.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sewo.io'),
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
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sewo.io',
    siteName: 'SEWO',
    title: 'SEWO - Get Found Everywhere',
    description: 'Make your brand the answer AI suggests. Expert LLM ranking optimization to boost your visibility in AI-powered search.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEWO - Get Found Everywhere',
    description: 'Make your brand the answer AI suggests. Expert LLM ranking optimization to boost your visibility in AI-powered search.',
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
      </body>
    </html>
  )
}

