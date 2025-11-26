import { createClient } from '@/lib/supabase/server'
import QuizLandingClient from './QuizLandingClient'
import type { Metadata } from 'next'
import Script from 'next/script'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: homepageContent } = await supabase
    .from('homepage_content')
    .select('quiz_landing_title, quiz_landing_description')
    .single()

  const title = homepageContent?.quiz_landing_title || 'Discover Your AI Visibility Score | SEWO'
  const description = homepageContent?.quiz_landing_description || 'Take our 3-minute assessment to see how visible your brand is to AI assistants like ChatGPT, Claude, and Gemini.'

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sewo.io'

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/quiz`,
      siteName: 'SEWO',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${siteUrl}/quiz`,
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

export default async function QuizLandingPage() {
  const supabase = await createClient()
  
  const { data: homepageContent } = await supabase
    .from('homepage_content')
    .select('quiz_landing_title, quiz_landing_description, hero_cta_bg_color, hero_cta_text_color')
    .single()

  const title = homepageContent?.quiz_landing_title || 'Discover Your AI Visibility Score'
  const description = homepageContent?.quiz_landing_description || 'Take our 3-minute assessment to see how visible your brand is to AI assistants like ChatGPT, Claude, and Gemini.'

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sewo.io'

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: description,
    url: `${siteUrl}/quiz`,
    mainEntity: {
      '@type': 'Assessment',
      name: 'AI Visibility Score Assessment',
      description: 'A 3-minute quiz to assess your brand\'s visibility in AI-powered search results',
      educationalLevel: 'Beginner',
      learningResourceType: 'Quiz',
    },
  }

  return (
    <>
      <Script
        id="schema-quiz"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <QuizLandingClient 
        title={title}
        description={description}
        heroCTABgColor={homepageContent?.hero_cta_bg_color || '#000000'}
        heroCTATextColor={homepageContent?.hero_cta_text_color || '#ffffff'}
      />
    </>
  )
}

