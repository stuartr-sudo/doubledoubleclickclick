/**
 * Brand bundle ingestion — read a GitHub repo of brand markdown files,
 * extract structured static-page content via Claude Opus, return a
 * static_pages payload ready to write to app_settings.
 *
 * The bundle convention (loose — pattern-matched, not strict naming):
 *   *Brand_Guidelines*.md   — voice, tone, personality, palette, fonts
 *   *Website_Copy*.md       — page-by-page copy (# PAGE 1: HOMEPAGE etc.)
 *   *Founder*.md            — founder story / bio
 *   *About*.md              — about-page content
 *   *ICA*.md or *Customer*.md — ideal customer avatar
 *   *Imagery*.md or *Visual*.md — imagery direction
 *   *Bio*.md                — short author bio
 *
 * Files outside this set are ignored.
 */

import { z } from 'zod'

interface RepoRef {
  owner: string
  name: string
  branch: string
}

interface BundleFile {
  path: string
  size: number
  content?: string
}

export interface CustomPage {
  title?: string
  subtitle?: string
  meta_description?: string
  hero_image_url?: string
  body_html?: string
}

export interface MenuItem {
  label: string
  href: string
}

export interface ExtractedBundle {
  founder_story?: string
  founder_section_header?: string
  philosophy?: string
  philosophy_section_header?: string
  immutable_rules?: Array<{ title: string; body: string }>
  mission_long?: string
  menu_items?: MenuItem[]
  custom_pages?: Record<string, CustomPage>
  /** Diagnostics: which source files were used. */
  _source_files?: string[]
}

/**
 * Zod schema mirroring ExtractedBundle. Used to validate Claude Opus
 * output before writing to app_settings — catches LLM drift (renamed
 * fields, type swaps, missing required structure) so we surface a
 * clean 422 instead of corrupting the DB with malformed data.
 */
const CustomPageZ = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  meta_description: z.string().optional(),
  hero_image_url: z.string().optional(),
  body_html: z.string().optional(),
}).passthrough()

const MenuItemZ = z.object({
  label: z.string(),
  href: z.string(),
})

const ImmutableRuleZ = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
})

export const ExtractedBundleSchema = z.object({
  founder_story: z.string().optional(),
  founder_section_header: z.string().optional(),
  philosophy: z.string().optional(),
  philosophy_section_header: z.string().optional(),
  immutable_rules: z.array(ImmutableRuleZ).optional(),
  mission_long: z.string().optional(),
  menu_items: z.array(MenuItemZ).optional(),
  custom_pages: z.record(z.string(), CustomPageZ).optional(),
}).passthrough()

/** Parse a GitHub URL into { owner, name, branch }. */
export function parseRepoUrl(url: string, fallbackBranch = 'main'): RepoRef | null {
  // Accept formats:
  //   https://github.com/owner/name
  //   https://github.com/owner/name.git
  //   https://github.com/owner/name/tree/branch
  //   git@github.com:owner/name.git
  let m = url.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?(?:\/tree\/([^/]+))?(?:\/.*)?$/)
  if (!m) return null
  return {
    owner: m[1],
    name: m[2],
    branch: m[3] || fallbackBranch,
  }
}

/** List all .md files in a GitHub repo via the contents API (single-level + recursive). */
export async function listRepoMarkdown(repo: RepoRef, githubToken?: string): Promise<BundleFile[]> {
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json' }
  if (githubToken) headers['Authorization'] = `Bearer ${githubToken}`

  // Use the recursive trees API — single round trip for the whole tree.
  const treeUrl = `https://api.github.com/repos/${repo.owner}/${repo.name}/git/trees/${repo.branch}?recursive=1`
  const res = await fetch(treeUrl, { headers })
  if (!res.ok) {
    throw new Error(`GitHub trees API failed (${res.status}): ${await res.text().catch(() => '')}`)
  }
  const data = await res.json()
  const items = (data.tree || []) as Array<{ path: string; type: string; size?: number }>
  return items
    .filter(i => i.type === 'blob' && i.path.toLowerCase().endsWith('.md'))
    .map(i => ({ path: i.path, size: i.size || 0 }))
}

/** Fetch the content of a specific file from a GitHub repo. */
export async function fetchRepoFile(repo: RepoRef, path: string, githubToken?: string): Promise<string> {
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3.raw' }
  if (githubToken) headers['Authorization'] = `Bearer ${githubToken}`
  const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/contents/${encodeURIComponent(path)}?ref=${repo.branch}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GitHub file fetch failed (${res.status}) for ${path}`)
  return res.text()
}

/**
 * Pick the most relevant files from the bundle for static-page extraction.
 * We select by name pattern, capping total size so we don't blow Claude's
 * context window with 80 unrelated weekly-rhythm docs.
 */
export function selectBundleFiles(files: BundleFile[]): BundleFile[] {
  const PRIORITY_PATTERNS: Array<{ pattern: RegExp; weight: number }> = [
    { pattern: /website[_ -]?copy/i,      weight: 100 },
    { pattern: /landing[_ -]?page/i,      weight: 95 },
    { pattern: /founder[_ -]?story/i,     weight: 90 },
    { pattern: /^about|[/_]about/i,       weight: 88 },
    { pattern: /brand[_ -]?guidelines/i,  weight: 80 },
    { pattern: /ica[_ -]?profile|customer[_ -]?avatar/i, weight: 70 },
    { pattern: /imagery|visual[_ -]?guidelines/i, weight: 60 },
    { pattern: /blog[_ -]?bio|author[_ -]?bio/i,   weight: 55 },
    { pattern: /copy[_ -]?bank/i,         weight: 50 },
    { pattern: /philosophy|manifesto/i,   weight: 50 },
    { pattern: /quiz[_ -]?design/i,       weight: 45 },
    { pattern: /funnel[_ -]?blueprint/i,  weight: 40 },
  ]
  const scored = files.map(f => {
    const match = PRIORITY_PATTERNS.find(p => p.pattern.test(f.path))
    return { ...f, score: match?.weight || 0 }
  }).filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)

  // Cap total selected size to ~250KB raw markdown (~ 60K tokens with
  // headers and overhead) so Opus context stays comfortable.
  const MAX_TOTAL_BYTES = 250_000
  const selected: BundleFile[] = []
  let total = 0
  for (const f of scored) {
    if (total + f.size > MAX_TOTAL_BYTES) continue
    selected.push(f)
    total += f.size
  }
  return selected
}

/**
 * Use Claude Opus to extract a structured static_pages payload from a
 * concatenated brand bundle. Returns the parsed object on success.
 */
export async function extractStaticPagesWithOpus(
  bundle: Array<{ path: string; content: string }>,
  brandName: string,
): Promise<ExtractedBundle> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set — cannot run tier-2 extraction')

  const concatenated = bundle.map(f => `# === FILE: ${f.path} ===\n\n${f.content}\n`).join('\n')

  const systemPrompt = `You are a senior content strategist extracting structured website copy from a brand's source markdown.

Output ONLY valid JSON conforming to this TypeScript shape:

{
  "founder_section_header": string,        // e.g. "The story behind it"
  "founder_story": string,                 // long-form first-person, paragraphs separated by \\n\\n. Use the founder's verbatim voice from the source. NEVER paraphrase.
  "philosophy_section_header": string,     // e.g. "What makes this different"
  "philosophy": string,                    // 1-3 paragraphs explaining the brand's approach
  "immutable_rules": [                     // 3-7 items, the brand's core principles
    { "title": "Joy First", "body": "Short imperative sentence." }
  ],
  "mission_long": string,                  // 1-3 paragraphs. The brand's mission. Use bundle voice.
  "menu_items": [                          // Top-nav links derived from the website copy's PAGE headings (Home, Blog, About are added automatically — DO NOT include them)
    { "label": "School", "href": "/school" }
  ],
  "custom_pages": {                        // One entry per non-default top-level page from the website copy
    "school": {
      "title": "School",
      "subtitle": "optional dek",
      "meta_description": "1-2 sentence SEO description",
      "body_html": "<p>...</p><h2>...</h2><p>...</p>"   // pre-rendered HTML, NOT markdown. Use only <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <a href>, <blockquote>. No <h1> (page title is rendered separately).
    }
  }
}

Rules:
- Use the founder's voice verbatim where the source provides it. Don't paraphrase.
- If a field has no source content, OMIT it (don't fabricate).
- For body_html: convert source markdown headers to <h2>/<h3>, lists to <ul>/<li>, paragraphs to <p>, bold to <strong>, italic to <em>. Drop images.
- Slug must be lowercase, hyphenated, ASCII only.
- Skip pages that already have dedicated routes: home/index, blog, about, contact, privacy, terms, quiz.
- Output ONLY the JSON object. No preamble. No \`\`\`json\`\`\` fences. No trailing prose.`

  const userPrompt = `Brand: ${brandName}

Source markdown bundle (${bundle.length} files):

${concatenated.length > 200_000 ? concatenated.substring(0, 200_000) + '\n\n[... truncated for context window ...]' : concatenated}

Return the JSON object now.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 16_000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    throw new Error(`Anthropic API failed (${res.status}): ${(await res.text().catch(() => '')).substring(0, 500)}`)
  }

  const data = await res.json()
  const text: string = data.content?.[0]?.text || ''
  if (!text) throw new Error('Anthropic returned empty content')

  // Tolerate small slips: strip leading ```json fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()

  let raw: unknown
  try {
    raw = JSON.parse(cleaned)
  } catch (err) {
    throw new Error(`Failed to parse Opus output as JSON: ${err instanceof Error ? err.message : String(err)}. First 300 chars: ${cleaned.substring(0, 300)}`)
  }

  // Validate shape via zod — catches LLM drift before we persist.
  const result = ExtractedBundleSchema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues.slice(0, 5).map(i => `${i.path.join('.')} ${i.message}`).join('; ')
    throw new Error(`Opus output failed schema validation: ${issues}`)
  }

  const parsed = result.data as ExtractedBundle
  parsed._source_files = bundle.map(f => f.path)
  return parsed
}
