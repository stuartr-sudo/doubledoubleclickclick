import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * SEO / indexing hardening:
 * - Force a single canonical host (www)
 * - Cleanly handle legacy Shopify-style URLs that Google still tries to crawl
 *   (return redirects or 410 Gone instead of noisy 403/soft-404 signals)
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const url = req.nextUrl.clone()

  // Force canonical host (helps "duplicate without canonical" + "page with redirect" noise)
  // Note: protocol will be respected by the platform; we set https for safety.
  if (host === 'sewo.io') {
    url.host = 'www.sewo.io'
    url.protocol = 'https:'
    url.port = ''   // strip internal container port (e.g. 3000) from the redirect
    return NextResponse.redirect(url, 308)
  }

  const pathname = req.nextUrl.pathname
  const lowerPath = pathname.toLowerCase()

  // Known legacy paths from the previous site that should redirect to modern equivalents.
  if (lowerPath === '/pages/contact') {
    url.pathname = '/contact'
    url.search = ''
    return NextResponse.redirect(url, 301)
  }

  if (lowerPath === '/blogs/news.atom') {
    url.pathname = '/blog'
    url.search = ''
    return NextResponse.redirect(url, 301)
  }

  if (lowerPath === '/collections/frontpage' || lowerPath === '/collections/frontpage.atom') {
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url, 301)
  }

  // Refactor: Redirect old service pages to new Consulting page
  if (lowerPath === '/agencies' || lowerPath === '/enterprise') {
    url.pathname = '/consulting'
    url.search = ''
    return NextResponse.redirect(url, 301)
  }

  // Legacy endpoints that should be treated as gone (helps Google drop them faster).
  const gonePaths = new Set<string>([
    '/dashboard',
    '/cart',
    '/adminseo',
    '/adminllm',
    '/waitlistmanager',
    '/midjourneyapidocs',
    '/v1/produce',
    '/policies/contact-information',
    '/policies/terms-of-service',
  ])

  if (gonePaths.has(lowerPath)) {
    return new NextResponse('Gone', {
      status: 410,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        // Cache to reduce repeated crawl pressure; CDN will keep it cheap.
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /**
     * Exclude Next.js internals and common static files.
     * We still allow /robots.txt and /sitemap*.xml to be handled normally.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}


