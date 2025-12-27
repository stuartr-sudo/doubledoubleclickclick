import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const revalidate = 0

/**
 * POST /api/blog - Create, Update, or Unpublish a blog post
 * 
 * THE RULES (FOR SEWO ONLY):
 * 1. ONLY use 'site_posts' table. Never touch 'blog_posts'.
 * 2. If status is 'published':
 *    - Check if postId (external_id) exists.
 *    - If exists: UPDATE the record.
 *    - If not: INSERT new record.
 * 3. If status is 'draft':
 *    - Check if postId (external_id) exists.
 *    - If exists: DELETE the record (this is "unpublishing").
 *    - If not: Do nothing (ignore it, we don't store drafts).
 */
export async function POST(request: Request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
  
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    
    console.log(`[${requestId}] 📥 SEWO API REQUEST RECEIVED`)
    
    // 1. Extract and Normalize Fields
    const {
      postId, title, slug, content, status,
      meta_title, meta_description, focus_keyword, excerpt,
      category, tags, author, featured_image,
      generated_llm_schema, export_seo_as_tags, user_name, is_popular
    } = body

    // We MUST have an identifier to know which post to update/unpublish
    if (!postId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required field: "postId". This is our unique identifier for updates and unpublishing.' 
      }, { status: 400 })
    }

    // 2. Normalize Status
    const normalizedStatus = String(status || 'published').toLowerCase().trim()
    const isPublished = ['published', 'publish', 'active', 'live', 'true', '1'].includes(normalizedStatus)

    // ═══════════════════════════════════════════════════════════════════════
    // CASE A: UNPUBLISHING (Status is DRAFT)
    // ═══════════════════════════════════════════════════════════════════════
    if (!isPublished) {
      console.log(`[${requestId}] 🗑️ UNPUBLISH REQUEST: Deleting post with external_id: ${postId}`)
      const { error: deleteError } = await supabase
        .from('site_posts')
        .delete()
        .eq('external_id', postId)
      
      if (deleteError) {
        console.error(`[${requestId}] ❌ Delete error:`, deleteError)
        return NextResponse.json({ success: false, error: 'Failed to unpublish post' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Post successfully unpublished (removed from database)',
        operation: 'delete'
      }, { status: 200 })
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CASE B: PUBLISHING (Status is PUBLISHED)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Validate required content for publishing
    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Title and content are required for publishing.' }, { status: 400 })
    }

    // Prepare data for site_posts
    const postData: any = {
      external_id: postId,
      title: title.trim(),
      content: content,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      status: 'published',
      updated_date: new Date().toISOString(),
      user_name: user_name || 'SEWO'
    }

    // Add optional fields if provided
    if (category !== undefined) postData.category = category
    if (tags !== undefined) postData.tags = Array.isArray(tags) ? tags : []
    if (featured_image !== undefined) postData.featured_image = featured_image
    if (author !== undefined) postData.author = author
    if (meta_title !== undefined) postData.meta_title = meta_title
    if (meta_description !== undefined) postData.meta_description = meta_description
    if (focus_keyword !== undefined) postData.focus_keyword = focus_keyword
    if (excerpt !== undefined) postData.excerpt = excerpt
    if (generated_llm_schema !== undefined) postData.generated_llm_schema = generated_llm_schema
    if (typeof export_seo_as_tags === 'boolean') postData.export_seo_as_tags = export_seo_as_tags
    if (typeof is_popular === 'boolean') postData.is_popular = is_popular

    // Set published_date if not already set (upsert handles this carefully)
    postData.published_date = new Date().toISOString()

    console.log(`[${requestId}] 🚀 UPSERTING POST: ${postId} (${postData.title})`)

    const { data, error } = await supabase
      .from('site_posts')
      .upsert(postData, { onConflict: 'external_id' })
      .select()
      .single()

    if (error) {
      console.error(`[${requestId}] ❌ Upsert error:`, error)
      return NextResponse.json({ success: false, error: 'Failed to publish post', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
        slug: data.slug,
        status: data.status,
        operation: 'upsert'
      }
    }, { status: 200 })

  } catch (error) {
    console.error(`[${requestId}] ❌ FATAL ERROR:`, error)
    return NextResponse.json({ success: false, error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}

/**
 * GET /api/blog - Fetch blog posts (SEWO ONLY)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const category = searchParams.get('category')

    // Always only read from site_posts
    const query = supabase
      .from('site_posts')
      .select('*')
      .order('published_date', { ascending: false, nullsFirst: false })
      .order('created_date', { ascending: false })
      .limit(limit)

    if (category) {
      query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] }, { status: 200 })
  } catch (error) {
    console.error('[BLOG API] GET error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
