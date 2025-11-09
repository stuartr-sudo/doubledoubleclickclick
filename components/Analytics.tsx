'use client'

import { useEffect } from 'react'

export default function Analytics() {
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

  return null
}


