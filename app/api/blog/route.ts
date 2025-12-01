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

    // Generate slug if not provided
    const postSlug = slug || title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Build insert data object with all fields
    const insertData: any = {
      title: title.trim(),
      content,
      slug: postSlug,
      status,
      published_date: status === 'published' ? new Date().toISOString() : null,
      user_name: user_name || 'api'
    }

    // Add optional fields only if provided
    if (category) insertData.category = category
    if (tags) insertData.tags = tags
    if (featured_image) insertData.featured_image = featured_image
    if (author) insertData.author = author
    if (meta_title) insertData.meta_title = meta_title
    if (meta_description) insertData.meta_description = meta_description
    if (focus_keyword) insertData.focus_keyword = focus_keyword
    if (excerpt) insertData.excerpt = excerpt
    if (generated_llm_schema) insertData.generated_llm_schema = generated_llm_schema
    if (typeof export_seo_as_tags === 'boolean') insertData.export_seo_as_tags = export_seo_as_tags

    // Insert blog post
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create blog post', details: error.message },
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
        created_date: data.created_date,
        user_name: data.user_name
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

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

