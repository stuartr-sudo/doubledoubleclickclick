import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 0

/**
 * GET /api/blog/[id] - Fetch a single blog post (SEWO ONLY)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // ONLY use site_posts
    const { data, error } = await supabase
      .from('site_posts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return NextResponse.json({ error: 'Post not found in SEWO database' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/blog/[id] - Update a blog post (SEWO ONLY)
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body = await request.json()

    // Normalize status for unpublishing logic if status is changed via Admin UI
    if (body.status === 'draft') {
       // If someone manually sets it to draft in the admin, we delete it from site_posts
       // because site_posts is for PUBLISHED content only.
       const { error: deleteError } = await supabase
         .from('site_posts')
         .delete()
         .eq('id', id)
       
       if (deleteError) throw deleteError
       return NextResponse.json({ success: true, message: 'Post unpublished successfully' }, { status: 200 })
    }

    // Otherwise, perform standard update on site_posts
    const { data, error } = await supabase
      .from('site_posts')
      .update({
        ...body,
        updated_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/blog/[id] - Delete a blog post (SEWO ONLY)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { error } = await supabase
      .from('site_posts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
