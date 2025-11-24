import { ReactNode } from 'react'
import { AdminProtected } from '@/components/AdminProtected'

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Protect all /admin routes behind the existing admin login/session system.
  // This does not touch the public homepage in any way.
  return <AdminProtected>{children}</AdminProtected>
}
