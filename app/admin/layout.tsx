import { AdminAuthCheck } from '@/components/AdminAuthCheck'
import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAuthCheck>{children}</AdminAuthCheck>
}
