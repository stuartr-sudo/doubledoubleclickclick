import { NextRequest, NextResponse } from 'next/server'

const DC_URL = process.env.DOUBLECLICKER_API_URL || 'https://doubleclicker.fly.dev'
const SECRET = process.env.PROVISION_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    const { endpoint, ...body } = await req.json()

    if (!endpoint) {
      return NextResponse.json({ success: false, error: 'Missing endpoint' }, { status: 400 })
    }

    const url = `${DC_URL}${endpoint}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-provision-secret': SECRET,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const endpoint = req.nextUrl.searchParams.get('endpoint')
    if (!endpoint) {
      return NextResponse.json({ success: false, error: 'Missing endpoint' }, { status: 400 })
    }

    // Forward all query params except 'endpoint'
    const params = new URLSearchParams()
    req.nextUrl.searchParams.forEach((v, k) => {
      if (k !== 'endpoint') params.set(k, v)
    })

    const qs = params.toString()
    const url = `${DC_URL}${endpoint}${qs ? '?' + qs : ''}`
    const res = await fetch(url, {
      headers: { 'x-provision-secret': SECRET },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
