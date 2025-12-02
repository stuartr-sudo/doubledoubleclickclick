import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// In-memory lock to prevent duplicate processing
const processingLocks = new Map<string, Promise<any>>()

export async function POST(request: Request) {
  const requestId = `${Date.now()}-${Math.random()}`
  
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Create a unique key for this request based on slug or title
    const requestKey = body.slug || body.title?.toLowerCase().trim() || requestId
    
    // Check if this exact request is already being processed
    if (processingLocks.has(requestKey)) {
      console.warn(`[BLOG API] ⚠️  Request already processing for key: ${requestKey}`)
      console.warn(`[BLOG API] ⚠️  Waiting for existing request to complete...`)
      const existingResult = await processingLocks.get(requestKey)
      return existingResult
    }
    
    // Create a promise for this request and store it
    const processRequest = async () => {
      try {
        return await processBlogPost(supabase, body, requestId)
      } finally {
        // Clean up lock after 5 seconds
        setTimeout(() => {
          processingLocks.delete(requestKey)
        }, 5000)
      }
    }
    
    const requestPromise = processRequest()
    processingLocks.set(requestKey, requestPromise)
    
    return await requestPromise
  } catch (error) {
    console.error('[BLOG API] FATAL ERROR:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

async function processBlogPost(supabase: any, body: any, requestId: string) {

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
    
    console.log(`[BLOG API] Request ID: ${requestId}`)
    console.log(`[BLOG API] Processing request for slug: ${slug || 'auto-generated'}`)

    // STRICT validation - reject incomplete requests
    if (!title || !content) {
      console.error('[BLOG API] ❌ REJECTED: Missing required fields')
      console.error('[BLOG API] Has title?', !!title)
      console.error('[BLOG API] Has content?', !!content)
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Validate content is not empty
    if (content.trim().length < 50) {
      console.error('[BLOG API] ❌ REJECTED: Content too short (must be at least 50 chars)')
      console.error('[BLOG API] Content length:', content.trim().length)
      return NextResponse.json(
        { success: false, error: 'Content must be at least 50 characters' },
        { status: 400 }
      )
    }

    // Log EVERYTHING Base44 is sending
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('[BLOG API] INCOMING FROM BASE44:')
    console.log('  title:', title)
    console.log('  title length:', title?.length || 0)
    console.log('  meta_title:', meta_title)
    console.log('  slug:', slug)
    console.log('  content length:', content?.length || 0)
    console.log('  status:', status)
    console.log('  category:', category)
    console.log('  tags:', tags)
    console.log('  featured_image:', featured_image ? 'YES' : 'NO')
    console.log('  author:', author)
    console.log('  excerpt length:', excerpt?.length || 0)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Generate slug if not provided
    const postSlug = slug || title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // CRITICAL: Ensure title and meta_title are NOT swapped
    // If meta_title is shorter than title, they might be swapped
    const finalTitle = title.trim()
    const finalMetaTitle = meta_title?.trim() || null
    
    // Validation: If meta_title looks like it should be the title (shorter, cleaner), warn
    if (finalMetaTitle && finalMetaTitle.length < finalTitle.length && finalTitle.includes('|')) {
      console.warn('[BLOG API] ⚠️  WARNING: Title contains "|" which suggests it might be meta_title')
      console.warn('[BLOG API] ⚠️  Title:', finalTitle)
      console.warn('[BLOG API] ⚠️  Meta Title:', finalMetaTitle)
    }
    
    // Build data object with all fields - USE title AS TITLE, NEVER meta_title
    const postData: any = {
      title: finalTitle,  // ALWAYS use title field for title column
      content,
      slug: postSlug,
      status,
      published_date: status === 'published' ? new Date().toISOString() : null,
      updated_date: new Date().toISOString(),
      user_name: user_name || 'api'
    }
    
    console.log('[BLOG API] FINAL DATA TO STORE:')
    console.log('  title (for display):', postData.title)
    console.log('  meta_title (for SEO):', finalMetaTitle || '(none)')
    console.log('  content length:', postData.content?.length || 0)

    // Add optional fields only if provided
    if (category) postData.category = category
    if (tags) postData.tags = tags
    if (featured_image) postData.featured_image = featured_image
    if (author) postData.author = author
    if (finalMetaTitle) postData.meta_title = finalMetaTitle  // Use validated meta_title
    if (meta_description) postData.meta_description = meta_description
    if (focus_keyword) postData.focus_keyword = focus_keyword
    if (excerpt) postData.excerpt = excerpt
    if (generated_llm_schema) postData.generated_llm_schema = generated_llm_schema
    if (typeof export_seo_as_tags === 'boolean') postData.export_seo_as_tags = export_seo_as_tags

    // CRITICAL: Check if post with this slug OR similar title already exists
    const { data: existingPost, error: checkError } = await supabase
      .from('blog_posts')
      .select('id, slug, title, created_date')
      .eq('slug', postSlug)
      .maybeSingle()

    if (checkError) {
      console.error('[BLOG API] Error checking for existing post:', checkError)
    }

    // ADDITIONAL CHECK: Look for posts with very similar titles (prevent duplicates with different slugs)
    if (!existingPost) {
      const { data: similarPosts } = await supabase
        .from('blog_posts')
        .select('id, slug, title')
        .ilike('title', `%${title.substring(0, 30)}%`)
        .limit(5)

      if (similarPosts && similarPosts.length > 0) {
        console.warn('[BLOG API] ⚠️  Found posts with similar titles:')
        similarPosts.forEach((p: any) => {
          console.warn(`  - ID: ${p.id}, Title: ${p.title}, Slug: ${p.slug}`)
        })
        
        // Check if any is an exact match
        const exactMatch = similarPosts.find(p => 
          p.title.trim().toLowerCase() === title.trim().toLowerCase()
        )
        
        if (exactMatch) {
          console.log('[BLOG API] EXACT TITLE MATCH FOUND - Will UPDATE instead of creating duplicate')
          console.log(`[BLOG API] UPDATING existing post: ${exactMatch.id} (exact title match)`)
          
          const updateData = { ...postData }
          delete updateData.created_date // Don't update created date
          
          const { data, error } = await supabase
            .from('blog_posts')
            .update(updateData)
            .eq('id', exactMatch.id)
            .select()
            .single()

          if (error) {
            console.error('[BLOG API] Update error:', error)
            return NextResponse.json(
              { success: false, error: 'Failed to update blog post', details: error.message },
              { status: 500 }
            )
          }

          console.log(`[BLOG API] Successfully UPDATED post ${exactMatch.id} (title match)`)
          return NextResponse.json({ 
            success: true, 
            data: {
              id: data.id,
              slug: data.slug,
              title: data.title,
              meta_title: data.meta_title,
              status: data.status,
              created_date: data.created_date,
              message: 'Post updated successfully (matched by title)',
              _debug: {
                matched_by: 'exact_title',
                original_post_id: exactMatch.id
              }
            }
          }, { status: 200 })
        }
      }
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

    // FINAL CHECK: One more time, make absolutely sure this post doesn't exist
    // This prevents race conditions where two requests arrive simultaneously
    const { data: finalCheck } = await supabase
      .from('blog_posts')
      .select('id, slug, title')
      .eq('slug', postSlug)
      .maybeSingle()
    
    if (finalCheck) {
      console.log(`[BLOG API] ⚠️  FINAL CHECK: Post with slug "${postSlug}" already exists!`)
      console.log(`[BLOG API] ⚠️  Existing post ID: ${finalCheck.id}, Title: "${finalCheck.title}"`)
      console.log(`[BLOG API] ⚠️  UPDATING instead of creating duplicate`)
      
      const { data, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', finalCheck.id)
        .select()
        .single()

      if (error) {
        console.error('[BLOG API] Final update error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to update blog post', details: error.message },
          { status: 500 }
        )
      }

      console.log(`[BLOG API] Successfully UPDATED post ${finalCheck.id} (final check)`)
      return NextResponse.json({ 
        success: true, 
        data: {
          id: data.id,
          slug: data.slug,
          title: data.title,
          meta_title: data.meta_title,
          status: data.status,
          created_date: data.created_date,
          message: 'Post updated successfully (final check prevented duplicate)',
          _debug: {
            prevented_duplicate: true,
            matched_by: 'slug',
            original_post_id: finalCheck.id
          }
        }
      }, { status: 200 })
    }
    
    // INSERT new post (only if final check confirms it doesn't exist)
    console.log(`[BLOG API] INSERTING new post with slug: ${postSlug}`)
    console.log(`[BLOG API] Final check confirmed: No existing post with this slug`)
    
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

