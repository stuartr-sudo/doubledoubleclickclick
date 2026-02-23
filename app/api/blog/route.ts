import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getTenantConfig } from '@/lib/tenant'

export const revalidate = 0

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
