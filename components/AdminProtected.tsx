import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth'

export async function AdminProtected({ children }: { children: React.ReactNode }) {
  const { authenticated } = await verifySession()

  if (!authenticated) {
    redirect('/admin/login')
  }

  return <>{children}</>
}

