import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Generic middleware for multi-tenant blog sites:
 * - Force canonical host (apex -> www redirect)
 * - Handle common legacy paths
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  // Force canonical host: redirect apex domain to www
  if (siteUrl) {
    try {
      const canonical = new URL(siteUrl)
      const canonicalHost = canonical.hostname
      const requestHost = host.replace(/:\d+$/, '')

      if (canonicalHost.startsWith('www.') && requestHost === canonicalHost.replace('www.', '')) {
        const url = req.nextUrl.clone()
        url.host = canonicalHost
        url.protocol = 'https:'
        url.port = ''
        return NextResponse.redirect(url, 308)
      }
    } catch {
      // Invalid SITE_URL, skip redirect
    }
  }

  const lowerPath = req.nextUrl.pathname.toLowerCase()

  if (lowerPath === '/pages/contact') {
    const url = req.nextUrl.clone()
    url.pathname = '/contact'
    url.search = ''
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
