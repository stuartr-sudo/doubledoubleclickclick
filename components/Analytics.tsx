'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export default function Analytics() {
  const GA_MEASUREMENT_ID = 'G-TT58X7D8RV'

  useEffect(() => {
    const init = async () => {
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
      if (!key) return
      try {
        const mod = await import('posthog-js').catch(() => null)
        if (!mod?.default) return
        const ph = mod.default
        ph.init(key as string, { api_host: host, capture_pageview: true })
        ph.capture('$pageview')
      } catch {
        // Silently ignore if posthog-js is not installed
      }
    }
    init()
  }, [])

  return (
    <>
      {/* Google Analytics with consent mode */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          
          // Set default consent to 'denied' (GDPR compliant)
          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'wait_for_update': 500
          });
          
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            'anonymize_ip': true
          });
        `}
      </Script>
    </>
  )
}


