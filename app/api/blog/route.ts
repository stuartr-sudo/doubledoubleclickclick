import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 0

/**
 * POST /api/blog - Create or update a blog post
 * 
 * RULES:
 * 1. If postId is provided, use it as the ONLY identifier (ignore slug/title)
 * 2. If postId exists in DB, UPDATE that post
 * 3. If postId doesn't exist, INSERT new post
 * 4. Use the slug sent by the API - NEVER generate it
 * 5. One request = ONE database operation (update OR insert, never both)
 */
export async function POST(request: Request) {
  const requestTimestamp = new Date().toISOString()
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
  
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`[${requestId}] NEW REQUEST at ${requestTimestamp}`)
    console.log('FULL REQUEST BODY:', JSON.stringify(body, null, 2))
    console.log('═══════════════════════════════════════════════════════════')
    
    // Extract fields
    const {
      // External ID (PRIMARY identifier from Base44)
      postId,
      post_id,
      external_id,
      // Content fields
      title,
      content,
      html,
      content_html,
      slug,
      status = 'published',
      // Optional fields
      category,
      tags,
      featured_image,
      author,
      meta_title,
      meta_description,
      focus_keyword,
      excerpt,
      generated_llm_schema,
      export_seo_as_tags,
      user_name
    } = body

    // Normalize external ID
    const externalId = postId || post_id || external_id
    
    // Normalize content
    const finalContent = content || html || content_html
    
    // Validate required fields
    if (!title || !finalContent) {
      console.log(`[${requestId}] ❌ VALIDATION FAILED: Missing title or content`)
      console.log(`[${requestId}]   Has title: ${!!title}`)
      console.log(`[${requestId}]   Has content: ${!!finalContent}`)
      console.log(`[${requestId}] ⚠️  WARNING: This request will be REJECTED`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Title and content are required',
          received: {
            title: !!title,
            content: !!finalContent,
            postId: externalId || 'NONE'
          }
        },
        { status: 400 }
      )
    }
    
    if (finalContent.trim().length < 50) {
      console.log(`[${requestId}] ❌ VALIDATION FAILED: Content too short (${finalContent.trim().length} chars)`)
      console.log(`[${requestId}] ⚠️  WARNING: This request will be REJECTED`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Content must be at least 50 characters',
          received: {
            contentLength: finalContent.trim().length,
            postId: externalId || 'NONE'
          }
        },
        { status: 400 }
      )
    }

    // STRICT VALIDATION: Require either postId OR slug
    // We cannot allow creating posts with NEITHER, as it causes duplicates
    if (!externalId && (!slug || slug.trim().length === 0)) {
      console.log(`[${requestId}] ❌ VALIDATION FAILED: Missing both postId and slug`)
      console.log(`[${requestId}]   We require at least one identifier to prevent duplicates`)
      console.log(`[${requestId}] ⚠️  WARNING: This request will be REJECTED`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing identifier: You must provide either postId (recommended) or slug',
          received: {
            postId: 'MISSING',
            slug: 'MISSING'
          }
        },
        { status: 400 }
      )
    }

    // Use the slug from the API - NEVER generate it if possible
    // Only generate if we have a postId but no slug (rare edge case)
    const finalSlug = slug && slug.trim() 
      ? slug.trim() 
      : title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 100)
    
    console.log(`[${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`[${requestId}] ✅ VALIDATION PASSED`)
    console.log(`[${requestId}]   external_id: ${externalId || 'NONE'}`)
    console.log(`[${requestId}]   title: "${title}"`)
    console.log(`[${requestId}]   title length: ${title.length}`)
    console.log(`[${requestId}]   slug (from API): ${slug || 'not provided'}`)
    console.log(`[${requestId}]   slug (final): ${finalSlug}`)
    console.log(`[${requestId}]   content length: ${finalContent.length}`)
    console.log(`[${requestId}]   content preview: ${finalContent.substring(0, 100)}...`)
    console.log(`[${requestId}]   status: ${status}`)
    console.log(`[${requestId}]   category: ${category || 'none'}`)
    console.log(`[${requestId}]   tags: ${tags ? JSON.stringify(tags) : 'none'}`)
    console.log(`[${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    // Build post data
    const postData: any = {
      title: title.trim(),
      content: finalContent,
      slug: finalSlug,
      status,
      published_date: status === 'published' ? new Date().toISOString() : null,
      updated_date: new Date().toISOString(),
      user_name: user_name || 'api'
    }
    
    // Add optional fields
    if (externalId) postData.external_id = externalId
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

    // STRATEGY: If external_id provided, use it. Otherwise use slug.
    let existingPost = null
    
    if (externalId) {
      // Check by external_id (PRIMARY identifier)
      console.log(`[${requestId}] 🔍 Checking for existing post by external_id: ${externalId}`)
      const { data } = await supabase
        .from('blog_posts')
        .select('id, slug, title, external_id, content')
        .eq('external_id', externalId)
        .maybeSingle()
      
      if (data) {
        existingPost = data
        console.log(`[${requestId}] ✅ FOUND existing post by external_id`)
        console.log(`[${requestId}]   Post ID: ${data.id}`)
        console.log(`[${requestId}]   Decision: WILL UPDATE THIS POST`)
      } else {
        console.log(`[${requestId}] ❌ No post found with external_id: ${externalId}`)
      }
    }
    
    // Fallback: Check by slug if not found yet (Smart Linking)
    if (!existingPost && finalSlug) {
      console.log(`[${requestId}] 🔍 Checking for existing post by slug: ${finalSlug}`)
      const { data } = await supabase
        .from('blog_posts')
        .select('id, slug, title, external_id, content')
        .eq('slug', finalSlug)
        .maybeSingle()
      
      if (data) {
        existingPost = data
        console.log(`[${requestId}] ✅ FOUND existing post by slug`)
        console.log(`[${requestId}]   Post ID: ${data.id}`)
        console.log(`[${requestId}]   Decision: WILL UPDATE THIS POST AND LINK ID`)
      } else {
        console.log(`[${requestId}] ❌ No existing post found with slug: ${finalSlug}`)
      }
    }

    if (existingPost) {
      // UPDATE existing post
      console.log(`[${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`[${requestId}] 🔄 UPDATING EXISTING POST`)
      console.log(`[${requestId}]   Post ID: ${existingPost.id}`)
      console.log(`[${requestId}]   Old Title: "${existingPost.title}"`)
      console.log(`[${requestId}]   New Title: "${title}"`)
      console.log(`[${requestId}]   Old Slug: ${existingPost.slug}`)
      console.log(`[${requestId}]   New Slug: ${finalSlug}`)
      console.log(`[${requestId}]   New Content Length: ${finalContent.length}`)
      console.log(`[${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      
      const { data, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', existingPost.id)
        .select()
        .single()

      if (error) {
        console.error(`[${requestId}] ❌ Update error:`, error)
        return NextResponse.json(
          { success: false, error: 'Failed to update post', details: error.message },
          { status: 500 }
        )
      }

      console.log(`[${requestId}] ✅ POST UPDATED SUCCESSFULLY`)
      console.log(`[${requestId}]   Final Title: "${data.title}"`)
      console.log(`[${requestId}]   Final Slug: ${data.slug}`)
      console.log(`[${requestId}]   Final Content Length: ${data.content?.length || 0}`)
      console.log(`[${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      
      return NextResponse.json({
        success: true,
        data: {
          id: data.id,
          title: data.title,
          slug: data.slug,
          status: data.status,
          external_id: data.external_id,
          created_date: data.created_date,
          operation: 'update'
        }
      }, { status: 200 })
    }
    
    // CRITICAL: If we have an external_id but no existing post found, this is an UPDATE request that failed
    // DO NOT CREATE A NEW POST - return error instead
    if (externalId) {
      console.log(`[${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`[${requestId}] ❌ UPDATE FAILED: Post not found`)
      console.log(`[${requestId}]   Searched for external_id: ${externalId}`)
      console.log(`[${requestId}]   This appears to be an UPDATE request, but post doesn't exist`)
      console.log(`[${requestId}]   REFUSING to create new post - returning error instead`)
      console.log(`[${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      
      return NextResponse.json({
        success: false,
        error: 'Post not found for update',
        details: `No post found with external_id: ${externalId}. Cannot update a post that doesn't exist. Create it first, then update.`,
        received: {
          external_id: externalId,
          slug: finalSlug,
          title: title
        }
      }, { status: 404 })
    }
    
    // Only INSERT if NO external_id (meaning this is a CREATE request, not UPDATE)
    else {
      // INSERT new post
      console.log(`[${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`[${requestId}] ➕ INSERTING NEW POST`)
      console.log(`[${requestId}]   Title: "${title}"`)
      console.log(`[${requestId}]   Slug: ${finalSlug}`)
      console.log(`[${requestId}]   External ID: ${externalId || 'NONE'}`)
      console.log(`[${requestId}]   Content Length: ${finalContent.length}`)
      console.log(`[${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(postData)
        .select()
        .single()

      if (error) {
        console.error('[BLOG API] Insert error:', error)
        
        // If duplicate, try to update instead
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          console.log('[BLOG API] Duplicate detected, attempting update...')
          
          // Try to find by slug
          const { data: existing } = await supabase
            .from('blog_posts')
            .select('id')
            .eq('slug', finalSlug)
            .maybeSingle()
          
          if (existing) {
            const { data: updated, error: updateError } = await supabase
              .from('blog_posts')
              .update(postData)
              .eq('id', existing.id)
              .select()
              .single()
            
            if (updateError) {
              return NextResponse.json(
                { success: false, error: 'Failed to update duplicate post', details: updateError.message },
                { status: 500 }
              )
            }
            
            console.log('[BLOG API] ✅ Updated existing post (duplicate prevention)')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            
            return NextResponse.json({
              success: true,
              data: {
                id: updated.id,
                title: updated.title,
                slug: updated.slug,
                status: updated.status,
                external_id: updated.external_id,
                created_date: updated.created_date,
                operation: 'update'
              }
            }, { status: 200 })
          }
        }
        
        return NextResponse.json(
          { success: false, error: 'Failed to create post', details: error.message },
          { status: 500 }
        )
      }

      console.log(`[${requestId}] ✅ POST CREATED SUCCESSFULLY`)
      console.log(`[${requestId}]   New Post ID: ${data.id}`)
      console.log(`[${requestId}]   Final Title: "${data.title}"`)
      console.log(`[${requestId}]   Final Slug: ${data.slug}`)
      console.log(`[${requestId}]   Final Content Length: ${data.content?.length || 0}`)
      console.log(`[${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      
      return NextResponse.json({
        success: true,
        data: {
          id: data.id,
          title: data.title,
          slug: data.slug,
          status: data.status,
          external_id: data.external_id,
          created_date: data.created_date,
          operation: 'insert'
        }
      }, { status: 201 })
    }
  } catch (error) {
    console.error('[BLOG API] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/blog - Fetch blog posts
 */
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
        { error: 'Failed to fetch posts', details: error.message },
        { status: 500 }
      )
    }

    // Deduplicate by slug (keep newest)
    const uniquePosts = new Map<string, any>()
    for (const post of data || []) {
      const key = post.slug || post.id
      if (!uniquePosts.has(key)) {
        uniquePosts.set(key, post)
      }
    }

    return NextResponse.json(
      { success: true, data: Array.from(uniquePosts.values()) },
      { status: 200 }
    )
  } catch (error) {
    console.error('[BLOG API] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
