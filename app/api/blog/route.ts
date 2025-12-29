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
      postId, post_id, external_id,
      title, slug, content, html, content_html, status,
      meta_title, meta_description, focus_keyword, excerpt,
      category, tags, author, featured_image,
      generated_llm_schema, export_seo_as_tags, user_name
    } = body

    // Normalize identifier - MUST have one
    const finalExternalId = postId || post_id || external_id
    if (!finalExternalId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required field: "postId".' 
      }, { status: 400 })
    }

    // Normalize content
    const finalContent = content || html || content_html

    // 2. Normalize Status (BE FUCKING CLEAR: Anything not explicitly 'draft' is 'published')
    const incomingStatus = String(status || '').toLowerCase().trim()
    const isExplicitDraft = ['draft', 'unpublish', 'false', '0'].includes(incomingStatus)
    const isPublished = !isExplicitDraft

    // ═══════════════════════════════════════════════════════════════════════
    // CASE A: UNPUBLISHING (Status is explicitly DRAFT)
    // ═══════════════════════════════════════════════════════════════════════
    if (!isPublished) {
      console.log(`[${requestId}] 🗑️ UNPUBLISH REQUEST: Deleting post with external_id: ${finalExternalId}`)
      const { error: deleteError } = await supabase
        .from('site_posts')
        .delete()
        .eq('external_id', finalExternalId)
      
      if (deleteError) {
        console.error(`[${requestId}] ❌ Delete error:`, deleteError)
        return NextResponse.json({ success: false, error: 'Failed to unpublish post' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Post successfully unpublished (removed from live site)',
        operation: 'delete',
        api_version: 'SEWO-v3-FIXED'
      }, { status: 200 })
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CASE B: PUBLISHING (Status is PUBLISHED or not provided)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Validate required content for publishing
    if (!title || !finalContent) {
      return NextResponse.json({ success: false, error: 'Title and content are required for publishing.' }, { status: 400 })
    }

    // Prepare data for site_posts
    const postData: any = {
      external_id: finalExternalId,
      title: title.trim(),
      content: finalContent,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      status: 'published', // FORCE published status in DB
      updated_date: new Date().toISOString(),
      user_name: user_name || 'SEWO'
    }

    // Add optional fields ONLY if provided in payload (don't overwrite with null/empty)
    if (tags !== undefined) postData.tags = Array.isArray(tags) ? tags : []
    if (featured_image) postData.featured_image = featured_image
    if (author) postData.author = author
    if (meta_title) postData.meta_title = meta_title
    if (meta_description) postData.meta_description = meta_description
    if (focus_keyword) postData.focus_keyword = focus_keyword
    if (excerpt) postData.excerpt = excerpt
    if (generated_llm_schema) postData.generated_llm_schema = generated_llm_schema
    if (typeof export_seo_as_tags === 'boolean') postData.export_seo_as_tags = export_seo_as_tags
    
    // Category is optional - only include if provided
    if (category) {
      postData.category = category
    }

    // Set published_date
    postData.published_date = new Date().toISOString()

    console.log(`[${requestId}] 🚀 UPSERTING POST: ${finalExternalId} (${postData.title})`)

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
      },
      api_version: 'SEWO-v3-FIXED'
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
  const requestId = `GET-${Date.now()}`
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const category = searchParams.get('category')

    console.log(`[${requestId}] 🔍 FETCHING POSTS FROM site_posts (limit: ${limit})`)

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
