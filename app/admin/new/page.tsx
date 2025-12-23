import { AdminProtected } from '@/components/AdminProtected'
import NewPostClient from './NewPostClient'

export default function NewPostPage() {
  return (
    <AdminProtected>
      <NewPostClient />
    </AdminProtected>
  )
}


