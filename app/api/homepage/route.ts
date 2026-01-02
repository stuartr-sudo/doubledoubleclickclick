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
    console.log('POST /api/homepage - Received data with', Object.keys(body).length, 'fields')
    const supabase = await createClient()

    // Check if content exists
    const { data: existing } = await supabase
      .from('homepage_content')
      .select('id')
      .single()

    if (existing) {
      console.log('Updating existing homepage content, ID:', existing.id)
      // Update existing - explicitly include logo_text
      const updateData = {
        ...body,
        logo_text: body.logo_text || '', // Ensure logo_text is included
        updated_at: new Date().toISOString(),
      }
      console.log('Update data prepared with', Object.keys(updateData).length, 'fields')
      
      const { data, error } = await supabase
        .from('homepage_content')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Update error:', error)
        console.error('Full error object:', JSON.stringify(error, null, 2))
        console.error('Update data keys:', Object.keys(updateData))
        console.error('Update data sample (first 5 keys):', Object.keys(updateData).slice(0, 5))
        
        // Check if error is about missing column - try multiple patterns
        const errorMessage = error.message || error.details || JSON.stringify(error)
        let columnName = null
        
        // Try different regex patterns to find the column name
        const patterns = [
          /column ['"]([^'"]+)['"]/i,
          /'([^']+)' column/i,
          /column `([^`]+)`/i,
          /Could not find the '([^']+)'/i,
          /column "([^"]+)"/i
        ]
        
        for (const pattern of patterns) {
          const match = errorMessage.match(pattern)
          if (match && match[1]) {
            columnName = match[1]
            break
          }
        }
        
        if (errorMessage.includes('column') && (errorMessage.includes('schema cache') || errorMessage.includes('not found'))) {
          return NextResponse.json(
            { 
              error: 'Database schema mismatch', 
              details: columnName 
                ? `The column '${columnName}' does not exist in the database. Please run the migration: supabase/migrations/20250120_add_all_missing_homepage_columns.sql`
                : `A column does not exist in the database. Error: ${errorMessage}. Please check and run the necessary migrations.`,
              migration_required: true,
              missing_column: columnName || 'unknown',
              full_error: errorMessage
            },
            { status: 500 }
          )
        }
        
        return NextResponse.json(
          { error: 'Failed to update homepage content', details: errorMessage },
          { status: 500 }
        )
      }

      if (!data) {
        console.error('Update succeeded but no data returned')
        return NextResponse.json(
          { error: 'Update succeeded but no data returned', details: 'Please refresh the page to see changes' },
          { status: 500 }
        )
      }

      console.log('Update successful, returning data')
      return NextResponse.json(data)
    } else {
      // Create new - explicitly include logo_text
      const insertData = {
        ...body,
        logo_text: body.logo_text || 'SEWO', // Default if not provided
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

