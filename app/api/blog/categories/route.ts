import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/blog/categories - Get all categories from the official table
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('blog_categories')
      .select('name')
      .order('name')

    if (error) throw error

    const categories = data.map(c => c.name)

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 })
  }
}

/**
 * POST /api/blog/categories - Create a new category
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data, error } = await supabase
      .from('blog_categories')
      .insert({ 
        name, 
        slug,
        username: 'admin', // Required based on schema
        fields: {} 
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'Category already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 })
  }
}

