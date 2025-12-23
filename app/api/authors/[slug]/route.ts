import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifySession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/authors/[slug] - public get one author
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('authors')
      .select('id, slug, name, bio, linkedin_url, avatar_url, created_at, updated_at')
      .eq('slug', params.slug)
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Author not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('Author GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch author' }, { status: 500 })
  }
}

// PUT /api/authors/[slug] - admin update author
export async function PUT(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { authenticated } = await verifySession()
    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { name, bio, linkedin_url, avatar_url, slug } = body || {}

    const updateData: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = String(name).trim()
    if (bio !== undefined) updateData.bio = bio
    if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (slug !== undefined) updateData.slug = String(slug).trim()

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('authors')
      .update(updateData)
      .eq('slug', params.slug)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to update author' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('Author PUT error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update author' }, { status: 500 })
  }
}

// DELETE /api/authors/[slug] - admin delete author
export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const { authenticated } = await verifySession()
    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('authors')
      .delete()
      .eq('slug', params.slug)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Author DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete author' }, { status: 500 })
  }
}


