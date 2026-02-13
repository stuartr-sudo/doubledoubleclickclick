import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type RequirementStatus = {
  key: string
  label: string
  present: boolean
  source?: 'env' | 'file'
}

export async function GET() {
  const reqs: RequirementStatus[] = [
    // Required for clone automation right now
    { key: 'GEMINI_API_KEY', label: 'Gemini API key (brand name generation)', present: Boolean(process.env.GEMINI_API_KEY), source: 'env' },
    { key: 'GITHUB_TOKEN', label: 'GitHub token (repo creation)', present: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== '...'), source: 'env' },
    { key: 'VERCEL_TOKEN', label: 'Vercel token (deployment)', present: Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_TOKEN !== '...'), source: 'env' },
    { key: 'RESEND_API_KEY', label: 'Resend API key (email)', present: Boolean(process.env.RESEND_API_KEY), source: 'env' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase service role key (database)', present: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), source: 'env' },
  ]

  const missing = reqs.filter((r) => !r.present).map((r) => r.key)

  return NextResponse.json({
    success: true,
    requirements: reqs,
    allPresent: missing.length === 0,
    missing,
    note: 'Set these in .env.local then restart the dev server.',
  })
}
