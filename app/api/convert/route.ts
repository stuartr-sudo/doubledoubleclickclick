import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const { cta, meta } = payload || {}
    if (!cta) return NextResponse.json({ error: 'cta required' }, { status: 400 })
    const supabase = await createClient()
    const { error } = await supabase.from('cta_conversions').insert({
      cta,
      meta: meta || {},
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


