import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HomePageClient from './HomePageClient'
import type { Metadata } from 'next'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'SEWO - Get Found Everywhere | LLM Ranking & AI Search Optimization',
  description: 'Make your brand the answer AI suggests. Expert LLM ranking optimization to boost your visibility in AI-powered search results. Get discovered by ChatGPT, Claude, Gemini & more.',
  openGraph: {
    title: 'SEWO - Get Found Everywhere',
    description: 'Make your brand the answer AI suggests. Expert LLM ranking optimization to boost your visibility in AI-powered search.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEWO - Get Found Everywhere',
    description: 'Make your brand the answer AI suggests. Expert LLM ranking optimization.',
  },
}

export default async function HomePage() {
  const supabase = await createClient()
  
  // Fetch homepage content
  const { data: homepageContent } = await supabase
    .from('homepage_content')
    .select('*')
    .single()
  
  // Fetch blog posts for homepage preview (limit to 6)
  // We prioritize 'popular' posts if they are flagged, then fall back to latest by published date
  const { data: allPosts } = await supabase
    .from('blog_posts')
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

  const latest = sortedPosts.slice(0, 6)

  return <HomePageClient latestPosts={latest} homepageContent={homepageContent} />
}
