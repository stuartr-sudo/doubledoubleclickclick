import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/pipeline-status?path=/api/strategy/pipeline-status?username=X&run_id=Y
 * Proxies a pipeline status request to Doubleclicker so the browser doesn't need CORS.
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')
  if (!path) {
    return NextResponse.json({ success: false, error: 'Missing path param' }, { status: 400 })
  }

  const dcUrl = process.env.DOUBLECLICKER_API_URL
  if (!dcUrl) {
    return NextResponse.json({ success: false, error: 'DOUBLECLICKER_API_URL not set' }, { status: 500 })
  }

  try {
    const res = await fetch(`${dcUrl}${path}`, {
      headers: {
        'x-provision-secret': process.env.PROVISION_SECRET || '',
      },
    })
    const data = await res.json()

    return NextResponse.json({ success: true, pipeline: data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 502 })
  }
}
