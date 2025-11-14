import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      company,
      website,
      message,
      plan_type,
      source,
    } = body || {}

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase env vars missing for lead capture')
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error } = await supabase.from('lead_captures').insert({
      name,
      email,
      company: company || null,
      website: website || null,
      message: message || null,
      plan_type: plan_type || null,
      source: source || null,
    })

    if (error) {
      console.error('Error inserting lead capture:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to save lead' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead capture API error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error' },
      { status: 500 }
    )
  }
}


