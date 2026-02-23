import type { Metadata } from 'next'
import { getTenantConfig } from '@/lib/tenant'

export async function generateMetadata(): Promise<Metadata> {
  const config = getTenantConfig()
  return {
    title: `Contact Us | ${config.siteName}`,
    description: `Get in touch with ${config.siteName}. We'd love to hear from you.`,
    openGraph: {
      title: `Contact Us | ${config.siteName}`,
      description: `Get in touch with ${config.siteName}. We'd love to hear from you.`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `Contact Us | ${config.siteName}`,
      description: `Get in touch with ${config.siteName}.`,
    },
  }
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
