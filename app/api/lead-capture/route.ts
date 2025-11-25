import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getClientIP, isRateLimited, checkEmailExists } from '@/lib/spam-protection'

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

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get client IP address
    const ipAddress = getClientIP(request)

    // Check rate limiting by IP (max 1 submission per hour per IP per source)
    const rateLimitKey = `${ipAddress}:${source || 'default'}`
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { success: false, error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      )
    }

    // Check if email already exists for this source
    const emailExists = await checkEmailExists(email, source || 'default')
    if (emailExists) {
      return NextResponse.json(
        { success: false, error: 'This email has already been submitted.' },
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
      name: name || 'Questions Discovery Lead',
      email,
      company: company || null,
      website: website || null,
      message: message || null,
      plan_type: plan_type || null,
      source: source || null,
      ip_address: ipAddress,
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


