import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  const secret = request.headers.get('x-provision-secret')
  if (secret !== process.env.PROVISION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { draft_id, domain_selections, status, admin_notes } = await request.json()

  if (!draft_id) {
    return NextResponse.json({ error: 'draft_id is required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (domain_selections !== undefined) updates.domain_selections = domain_selections
  if (status !== undefined) updates.status = status
  if (admin_notes !== undefined) updates.admin_notes = admin_notes

  const { data, error } = await supabase
    .from('site_drafts')
    .update(updates)
    .eq('id', draft_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
