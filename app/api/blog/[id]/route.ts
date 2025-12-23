import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/blog/[id] - Get a single blog post by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/blog/[id] - Update a blog post by ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    const { id } = params
    const body = await request.json()

    const { 
      title, 
      content, 
      slug, 
      status, 
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
      user_name,
      is_popular
    } = body

    // Build update data object
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title.trim()
    if (content !== undefined) updateData.content = content
    if (slug !== undefined) updateData.slug = slug
    if (status !== undefined) {
      // Hard safety: Prevent Published -> Draft unless authenticated admin session.
      if (status === 'draft') {
        const { data: currentPost, error: currentPostError } = await supabase
          .from('blog_posts')
          .select('status, published_date')
          .eq('id', id)
          .single()

        if (!currentPostError && currentPost?.status === 'published') {
          const { authenticated } = await verifySession()
          if (!authenticated) {
            return NextResponse.json(
              { success: false, error: 'Forbidden: unpublishing requires admin authentication' },
              { status: 403 }
            )
          }
        }
      }

      updateData.status = status
      // Only set published_date if it's changing to published and doesn't have one
      if (status === 'published') {
        const { data: currentPost } = await supabase
          .from('blog_posts')
          .select('published_date')
          .eq('id', id)
          .single()
        
        if (!currentPost?.published_date) {
          updateData.published_date = new Date().toISOString()
        }
      }
    }
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (featured_image !== undefined) updateData.featured_image = featured_image
    if (author !== undefined) updateData.author = author
    if (meta_title !== undefined) updateData.meta_title = meta_title
    if (meta_description !== undefined) updateData.meta_description = meta_description
    if (focus_keyword !== undefined) updateData.focus_keyword = focus_keyword
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (generated_llm_schema !== undefined) updateData.generated_llm_schema = generated_llm_schema
    if (export_seo_as_tags !== undefined) updateData.export_seo_as_tags = export_seo_as_tags
    if (user_name !== undefined) updateData.user_name = user_name
    if (is_popular !== undefined) updateData.is_popular = is_popular

    // Always update the updated_date
    updateData.updated_date = new Date().toISOString()

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update blog post', details: error.message },
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
        updated_date: data.updated_date,
        user_name: data.user_name
      }
    }, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/blog/[id] - Delete a blog post by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    const { id } = params

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete blog post', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Blog post deleted successfully' 
    }, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
