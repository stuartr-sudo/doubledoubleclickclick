import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Guard admin app routes with a lightweight cookie check.
// API routes perform full verification; here we only gate the UI and redirect to login.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /admin pages, excluding the login page itself
  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginRoute = pathname.startsWith('/admin/login')

  if (isAdminRoute && !isLoginRoute) {
    const session = request.cookies.get('admin_session')?.value
    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('next', pathname + request.nextUrl.search)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}


