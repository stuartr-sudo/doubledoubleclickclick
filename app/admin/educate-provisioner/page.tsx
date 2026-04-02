import type { Metadata } from 'next'
import EducateProvisioner from './EducateProvisioner'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Provisioner Guide',
  robots: 'noindex, nofollow',
}

export default function EducateProvisionerPage() {
  return <EducateProvisioner />
}
