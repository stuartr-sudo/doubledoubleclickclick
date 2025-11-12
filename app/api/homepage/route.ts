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
      // Update existing - explicitly include logo_text
      const updateData = {
        ...body,
        logo_text: body.logo_text || '', // Ensure logo_text is included
        updated_at: new Date().toISOString(),
      }
      
      const { data, error } = await supabase
        .from('homepage_content')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Update error:', error)
        console.error('Update data:', JSON.stringify(updateData, null, 2))
        return NextResponse.json(
          { error: 'Failed to update homepage content', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    } else {
      // Create new - explicitly include logo_text
      const insertData = {
        ...body,
        logo_text: body.logo_text || 'DoubleClicker', // Default if not provided
      }
      
      const { data, error } = await supabase
        .from('homepage_content')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Insert error:', error)
        console.error('Insert data:', JSON.stringify(insertData, null, 2))
        return NextResponse.json(
          { error: 'Failed to create homepage content', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

