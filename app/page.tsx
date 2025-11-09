import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HomePageClient from './HomePageClient'

export default async function HomePage() {
  const supabase = await createClient()
  
  // Fetch homepage content
  const { data: homepageContent } = await supabase
    .from('homepage_content')
    .select('*')
    .single()
  
  // Fetch latest blog posts for homepage preview
  const { data: latestPosts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, meta_description, featured_image, created_date')
    .eq('status', 'published')
    .order('created_date', { ascending: false })
    .limit(3)

  const demoLatest = [
    {
      id: 'demo-1',
      title: 'How to build a startup from scratch',
      slug: 'how-to-build-a-startup-from-scratch',
      meta_description:
        'A practical walkthrough on validating ideas, building the first version, and reaching product‑market fit.',
      featured_image:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
      created_date: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      title: 'Mastering the art of pitching your business idea',
      slug: 'mastering-the-art-of-pitching-your-business-idea',
      meta_description:
        'Structure, narrative, and visuals that make investors and customers say yes.',
      featured_image:
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop',
      created_date: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'demo-3',
      title: 'Turning your passion into a full‑time career',
      slug: 'turning-your-passion-into-a-full-time-career',
      meta_description:
        'Playbooks for creators to monetize, build audience, and scale sustainably.',
      featured_image:
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop',
      created_date: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
  ]

  const latest = latestPosts && latestPosts.length > 0 ? latestPosts : demoLatest

  return <HomePageClient latestPosts={latest} homepageContent={homepageContent} />
}
