import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getTenantConfig } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/blog/categories - Get all blog categories
 */
export async function GET() {
  try {
    const config = getTenantConfig()
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('blog_categories')
      .select('name')
      .eq('username', config.username)
      .order('name')

    if (error) throw error

    const categories = data.map(c => c.name)

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 })
  }
}
