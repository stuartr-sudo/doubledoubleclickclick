import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifySession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/authors - public list of authors
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('authors')
      .select('id, slug, name, bio, linkedin_url, avatar_url, created_at, updated_at')
      .order('name')

    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] }, { status: 200 })
  } catch (error) {
    console.error('Authors GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch authors' }, { status: 500 })
  }
}

// POST /api/authors - admin create author
export async function POST(request: Request) {
  try {
    const { authenticated } = await verifySession()
    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { slug, name, bio, linkedin_url, avatar_url } = body || {}

    if (!slug || !name) {
      return NextResponse.json({ success: false, error: 'slug and name are required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('authors')
      .insert({
        slug: String(slug).trim(),
        name: String(name).trim(),
        bio: bio ?? null,
        linkedin_url: linkedin_url ?? null,
        avatar_url: avatar_url ?? null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Authors POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create author' }, { status: 500 })
  }
}


