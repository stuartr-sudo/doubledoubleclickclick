import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getTenantConfig } from '@/lib/tenant'

export const revalidate = 0

/**
 * POST /api/blog - Create, Update, or Unpublish a blog post
 *
 * Uses blog_posts table with external_id as the upsert key.
 * - status=published (or omitted): upsert the post
 * - status=draft: delete the post (unpublish)
 */
export async function POST(request: Request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`

  try {
    const config = getTenantConfig()
    const supabase = createServiceClient()
    const body = await request.json()

    console.log(`[${requestId}] POST /api/blog received for tenant: ${config.username}`)

    // Extract and normalize fields
    const {
      postId, post_id, external_id,
      title, slug, content, html, content_html, status,
      meta_title, meta_description, focus_keyword, excerpt,
      category, tags, author, featured_image,
      generated_llm_schema, export_seo_as_tags, user_name
    } = body

    const finalExternalId = postId || post_id || external_id
    if (!finalExternalId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: "postId".' },
        { status: 400 }
      )
    }

    const finalContent = content || html || content_html

    // Normalize status
    const incomingStatus = String(status || '').toLowerCase().trim()
    const isExplicitDraft = ['draft', 'unpublish', 'false', '0'].includes(incomingStatus)
    const isPublished = !isExplicitDraft

    // UNPUBLISH: delete from blog_posts
    if (!isPublished) {
      console.log(`[${requestId}] Unpublish: deleting external_id=${finalExternalId}`)
      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('external_id', finalExternalId)
        .eq('user_name', user_name || config.username)

      if (deleteError) {
        console.error(`[${requestId}] Delete error:`, deleteError)
        return NextResponse.json({ success: false, error: 'Failed to unpublish post' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Post successfully unpublished',
        operation: 'delete'
      }, { status: 200 })
    }

    // PUBLISH: upsert into blog_posts
    if (!title || !finalContent) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required for publishing.' },
        { status: 400 }
      )
    }

    const postData: Record<string, unknown> = {
      external_id: finalExternalId,
      title: title.trim(),
      content: finalContent,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      status: 'published',
      updated_date: new Date().toISOString(),
      published_date: new Date().toISOString(),
      user_name: user_name || config.username
    }

    if (tags !== undefined) postData.tags = Array.isArray(tags) ? tags : []
    if (featured_image) postData.featured_image = featured_image
    if (author) postData.author = author
    if (meta_title) postData.meta_title = meta_title
    if (meta_description) postData.meta_description = meta_description
    if (focus_keyword) postData.focus_keyword = focus_keyword
    if (excerpt) postData.excerpt = excerpt
    if (category) postData.category = category
    if (generated_llm_schema) postData.generated_llm_schema = generated_llm_schema
    if (typeof export_seo_as_tags === 'boolean') postData.export_seo_as_tags = export_seo_as_tags

    console.log(`[${requestId}] Upserting post: ${finalExternalId} (${postData.title})`)

    const { data, error } = await supabase
      .from('blog_posts')
      .upsert(postData, { onConflict: 'external_id' })
      .select()
      .single()

    if (error) {
      console.error(`[${requestId}] Upsert error:`, error)
      return NextResponse.json(
        { success: false, error: 'Failed to publish post', details: error.message },
        { status: 500 }
      )
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
    console.error(`[${requestId}] POST /api/blog error:`, error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/blog - Fetch published blog posts for the current tenant
 */
export async function GET(request: Request) {
  try {
    const config = getTenantConfig()
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const category = searchParams.get('category')

    const query = supabase
      .from('blog_posts')
      .select('*')
      .eq('user_name', config.username)
      .eq('status', 'published')
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
