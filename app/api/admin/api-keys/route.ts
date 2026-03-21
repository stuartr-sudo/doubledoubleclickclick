import { NextRequest, NextResponse } from 'next/server'
import { createApiKeyRecord, revokeApiKey } from '@/lib/api-keys'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-provision-secret')
  if (secret !== process.env.PROVISION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { client_name, contact_email } = await request.json()
  if (!client_name || !contact_email) {
    return NextResponse.json({ error: 'client_name and contact_email are required' }, { status: 400 })
  }

  try {
    const { key, id } = await createApiKeyRecord(client_name, contact_email)
    return NextResponse.json({ id, key }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const secret = request.headers.get('x-provision-secret')
  if (secret !== process.env.PROVISION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key_id } = await request.json()
  if (!key_id) {
    return NextResponse.json({ error: 'key_id is required' }, { status: 400 })
  }

  try {
    await revokeApiKey(key_id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
