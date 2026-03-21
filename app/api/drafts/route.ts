import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-keys'
import { validateDraftPayload } from '@/lib/drafts'
import { createServiceClient } from '@/lib/supabase/service'
import type { SiteConceptPayload } from '@/lib/draft-types'

export async function POST(request: NextRequest) {
  // 1. Extract Bearer token
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Missing or invalid Authorization header' },
      { status: 401 }
    )
  }
  const token = authHeader.replace('Bearer ', '')

  // 2. Validate API key
  const { valid, keyRecord } = await validateApiKey(token)
  if (!valid || !keyRecord) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Invalid or revoked API key' },
      { status: 401 }
    )
  }

  // 3. Parse body
  let payload: SiteConceptPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Request body must be valid JSON' },
      { status: 400 }
    )
  }

  // 4. Validate
  const { valid: payloadValid, errors } = validateDraftPayload(payload)
  if (!payloadValid) {
    return NextResponse.json(
      { error: 'validation_error', message: errors[0], details: errors },
      { status: 400 }
    )
  }

  // 5. Store
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('site_drafts')
    .insert({
      client_api_key_id: keyRecord.id,
      client_name: keyRecord.client_name,
      contact_email: payload.contact_email,
      contact_name: payload.contact_name || null,
      type: payload.type,
      network_name: payload.network_name || null,
      sites: payload.sites,
      notes: payload.notes || null,
      status: 'pending',
    })
    .select('id, status, type')
    .single()

  if (error) {
    console.error('Failed to store draft:', error)
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to store draft' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      draft_id: data.id,
      status: data.status,
      type: data.type,
      site_count: payload.sites.length,
      message: 'Draft submitted successfully. It will be reviewed shortly.',
    },
    { status: 201 }
  )
}
