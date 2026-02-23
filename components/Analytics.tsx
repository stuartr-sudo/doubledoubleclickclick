'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || ''

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

  if (!gaId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}

          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'wait_for_update': 500
          });

          gtag('js', new Date());
          gtag('config', '${gaId}', {
            'anonymize_ip': true
          });
        `}
      </Script>
    </>
  )
}
