import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/leads — Capture a lead from the hero lead magnet form.
 * Stores name, email, topic of interest, and tenant username.
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, topic, username } = await request.json()

    if (!name || !email || !topic || !username) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        topic,
        username,
        source: 'homepage_lead_magnet',
        created_at: new Date().toISOString(),
      })

    if (error) {
      // If the leads table doesn't exist yet, log and return success
      // so the form still works (data just won't persist until table is created)
      if (error.code === '42P01') {
        console.warn('[LEADS] Table "leads" does not exist yet. Lead not stored:', { name, email, topic, username })
        return NextResponse.json({ success: true, stored: false })
      }
      throw error
    }

    return NextResponse.json({ success: true, stored: true })
  } catch (error) {
    console.error('[LEADS] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
