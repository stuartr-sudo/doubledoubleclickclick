import AdminPageWrapper from './AdminPageWrapper'
import { AdminProtected } from '@/components/AdminProtected'

export default function AdminPage() {
  return (
    <AdminProtected>
      <AdminPageWrapper />
    </AdminProtected>
  )
}
