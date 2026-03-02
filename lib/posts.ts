/**
 * Blog post queries - reads from Doubleclicker's multi-tenant blog_posts table.
 * Replaces the old single-tenant site_posts table.
 */

import { createServiceClient } from '@/lib/supabase/service'
import { getTenantConfig } from '@/lib/tenant'

export interface BlogPost {
  id: string
  title: string
  slug: string
  content?: string
  excerpt?: string
  featured_image?: string | null
  category?: string | null
  tags?: string[]
  status?: string
  user_name?: string
  meta_title?: string | null
  meta_description?: string | null
  focus_keyword?: string | null
  generated_llm_schema?: string | null
  export_seo_as_tags?: boolean
  is_pillar?: boolean
  author?: string | null
  // Doubleclicker uses created_date/updated_date; normalize here
  created_date?: string
  updated_date?: string
  published_date?: string | null
}

const POST_LIST_COLUMNS = [
  'id', 'title', 'slug', 'excerpt', 'meta_description',
  'featured_image', 'category', 'tags', 'status', 'user_name',
  'created_date', 'updated_date', 'published_date', 'is_pillar', 'author',
].join(', ')

const POST_FULL_COLUMNS = [
  POST_LIST_COLUMNS,
  'content', 'meta_title', 'focus_keyword',
  'generated_llm_schema', 'export_seo_as_tags',
].join(', ')

export async function getPublishedPosts(limit = 50): Promise<BlogPost[]> {
  const { username } = getTenantConfig()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('blog_posts')
    .select(POST_LIST_COLUMNS)
    .eq('user_name', username)
    .eq('status', 'published')
    .order('published_date', { ascending: false, nullsFirst: false })
    .order('created_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }
  return (data || []) as unknown as BlogPost[]
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { username } = getTenantConfig()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('blog_posts')
    .select(POST_FULL_COLUMNS)
    .eq('user_name', username)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) return null
  return data as unknown as BlogPost
}

/**
 * Get featured/pillar posts. Falls back to most recent if fewer than 2 pillar posts.
 */
export async function getFeaturedPosts(limit = 4): Promise<BlogPost[]> {
  const { username } = getTenantConfig()
  const supabase = createServiceClient()

  const { data: pillarPosts } = await supabase
    .from('blog_posts')
    .select(POST_LIST_COLUMNS)
    .eq('user_name', username)
    .eq('status', 'published')
    .eq('is_pillar', true)
    .order('published_date', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (pillarPosts && pillarPosts.length >= 2) {
    return pillarPosts as unknown as BlogPost[]
  }

  // Fallback: most recent posts
  const { data: recentPosts } = await supabase
    .from('blog_posts')
    .select(POST_LIST_COLUMNS)
    .eq('user_name', username)
    .eq('status', 'published')
    .order('published_date', { ascending: false, nullsFirst: false })
    .order('created_date', { ascending: false })
    .limit(limit)

  return (recentPosts || []) as unknown as BlogPost[]
}

export interface CategoryWithCount {
  name: string
  count: number
}

/**
 * Get all unique categories with post counts for the current tenant.
 */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const { username } = getTenantConfig()
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('blog_posts')
    .select('category')
    .eq('user_name', username)
    .eq('status', 'published')
    .not('category', 'is', null)

  if (!data) return []

  const countMap = new Map<string, number>()
  for (const row of data) {
    if (row.category) {
      countMap.set(row.category, (countMap.get(row.category) || 0) + 1)
    }
  }

  return Array.from(countMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Helper to get the display date for a post.
 */
export function getPostDate(post: BlogPost): string {
  return post.published_date || post.created_date || new Date().toISOString()
}

/**
 * Estimate reading time in minutes based on content length.
 */
export function estimateReadTime(post: BlogPost): number {
  const text = post.content || post.excerpt || post.meta_description || ''
  const wordCount = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}
