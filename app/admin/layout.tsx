import { ReactNode } from 'react'

// Layout for /admin routes. Protection is applied per-page so that /admin/login
// remains accessible and does not get caught in a redirect loop.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
