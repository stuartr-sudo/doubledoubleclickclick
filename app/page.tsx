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
  
  // Fetch latest blog posts for homepage preview (limit to 6 since we only show 6)
  const { data: latestPosts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, meta_description, featured_image, created_date')
    .eq('status', 'published')
    .order('created_date', { ascending: false })
    .limit(6)

  // Only use real posts from database
  const latest = latestPosts || []

  return <HomePageClient latestPosts={latest} homepageContent={homepageContent} />
}
