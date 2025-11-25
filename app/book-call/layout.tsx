import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book a Discovery Call | SEWO - LLM Optimization Experts',
  description: 'Schedule your free 15-minute discovery call to learn how to get your brand discovered by AI and increase your referral traffic.',
  openGraph: {
    title: 'Book a Discovery Call | SEWO',
    description: 'Schedule your free 15-minute discovery call to learn how to get your brand discovered by AI.',
    type: 'website',
  },
}

export default function BookCallLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

