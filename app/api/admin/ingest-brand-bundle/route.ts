import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  parseRepoUrl,
  listRepoMarkdown,
  fetchRepoFile,
  selectBundleFiles,
  extractStaticPagesWithOpus,
  type ExtractedBundle,
} from '@/lib/brand-bundle'

export const maxDuration = 300 // 5 min — Opus extraction can take 60-120s

/**
 * POST /api/admin/ingest-brand-bundle
 *
 * Body: {
 *   username:        string,            // required — tenant
 *   bundle_repo_url: string,            // required — github URL
 *   bundle_branch?:  string,            // default 'main'
 *   github_token?:   string,            // optional — for private repos
 *   merge?:          boolean,           // default true — merge into existing static_pages
 *                                       // false = REPLACE entire static_pages payload
 *   dry_run?:        boolean,           // default false — return extraction without writing
 * }
 *
 * Auth: Authorization: Bearer {PROVISION_SECRET}
 *
 * Returns: { success, extracted, written, source_files, debug }
 */
export async function POST(req: NextRequest) {
  const provisionSecret = process.env.PROVISION_SECRET
  if (!provisionSecret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization')
  if (!authHeader || authHeader !== `Bearer ${provisionSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    username,
    bundle_repo_url,
    bundle_branch = 'main',
    github_token,
    merge = true,
    dry_run = false,
  } = body || {}

  if (!username || typeof username !== 'string') {
    return NextResponse.json({ error: 'username is required' }, { status: 400 })
  }
  if (!bundle_repo_url || typeof bundle_repo_url !== 'string') {
    return NextResponse.json({ error: 'bundle_repo_url is required' }, { status: 400 })
  }

  const repo = parseRepoUrl(bundle_repo_url, bundle_branch)
  if (!repo) {
    return NextResponse.json({ error: `Could not parse bundle_repo_url: ${bundle_repo_url}` }, { status: 400 })
  }

  const debug: Record<string, unknown> = {}
  const t0 = Date.now()

  try {
    // 1. List markdown files in the repo
    const allFiles = await listRepoMarkdown(repo, github_token)
    debug.total_md_files = allFiles.length

    // 2. Select the relevant ones (size-capped)
    const selected = selectBundleFiles(allFiles)
    debug.selected_files = selected.map(f => ({ path: f.path, size: f.size }))
    if (selected.length === 0) {
      return NextResponse.json({
        error: 'No relevant markdown files found in repo. Expected names matching: Brand_Guidelines, Website_Copy, Founder_Story, About, ICA, Imagery, Bio, Copy_Bank, Philosophy, Manifesto, Funnel_Blueprint, Quiz_Design.',
        debug,
      }, { status: 422 })
    }

    // 3. Fetch their contents in parallel
    const fetched = await Promise.all(selected.map(async f => ({
      path: f.path,
      content: await fetchRepoFile(repo, f.path, github_token),
    })))
    debug.total_chars = fetched.reduce((sum, f) => sum + f.content.length, 0)

    // 4. Extract via Opus
    const extractStart = Date.now()
    const extracted = await extractStaticPagesWithOpus(fetched, username)
    debug.extract_ms = Date.now() - extractStart

    // 5. Merge with existing static_pages (or replace if merge=false)
    const supabase = createServiceClient()
    const settingName = `static_pages:${username}`
    const { data: existing } = await supabase
      .from('app_settings')
      .select('id, setting_value')
      .eq('setting_name', settingName)
      .maybeSingle()

    let payload: Record<string, unknown>
    if (existing && merge) {
      const prev = (existing.setting_value as Record<string, unknown>) || {}
      payload = { ...prev, ...extracted } as Record<string, unknown>
      // Special-case nested merge for custom_pages so we don't drop existing pages
      const prevPages = (prev.custom_pages as Record<string, unknown>) || {}
      const newPages = (extracted.custom_pages as Record<string, unknown>) || {}
      payload.custom_pages = { ...prevPages, ...newPages }
    } else {
      payload = extracted as unknown as Record<string, unknown>
    }

    // 6. Write to app_settings (unless dry-run)
    let written = false
    if (!dry_run) {
      if (existing) {
        await supabase.from('app_settings')
          .update({ setting_value: payload })
          .eq('id', existing.id)
      } else {
        await supabase.from('app_settings')
          .insert({ setting_name: settingName, setting_value: payload })
      }
      written = true
    }

    debug.total_ms = Date.now() - t0

    return NextResponse.json({
      success: true,
      written,
      dry_run,
      username,
      repo: `${repo.owner}/${repo.name}@${repo.branch}`,
      summary: summarize(extracted as ExtractedBundle),
      extracted: dry_run ? extracted : undefined,
      debug,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || String(err),
      debug,
    }, { status: 500 })
  }
}

function summarize(extracted: ExtractedBundle): Record<string, unknown> {
  return {
    has_founder_story: !!extracted.founder_story,
    founder_story_chars: extracted.founder_story?.length || 0,
    has_philosophy: !!extracted.philosophy,
    immutable_rules_count: extracted.immutable_rules?.length || 0,
    has_mission_long: !!extracted.mission_long,
    menu_items: extracted.menu_items?.map(m => m.label) || [],
    custom_pages: Object.keys(extracted.custom_pages || {}),
    source_files: extracted._source_files || [],
  }
}
