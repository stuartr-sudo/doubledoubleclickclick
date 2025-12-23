import { AdminProtected } from '@/components/AdminProtected'
import EditPostClient from './EditPostClient'

export default function EditPostPage({ params }: { params: { id: string } }) {
  return (
    <AdminProtected>
      <EditPostClient id={params.id} />
    </AdminProtected>
  )
}

