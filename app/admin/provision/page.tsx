import ProvisionForm from '@/components/ProvisionForm'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Provision New Brand',
  robots: 'noindex, nofollow',
}

export default function AdminProvisionPage() {
  return <ProvisionForm />
}
