import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('homepage_content')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching homepage content:', error)
      return NextResponse.json(
        { error: 'Failed to fetch homepage content' },
        { status: 500 }
      )
    }

    // Return data or default values
    return NextResponse.json(data || {})
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Check if content exists
    const { data: existing } = await supabase
      .from('homepage_content')
      .select('id')
      .single()

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('homepage_content')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Update error:', error)
        return NextResponse.json(
          { error: 'Failed to update homepage content' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    } else {
      // Create new
      const { data, error } = await supabase
        .from('homepage_content')
        .insert([body])
        .select()
        .single()

      if (error) {
        console.error('Insert error:', error)
        return NextResponse.json(
          { error: 'Failed to create homepage content' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

