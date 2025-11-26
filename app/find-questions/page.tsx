import { createClient } from '@/lib/supabase/server'
import FindQuestionsClient from './FindQuestionsClient'
import type { Metadata } from 'next'
import Script from 'next/script'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: homepageContent } = await supabase
    .from('homepage_content')
    .select('find_questions_title, find_questions_description')
    .single()

  const title = homepageContent?.find_questions_title || 'Discover What Questions Your Prospects Are Asking | SEWO'
  const description = homepageContent?.find_questions_description || 'Enter a keyword and discover the top questions people are asking. Answer them before your competitors do.'

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sewo.io'

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/find-questions`,
      siteName: 'SEWO',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${siteUrl}/find-questions`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function FindQuestionsLandingPage() {
  const supabase = await createClient()
  
  const { data: homepageContent } = await supabase
    .from('homepage_content')
    .select(`
      find_questions_title,
      find_questions_description,
      questions_discovery_cta_text,
      hero_cta_bg_color,
      hero_cta_text_color,
      ai_fact_1,
      ai_fact_2,
      ai_fact_3,
      ai_fact_4,
      ai_fact_5
    `)
    .single()

  const title = homepageContent?.find_questions_title || 'Discover What Questions Your Prospects Are Asking'
  const description = homepageContent?.find_questions_description || 'Enter a keyword and discover the top questions people are asking. Answer them before your competitors do.'
  const ctaText = homepageContent?.questions_discovery_cta_text || 'Book a Discovery Call'

  // Collect AI facts, filtering out null/empty values
  const aiFacts = [
    homepageContent?.ai_fact_1,
    homepageContent?.ai_fact_2,
    homepageContent?.ai_fact_3,
    homepageContent?.ai_fact_4,
    homepageContent?.ai_fact_5,
  ].filter((fact): fact is string => Boolean(fact && fact.trim()))

  // Fallback AI facts if none are set
  const defaultAiFacts = [
    'Did you know? Over 85% of consumers use AI-powered search before making purchase decisions.',
    'ChatGPT reaches 100 million users in just 2 months - the fastest growing app in history.',
    'Brands optimized for AI discovery see up to 300% more referral traffic.',
    'By 2025, 50% of all searches will be conducted through AI assistants.',
    'AI citations drive 4x higher conversion rates than traditional search results.'
  ]

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sewo.io'

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: description,
    url: `${siteUrl}/find-questions`,
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'Question Discovery Tool',
      description: 'Discover the top questions your prospects are asking about your keywords',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  }

  return (
    <>
      <Script
        id="schema-find-questions"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FindQuestionsClient 
        title={title}
        description={description}
        ctaText={ctaText}
        aiFacts={aiFacts.length > 0 ? aiFacts : defaultAiFacts}
        heroCTABgColor={homepageContent?.hero_cta_bg_color || '#000000'}
        heroCTATextColor={homepageContent?.hero_cta_text_color || '#ffffff'}
      />
    </>
  )
}

