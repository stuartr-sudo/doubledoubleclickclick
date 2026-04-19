import { NextRequest, NextResponse } from 'next/server'
import { generateLogoImage } from '@/lib/image-gen'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const provisionSecret = process.env.PROVISION_SECRET
  if (!provisionSecret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (!authHeader || authHeader !== `Bearer ${provisionSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { prompt, username } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing prompt' },
        { status: 400 }
      )
    }

    const url = await generateLogoImage(prompt, username || undefined)

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Logo generation failed (FAL_API_KEY may not be set)' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, url })
  } catch (err) {
    console.error('Error generating logo:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
