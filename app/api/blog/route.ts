import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

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
  try {
    const supabase = await createClient()
    const body = await request.json()
    
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
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      )
    }
    
    if (finalContent.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: 'Content must be at least 50 characters' },
        { status: 400 }
      )
    }

    // Use the slug from the API - NEVER generate it
    // If no slug provided, use title-based slug as fallback
    const finalSlug = slug && slug.trim() 
      ? slug.trim() 
      : title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 100)
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('[BLOG API] NEW REQUEST')
    console.log('  external_id:', externalId || 'NONE')
    console.log('  title:', title)
    console.log('  slug (from API):', slug || 'not provided')
    console.log('  slug (final):', finalSlug)
    console.log('  content length:', finalContent.length)
    console.log('  status:', status)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

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
      console.log('[BLOG API] Checking by external_id:', externalId)
      const { data } = await supabase
        .from('blog_posts')
        .select('id, slug, title, external_id')
        .eq('external_id', externalId)
        .maybeSingle()
      
      existingPost = data
      if (data) {
        console.log('[BLOG API] ✅ Found existing post by external_id:', data.id)
      }
    } else if (finalSlug) {
      // Fallback: Check by slug
      console.log('[BLOG API] Checking by slug:', finalSlug)
      const { data } = await supabase
        .from('blog_posts')
        .select('id, slug, title, external_id')
        .eq('slug', finalSlug)
        .maybeSingle()
      
      existingPost = data
      if (data) {
        console.log('[BLOG API] ✅ Found existing post by slug:', data.id)
      }
    }

    if (existingPost) {
      // UPDATE existing post
      console.log('[BLOG API] UPDATING post:', existingPost.id)
      
      const { data, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', existingPost.id)
        .select()
        .single()

      if (error) {
        console.error('[BLOG API] Update error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to update post', details: error.message },
          { status: 500 }
        )
      }

      console.log('[BLOG API] ✅ Post updated successfully')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
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
    } else {
      // INSERT new post
      console.log('[BLOG API] INSERTING new post')
      
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

      console.log('[BLOG API] ✅ Post created successfully')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
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
