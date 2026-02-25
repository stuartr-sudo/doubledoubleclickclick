import NetworkForm from '@/components/NetworkForm'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Create Site Network',
  robots: 'noindex, nofollow',
}

export default function AdminNetworkPage() {
  return <NetworkForm />
}
