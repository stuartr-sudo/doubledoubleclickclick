import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 0

/**
 * GET /api/blog/debug - Diagnostic endpoint to see what's in the database
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get total count
    const { count: totalCount } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
    
    // Get ghost posts (no content or short content)
    const { data: ghostPosts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, created_date, status')
      .or('content.is.null,slug.is.null')
      .order('created_date', { ascending: false })
      .limit(20)
    
    // Get posts with short content (less than 50 chars)
    const { data: shortContentPosts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content, created_date')
      .order('created_date', { ascending: false })
      .limit(50)
    
    // Filter short content posts in JS (since we can't do LENGTH() in Supabase easily)
    const shortPosts = (shortContentPosts || []).filter(p => 
      !p.content || p.content.trim().length < 50
    )
    
    // Get recent posts (last 10)
    const { data: recentPosts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, created_date, status')
      .order('created_date', { ascending: false })
      .limit(10)
    
    // Get duplicate titles
    const { data: allPosts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, created_date')
      .order('created_date', { ascending: false })
    
    const titleCounts: Record<string, any[]> = {}
    for (const post of allPosts || []) {
      const normalizedTitle = post.title?.toLowerCase().trim() || ''
      if (!titleCounts[normalizedTitle]) {
        titleCounts[normalizedTitle] = []
      }
      titleCounts[normalizedTitle].push(post)
    }
    
    const duplicateTitles = Object.entries(titleCounts)
      .filter(([_, posts]) => posts.length > 1)
      .map(([title, posts]) => ({
        title,
        count: posts.length,
        posts: posts.map(p => ({
          id: p.id,
          slug: p.slug,
          created_date: p.created_date
        }))
      }))
    
    return NextResponse.json({
      summary: {
        total_posts: totalCount || 0,
        ghost_posts_count: ghostPosts?.length || 0,
        short_content_posts_count: shortPosts.length,
        duplicate_title_groups: duplicateTitles.length
      },
      ghost_posts: ghostPosts || [],
      short_content_posts: shortPosts.slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        content_length: p.content?.length || 0,
        created_date: p.created_date
      })),
      recent_posts: recentPosts || [],
      duplicate_titles: duplicateTitles.slice(0, 5)
    }, { status: 200 })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug info', details: String(error) },
      { status: 500 }
    )
  }
}

