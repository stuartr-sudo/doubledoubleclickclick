import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with SEWO. Let us help you get discovered by AI-powered search.',
  openGraph: {
    title: 'Contact Us | SEWO',
    description: 'Get in touch with SEWO. Let us help you get discovered by AI-powered search.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us | SEWO',
    description: 'Get in touch with SEWO.',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

