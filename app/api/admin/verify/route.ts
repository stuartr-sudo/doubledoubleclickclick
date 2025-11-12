import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'

export async function GET() {
  try {
    const { authenticated } = await verifySession()

    if (!authenticated) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      authenticated: true
    })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}

