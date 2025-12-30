import HomePageNew from './HomePageNew'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import './homepage-new.css'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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

export default async function HomePage() {
  const supabase = await createClient()
  
  // Fetch blog posts for homepage preview (limit to 6)
  // We prioritize 'popular' posts if they are flagged, then fall back to latest by published date
  const { data: allPosts } = await supabase
    .from('site_posts')
    .select('id, title, slug, meta_description, featured_image, created_date, published_date, is_popular')
    .eq('status', 'published')
    .limit(50) // Fetch enough to sort manually

  const sortedPosts = (allPosts || []).sort((a, b) => {
    // 1. Popular first
    if (a.is_popular && !b.is_popular) return -1
    if (!a.is_popular && b.is_popular) return 1
    
    // 2. Then by published_date (or created_date) newest first
    const dateA = new Date(a.published_date || a.created_date).getTime()
    const dateB = new Date(b.published_date || b.created_date).getTime()
    return dateB - dateA
  })

  const latestPosts = sortedPosts.slice(0, 6)

  return <HomePageNew latestPosts={latestPosts} />
}
