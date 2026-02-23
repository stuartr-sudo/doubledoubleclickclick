import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/provision-secret
 * Returns the provision secret for the admin form.
 * In production, this should be gated behind auth.
 */
export async function GET() {
  const secret = process.env.PROVISION_SECRET
  if (!secret) {
    return NextResponse.json({ secret: '' }, { status: 500 })
  }
  return NextResponse.json({ secret })
}
