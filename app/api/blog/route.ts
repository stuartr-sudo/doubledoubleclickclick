import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { 
      // Core content
      title, 
      content, 
      slug, 
      status = 'draft', 
      category, 
      tags, 
      featured_image,
      author,
      // SEO metadata
      meta_title,
      meta_description,
      focus_keyword,
      excerpt,
      // Advanced SEO
      generated_llm_schema,
      export_seo_as_tags,
      // User association
      user_name
    } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Log what Base44 is sending
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('[BLOG API] INCOMING FROM BASE44:')
    console.log('  title:', title)
    console.log('  meta_title:', meta_title)
    console.log('  slug:', slug)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Generate slug if not provided
    const postSlug = slug || title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Build data object with all fields
    const postData: any = {
      title: title.trim(),
      content,
      slug: postSlug,
      status,
      published_date: status === 'published' ? new Date().toISOString() : null,
      updated_date: new Date().toISOString(),
      user_name: user_name || 'api'
    }

    // Add optional fields only if provided
    if (category) postData.category = category
    if (tags) postData.tags = tags
    if (featured_image) postData.featured_image = featured_image
    if (author) postData.author = author
    if (meta_title) postData.meta_title = meta_title
    if (meta_description) postData.meta_description = meta_description
    if (focus_keyword) postData.focus_keyword = focus_keyword
    if (excerpt) postData.excerpt = excerpt
    if (generated_llm_schema) postData.generated_llm_schema = generated_llm_schema
    if (typeof export_seo_as_tags === 'boolean') postData.export_seo_as_tags = export_seo_as_tags

    // CRITICAL: Check if post with this slug already exists
    const { data: existingPost, error: checkError } = await supabase
      .from('blog_posts')
      .select('id, slug, title, created_date')
      .eq('slug', postSlug)
      .maybeSingle()

    if (checkError) {
      console.error('[BLOG API] Error checking for existing post:', checkError)
    }

    if (existingPost) {
      console.log(`[BLOG API] UPDATING existing post: ${existingPost.id} (slug: ${postSlug})`)
      
      // UPDATE existing post
      const { data, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', existingPost.id)
        .select()
        .single()

      if (error) {
        console.error('[BLOG API] Update error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to update blog post', details: error.message },
          { status: 500 }
        )
      }

      console.log(`[BLOG API] Successfully UPDATED post ${existingPost.id}`)
      console.log('[BLOG API] STORED IN DATABASE:')
      console.log('  title:', data.title)
      console.log('  meta_title:', data.meta_title)
      
      // Validation warning
      if (data.title === data.meta_title && data.meta_title) {
        console.warn('[BLOG API] ⚠️  WARNING: title and meta_title are identical!')
        console.warn('[BLOG API] ⚠️  title should be clean, meta_title should be SEO-optimized')
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return NextResponse.json({ 
        success: true, 
        data: {
          id: data.id,
          slug: data.slug,
          title: data.title,
          meta_title: data.meta_title,
          status: data.status,
          created_date: data.created_date,
          message: 'Post updated successfully',
          _debug: {
            title_for_display: data.title,
            meta_title_for_seo: data.meta_title || data.title
          }
        }
      }, { status: 200 })
    }

    // INSERT new post
    console.log(`[BLOG API] INSERTING new post with slug: ${postSlug}`)
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(postData)
      .select()
      .single()

    if (error) {
      console.error('[BLOG API] Insert error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create blog post', details: error.message },
        { status: 500 }
      )
    }

    console.log(`[BLOG API] Successfully INSERTED new post ${data.id}`)
    console.log('[BLOG API] STORED IN DATABASE:')
    console.log('  title:', data.title)
    console.log('  meta_title:', data.meta_title)
    
    // Validation warning
    if (data.title === data.meta_title && data.meta_title) {
      console.warn('[BLOG API] ⚠️  WARNING: title and meta_title are identical!')
      console.warn('[BLOG API] ⚠️  title should be clean, meta_title should be SEO-optimized')
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return NextResponse.json({ 
      success: true, 
      data: {
        id: data.id,
        title: data.title,
        meta_title: data.meta_title,
        slug: data.slug,
        status: data.status,
        created_date: data.created_date,
        user_name: data.user_name,
        _debug: {
          title_for_display: data.title,
          meta_title_for_seo: data.meta_title || data.title
        }
      }
    }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'published'
    const limit = parseInt(searchParams.get('limit') || '10')

    const query = supabase
      .from('blog_posts')
      .select('*')
      .order('created_date', { ascending: false })
      .limit(limit)

    if (status !== 'all') {
      query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch blog posts', details: error.message },
        { status: 500 }
      )
    }

    // De-duplicate by slug so we never show multiple versions of the same post.
    // Because we ordered by created_date DESC, the first instance per slug
    // will be the newest one.
    const uniqueBySlug = new Map<string, any>()
    for (const post of data || []) {
      const key = post.slug || post.id
      if (!uniqueBySlug.has(key)) {
        uniqueBySlug.set(key, post)
      }
    }

    const deduped = Array.from(uniqueBySlug.values())

    return NextResponse.json({ success: true, data: deduped }, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

