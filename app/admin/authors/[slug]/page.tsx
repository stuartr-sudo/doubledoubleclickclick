import { AdminProtected } from '@/components/AdminProtected'
import AuthorEditClient from './AuthorEditClient'

export default function AuthorEditPage({ params }: { params: { slug: string } }) {
  return (
    <AdminProtected>
      <AuthorEditClient slug={params.slug} />
    </AdminProtected>
  )
}


