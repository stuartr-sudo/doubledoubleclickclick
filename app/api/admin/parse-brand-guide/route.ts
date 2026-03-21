import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ParseJobStatus } from '@/lib/brand-guide-types'
import {
  parsePdfToMarkdown,
  extractSitesFromMarkdown,
  synthesizeAllResearchContexts,
} from '@/lib/parse-brand-guide'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// In-memory job store
// ---------------------------------------------------------------------------

const jobs = new Map<string, ParseJobStatus>()

const MAX_JOBS = 50

function pruneJobs() {
  if (jobs.size > MAX_JOBS) {
    // Delete oldest entries until we're back at the limit
    const toDelete = jobs.size - MAX_JOBS
    let deleted = 0
    for (const key of jobs.keys()) {
      if (deleted >= toDelete) break
      jobs.delete(key)
      deleted++
    }
  }
}

// ---------------------------------------------------------------------------
// Pipeline runner (fire-and-forget)
// ---------------------------------------------------------------------------

async function runPipeline(
  jobId: string,
  buffer: Buffer,
  filename: string,
  siteCount: number,
) {
  try {
    jobs.set(jobId, { status: 'parsing' })
    const markdown = await parsePdfToMarkdown(buffer, filename)
    jobs.set(jobId, { status: 'extracting' })
    const sites = await extractSitesFromMarkdown(markdown, siteCount)
    jobs.set(jobId, { status: 'synthesizing' })
    const enrichedSites = await synthesizeAllResearchContexts(sites)
    jobs.set(jobId, { status: 'done', result: enrichedSites })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[parse-brand-guide] pipeline error for job ${jobId}:`, err)
    jobs.set(jobId, { status: 'error', error: message })
  }
}

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function authenticate(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) return false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[parse-brand-guide] Supabase env vars not configured')
    return false
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await supabase.auth.getUser(token)

  return !error && !!data.user
}

// ---------------------------------------------------------------------------
// POST /api/admin/parse-brand-guide
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Auth
  const authed = await authenticate(request)
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  const siteCountRaw = formData.get('siteCount')

  // Validate file
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'file must be a PDF' }, { status: 400 })
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'file must be smaller than 10 MB' },
      { status: 400 },
    )
  }

  // Validate siteCount
  const siteCount = parseInt(String(siteCountRaw ?? ''), 10)
  if (isNaN(siteCount) || siteCount < 2 || siteCount > 8) {
    return NextResponse.json(
      { error: 'siteCount must be an integer between 2 and 8' },
      { status: 400 },
    )
  }

  // Read file buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const filename = file.name

  // Create job
  const jobId = crypto.randomUUID()
  jobs.set(jobId, { status: 'parsing' })
  pruneJobs()

  // Fire-and-forget pipeline
  void runPipeline(jobId, buffer, filename, siteCount)

  return NextResponse.json({ jobId }, { status: 202 })
}

// ---------------------------------------------------------------------------
// GET /api/admin/parse-brand-guide?jobId=<id>
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
  }

  const job = jobs.get(jobId)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json(job)
}
