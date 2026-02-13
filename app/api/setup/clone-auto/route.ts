import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawnSync } from 'child_process'

export const runtime = 'nodejs'

interface CloneRequestBody {
  username: string
  brandName: string
  domain: string
  email: string
  contactEmail: string
  privacyEmail: string
  phone?: string
  tagline: string
  description: string
  footerTagline: string
  primaryColor: string
  accentColor: string
  gaId?: string
  gtmId?: string
  outputBase: string
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SETUP_AUTOMATION !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Clone automation is disabled in production by default.' },
      { status: 403 }
    )
  }

  let body: CloneRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const required: (keyof CloneRequestBody)[] = [
    'username',
    'brandName',
    'domain',
    'email',
    'contactEmail',
    'privacyEmail',
    'tagline',
    'description',
    'footerTagline',
    'primaryColor',
    'accentColor',
    'outputBase',
  ]
  for (const key of required) {
    if (!body[key] || String(body[key]).trim() === '') {
      return NextResponse.json({ success: false, error: `Missing required field: ${key}` }, { status: 400 })
    }
  }

  const repoRoot = process.cwd()
  const tempProfilePath = path.join(os.tmpdir(), `clone-profile-${Date.now()}.json`)

  try {
    fs.writeFileSync(
      tempProfilePath,
      JSON.stringify(
        {
          username: body.username,
          brandName: body.brandName,
          domain: body.domain,
          email: body.email,
          contactEmail: body.contactEmail,
          privacyEmail: body.privacyEmail,
          phone: body.phone || '',
          tagline: body.tagline,
          description: body.description,
          footerTagline: body.footerTagline,
          primaryColor: body.primaryColor,
          accentColor: body.accentColor,
          gaId: body.gaId || '',
          gtmId: body.gtmId || '',
        },
        null,
        2
      )
    )

    const result = spawnSync(
      'node',
      ['scripts/clone-blog-auto.js', '--profile', tempProfilePath, '--output-base', body.outputBase],
      { cwd: repoRoot, encoding: 'utf8' }
    )

    const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim()
    if (result.status !== 0) {
      return NextResponse.json(
        { success: false, error: 'Clone automation failed', output },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, output })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 })
  } finally {
    try {
      if (fs.existsSync(tempProfilePath)) fs.unlinkSync(tempProfilePath)
    } catch {
      // ignore cleanup failure
    }
  }
}

