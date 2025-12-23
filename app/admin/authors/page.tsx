import { AdminProtected } from '@/components/AdminProtected'
import AuthorsAdminClient from './AuthorsAdminClient'

export default function AuthorsAdminPage() {
  return (
    <AdminProtected>
      <AuthorsAdminClient />
    </AdminProtected>
  )
}


