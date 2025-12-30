import HomePageNew from './HomePageNew'
import type { Metadata } from 'next'
import './homepage-new.css'

export const metadata: Metadata = {
  title: 'AI Visibility Diagnostic | Make Your Brand the Answer AI Suggests',
  description: 'AI is rewriting how customers discover brands. Get a clarity-first diagnostic to understand why AI systems are not surfacing you - and a clear plan to fix it.',
  alternates: {
    canonical: 'https://www.sewo.io',
  },
  openGraph: {
    title: 'AI Visibility Diagnostic | SEWO',
    description: 'Make your brand the answer AI suggests. Get clarity, prioritisation, and a 90-day roadmap.',
    type: 'website',
    url: 'https://www.sewo.io',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Visibility Diagnostic | SEWO',
    description: 'Make your brand the answer AI suggests. Get clarity on why AI is not recommending you.',
  },
}

export default function HomePage() {
  return <HomePageNew />
}
