import { NextRequest, NextResponse } from 'next/server'
import * as google from '@/lib/google'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/google-test?action=gtm-accounts|gtm-containers
 * Diagnostic endpoint for testing Google API service account access.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.PROVISION_SECRET
  const authHeader = req.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const action = req.nextUrl.searchParams.get('action')

  try {
    switch (action) {
      case 'gtm-accounts': {
        const data = await google.listGTMAccounts()
        return NextResponse.json({ success: true, data })
      }
      case 'gtm-containers': {
        const data = await google.listGTMContainers()
        return NextResponse.json({ success: true, data })
      }
      case 'gtm-create': {
        const name = req.nextUrl.searchParams.get('name') || 'test-container-delete-me'
        const data = await google.createGTMContainer(name)
        return NextResponse.json({ success: true, data })
      }
      default:
        return NextResponse.json(
          { error: 'Missing action param. Options: gtm-accounts, gtm-containers' },
          { status: 400 }
        )
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
