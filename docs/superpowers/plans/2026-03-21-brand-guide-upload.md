# Brand Guide Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PDF brand guide upload to the network wizard, parsing site definitions via LlamaParse + GPT-4o and feeding them into the existing provisioning pipeline.

**Architecture:** New API route accepts PDF, runs 3-stage pipeline (LlamaParse → LLM extraction → research context synthesis), returns structured JSON. NetworkForm gets a new Step 0 for upload vs scratch choice. Provision route gets two new DB writes (target_market, brand_image_styles). Provision-network route forwards new fields.

**Tech Stack:** Next.js 14 (App Router), LlamaParse v2 REST API, OpenAI GPT-4o, Supabase, existing fal.ai image gen.

**Spec:** `docs/superpowers/specs/2026-03-21-brand-guide-upload-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/brand-guide-types.ts` | Create | TypeScript interfaces for parsed data |
| `lib/parse-brand-guide.ts` | Create | 3-stage pipeline: LlamaParse + LLM extract + research synthesis |
| `app/api/admin/parse-brand-guide/route.ts` | Create | POST (upload + start job) and GET (poll status) handlers |
| `components/NetworkForm.tsx` | Modify | Add Step 0 entry point, dynamic SECTIONS, populate from parsed data |
| `app/api/admin/provision-network/route.ts` | Modify | Add `ica_profile`, `style_guide`, `approved_products`, `is_affiliate` to NetworkMember interface + provisionPayload forwarding |
| `app/api/provision/route.ts` | Modify | Add target_market + brand_image_styles writes after existing Phase 1 |

---

## Task 1: TypeScript Interfaces

**Files:**
- Create: `lib/brand-guide-types.ts`

- [ ] **Step 1: Create type definitions**

```typescript
// lib/brand-guide-types.ts

export interface ParsedProduct {
  name: string
  category: string
  commission: string
  recurring: boolean
  cookie_duration: string
  product_type: 'saas' | 'physical' | 'course'
}

export interface ParsedStyleGuide {
  primary_color: string
  accent_color: string
  heading_font: string
  body_font: string
  visual_mood: string
  imagery_style: string
  dark_light: 'dark' | 'light'
  prohibited_elements: string
  preferred_elements: string
}

export interface ParsedICAProfile {
  persona_name: string
  age_range: string
  income: string
  pain_points: string[]
  goals: string[]
  motivations: string[]
  buying_behavior: string
  search_behaviour: string[]
  content_voice: string
  email_hook: string
}

export interface ResearchContext {
  market_overview: string
  content_pillars: string[]
  keyword_themes: string[]
  primary_persona: {
    name: string
    description: string
    pain_points: string[]
    goals: string[]
  }
  buyer_journey: {
    awareness: string
    consideration: string
    decision: string
  }
  unique_angles: string[]
}

export interface ParsedSite {
  niche: string
  hub_or_sub: 'hub' | 'sub'
  placeholder_name: string
  brand_voice: string
  tagline: string
  tone: string
  visual_direction: string
  brand_personality: string
  style_guide: ParsedStyleGuide
  ica_profile: ParsedICAProfile
  affiliate_products: ParsedProduct[]
  content_types: string[]
  pod_name: string
  pod_theme: string
  research_context?: ResearchContext
}

export interface ParseJobStatus {
  status: 'parsing' | 'extracting' | 'synthesizing' | 'done' | 'error'
  result?: ParsedSite[]
  error?: string
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/brand-guide-types.ts
git commit -m "feat: add TypeScript interfaces for brand guide parsing"
```

---

## Task 2: LlamaParse + LLM Pipeline

**Files:**
- Create: `lib/parse-brand-guide.ts`
- Reference: alighos `src/lib/rag/parser.ts` for LlamaParse polling pattern

- [ ] **Step 1: Create LlamaParse stage**

```typescript
// lib/parse-brand-guide.ts

import type { ParsedSite, ResearchContext } from './brand-guide-types'

const LLAMA_API_BASE = 'https://api.cloud.llamaindex.ai/api/v2'

export async function parsePdfToMarkdown(fileBuffer: Buffer, filename: string): Promise<string> {
  const apiKey = process.env.LLAMA_CLOUD_API_KEY
  if (!apiKey) throw new Error('LLAMA_CLOUD_API_KEY not set')

  // Upload file
  const formData = new FormData()
  formData.append('file', new Blob([fileBuffer]), filename)

  const uploadRes = await fetch(`${LLAMA_API_BASE}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })
  if (!uploadRes.ok) throw new Error(`LlamaParse upload failed: ${uploadRes.status}`)
  const { id: fileId } = await uploadRes.json()

  // Start parse job
  const parseRes = await fetch(`${LLAMA_API_BASE}/parsing/jobs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_id: fileId,
      tier: 'agentic',
      output_type: 'markdown',
    }),
  })
  if (!parseRes.ok) throw new Error(`LlamaParse parse failed: ${parseRes.status}`)
  const { id: jobId } = await parseRes.json()

  // Poll for completion (max 3 minutes, exponential backoff)
  const maxWait = 180_000
  const start = Date.now()
  let pollInterval = 2000

  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, pollInterval))
    pollInterval = Math.min(pollInterval * 1.5, 10_000)

    const statusRes = await fetch(`${LLAMA_API_BASE}/parsing/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!statusRes.ok) continue

    const status = await statusRes.json()
    if (status.status === 'completed') {
      const resultRes = await fetch(`${LLAMA_API_BASE}/parsing/jobs/${jobId}/result/markdown`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (!resultRes.ok) throw new Error('Failed to fetch LlamaParse result')
      const result = await resultRes.json()
      return result.markdown || result.text || ''
    }
    if (status.status === 'failed') {
      throw new Error(`LlamaParse job failed: ${status.error || 'unknown'}`)
    }
  }
  throw new Error('LlamaParse timeout after 3 minutes')
}
```

- [ ] **Step 2: Create LLM extraction stage (Stage 2)**

Add to `lib/parse-brand-guide.ts`:

```typescript
export async function extractSitesFromMarkdown(
  markdown: string,
  siteCount: number
): Promise<ParsedSite[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not set')

  const systemPrompt = `You are a data extraction assistant. Extract exactly ${siteCount} site definitions from this brand guide document. Return valid JSON only — no markdown fences, no explanation.`

  const userPrompt = `Extract ${siteCount} sites from this brand guide. The first site should be the hub, the rest are sub-sites.

For each site return this exact JSON structure:
{
  "niche": "string",
  "hub_or_sub": "hub" or "sub",
  "placeholder_name": "string (the site name from the document)",
  "brand_voice": "string",
  "tagline": "string",
  "tone": "string",
  "visual_direction": "string",
  "brand_personality": "string",
  "style_guide": {
    "primary_color": "hex string",
    "accent_color": "hex string",
    "heading_font": "string",
    "body_font": "string",
    "visual_mood": "string",
    "imagery_style": "string",
    "dark_light": "dark" or "light",
    "prohibited_elements": "string",
    "preferred_elements": "string"
  },
  "ica_profile": {
    "persona_name": "string",
    "age_range": "string",
    "income": "string",
    "pain_points": ["string"],
    "goals": ["string"],
    "motivations": ["string"],
    "buying_behavior": "string",
    "search_behaviour": ["string"],
    "content_voice": "string",
    "email_hook": "string"
  },
  "affiliate_products": [
    {
      "name": "string",
      "category": "string",
      "commission": "string",
      "recurring": boolean,
      "cookie_duration": "string",
      "product_type": "saas" or "physical" or "course"
    }
  ],
  "content_types": ["string"],
  "pod_name": "string",
  "pod_theme": "string"
}

Return a JSON array of ${siteCount} site objects. Document:

${markdown}`

  let lastError = ''
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0,
        max_tokens: 8000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`)

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''

    try {
      const jsonStr = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      const parsed = JSON.parse(jsonStr)
      const sites = Array.isArray(parsed) ? parsed : [parsed]
      if (sites.length < siteCount) {
        lastError = `Expected ${siteCount} sites, got ${sites.length}`
        continue
      }
      return sites.slice(0, siteCount) as ParsedSite[]
    } catch (e) {
      lastError = `JSON parse error: ${e instanceof Error ? e.message : String(e)}`
      continue
    }
  }
  throw new Error(`LLM extraction failed after 3 attempts: ${lastError}`)
}
```

- [ ] **Step 3: Create research context synthesis (Stage 3) with retry**

Add to `lib/parse-brand-guide.ts`:

```typescript
async function synthesizeResearchContext(site: ParsedSite): Promise<ResearchContext> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not set')

  const prompt = `Based on this site's brand data, synthesize a market research context.

Site niche: ${site.niche}
Brand voice: ${site.brand_voice}
Brand personality: ${site.brand_personality}
Target persona: ${site.ica_profile.persona_name} (${site.ica_profile.age_range}, ${site.ica_profile.income})
Pain points: ${site.ica_profile.pain_points.join(', ')}
Goals: ${site.ica_profile.goals.join(', ')}
Search behaviour: ${site.ica_profile.search_behaviour.join(', ')}
Content types: ${site.content_types.join(', ')}
Products: ${site.affiliate_products.map(p => p.name).join(', ')}

Return this exact JSON structure:
{
  "market_overview": "2-3 paragraph market analysis for this niche",
  "content_pillars": ["5-8 content themes"],
  "keyword_themes": ["10-15 keyword cluster patterns"],
  "primary_persona": {
    "name": "${site.ica_profile.persona_name}",
    "description": "2-3 sentence summary",
    "pain_points": ${JSON.stringify(site.ica_profile.pain_points)},
    "goals": ${JSON.stringify(site.ica_profile.goals)}
  },
  "buyer_journey": {
    "awareness": "What triggers their search",
    "consideration": "How they evaluate",
    "decision": "What converts them"
  },
  "unique_angles": ["3-5 differentiators"]
}

Return valid JSON only.`

  // Retry up to 2 times on JSON parse failure
  let lastError = ''
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 4000,
        messages: [
          { role: 'system', content: 'You are a market research analyst. Return valid JSON only.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`)
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''

    try {
      const jsonStr = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      return JSON.parse(jsonStr) as ResearchContext
    } catch (e) {
      lastError = `JSON parse error: ${e instanceof Error ? e.message : String(e)}`
      continue
    }
  }
  throw new Error(`Research synthesis failed after 3 attempts: ${lastError}`)
}

export async function synthesizeAllResearchContexts(
  sites: ParsedSite[]
): Promise<ParsedSite[]> {
  const results = await Promise.all(
    sites.map(async (site) => {
      try {
        site.research_context = await synthesizeResearchContext(site)
      } catch (err) {
        console.error(`Research synthesis failed for ${site.niche}:`, err)
        // Leave research_context undefined — provision still works
      }
      return site
    })
  )
  return results
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/parse-brand-guide.ts
git commit -m "feat: add LlamaParse + GPT-4o brand guide parsing pipeline"
```

---

## Task 3: Parse Brand Guide API Route

**Files:**
- Create: `app/api/admin/parse-brand-guide/route.ts`

- [ ] **Step 1: Create route with auth, job store, POST and GET handlers**

```typescript
// app/api/admin/parse-brand-guide/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parsePdfToMarkdown, extractSitesFromMarkdown, synthesizeAllResearchContexts } from '@/lib/parse-brand-guide'
import type { ParseJobStatus } from '@/lib/brand-guide-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// In-memory job store (single-instance admin tool)
const jobs = new Map<string, ParseJobStatus>()

function cleanupJobs() {
  if (jobs.size > 50) {
    const keys = Array.from(jobs.keys())
    for (let i = 0; i < keys.length - 50; i++) jobs.delete(keys[i])
  }
}

export async function POST(request: NextRequest) {
  // Auth check — verify Supabase session (same pattern as other admin routes)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const siteCount = parseInt(formData.get('siteCount') as string, 10)

    if (!file || !file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'PDF file required' }, { status: 400 })
    }
    if (!siteCount || siteCount < 2 || siteCount > 8) {
      return NextResponse.json({ error: 'siteCount must be 2-8' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 })
    }

    const jobId = crypto.randomUUID()
    jobs.set(jobId, { status: 'parsing' })
    cleanupJobs()

    // Run pipeline in background (don't await)
    const buffer = Buffer.from(await file.arrayBuffer())
    runPipeline(jobId, buffer, file.name, siteCount).catch((err) => {
      console.error(`[parse-brand-guide] Pipeline error for job ${jobId}:`, err)
      jobs.set(jobId, { status: 'error', error: err.message })
    })

    return NextResponse.json({ jobId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function runPipeline(jobId: string, buffer: Buffer, filename: string, siteCount: number) {
  jobs.set(jobId, { status: 'parsing' })
  const markdown = await parsePdfToMarkdown(buffer, filename)

  jobs.set(jobId, { status: 'extracting' })
  const sites = await extractSitesFromMarkdown(markdown, siteCount)

  jobs.set(jobId, { status: 'synthesizing' })
  const enrichedSites = await synthesizeAllResearchContexts(sites)

  jobs.set(jobId, { status: 'done', result: enrichedSites })
}

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const job = jobs.get(jobId)
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  return NextResponse.json(job)
}
```

Note: Uses `crypto.randomUUID()` (built into Node 18+) instead of `uuid` package — no dependency needed.

- [ ] **Step 2: Add env var to .env.local**

Add this line to `.env.local`:
```
LLAMA_CLOUD_API_KEY=llx-PSP0cf0doFaaCz9ZisWJLynjZ5PAWyyChXZHuXBDK9nj3v55
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/parse-brand-guide/route.ts
git commit -m "feat: add parse-brand-guide API route with auth and job polling"
```

---

## Task 4: Modify Provision-Network Route — Forward New Fields

**Files:**
- Modify: `app/api/admin/provision-network/route.ts`

- [ ] **Step 1: Add new fields to NetworkMember interface (line 6-34)**

Add after `author_social_urls` (line 33):

```typescript
  // Brand guide upload fields
  ica_profile?: Record<string, any>
  style_guide?: Record<string, any>
  approved_products?: Array<Record<string, any>>
  is_affiliate?: boolean
```

- [ ] **Step 2: Forward new fields in provisionPayload (after line 195)**

Add after the author data forwarding block (after line 195):

```typescript
        // Brand guide upload fields — forward to /api/provision
        if (member.ica_profile) provisionPayload.ica_profile = member.ica_profile
        if (member.style_guide) provisionPayload.style_guide = member.style_guide
        if (member.approved_products) provisionPayload.approved_products = member.approved_products
        if (member.is_affiliate) provisionPayload.is_affiliate = true
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/provision-network/route.ts
git commit -m "feat: forward ica_profile, style_guide, products through provision-network"
```

---

## Task 5: Modify Provision Route — New DB Writes

**Files:**
- Modify: `app/api/provision/route.ts`

- [ ] **Step 1: Add ica_profile and style_guide to body destructuring (around line 122-163)**

Add to the destructured fields:

```typescript
    ica_profile,       // optional — detailed ICA from brand guide upload
    style_guide,       // optional — visual style from brand guide upload
```

- [ ] **Step 2: Add target_market table write (insert after integration_credentials block, ~line 309)**

```typescript
    // ── Phase 1: Seed target_market table (detailed ICA for outline writer) ──
    if (ica_profile) {
      const ica = ica_profile
      const tmPayload: Record<string, any> = {
        username: username,
        target_market_name: ica.persona_name || target_market || display_name,
        description: target_market || null,
        age: ica.age_range || null,
        income_level: ica.income || null,
        occupation: ica.occupation || null,
        location: ica.location || null,
        lifestyle: ica.lifestyle || null,
        hobbies_and_interests: ica.hobbies_and_interests || null,
        values: ica.values || null,
        challenges: ica.challenges || null,
        pain_points: Array.isArray(ica.pain_points) ? ica.pain_points.join('; ') : ica.pain_points || null,
        goals: Array.isArray(ica.goals) ? ica.goals.join('; ') : ica.goals || null,
        motivations: Array.isArray(ica.motivations) ? ica.motivations.join('; ') : ica.motivations || null,
        buying_behavior: ica.buying_behavior || null,
        preferred_channels: Array.isArray(ica.preferred_channels) ? ica.preferred_channels.join('; ') : ica.preferred_channels || null,
        tech_savviness: ica.tech_savviness || null,
      }

      // target_market may have multiple rows per username — insert new row, don't upsert
      const { error: tmErr } = await supabase
        .from('target_market')
        .insert(tmPayload)
      if (tmErr) {
        console.warn(`[PROVISION] target_market insert failed: ${tmErr.message}`)
        warnings.push(`target_market: ${tmErr.message}`)
      }
    }
```

Note: Uses INSERT not dbUpsert because `target_market` table can have multiple rows per username (multiple personas). Each brand guide upload creates a fresh persona row.

- [ ] **Step 3: Add brand_image_styles write (insert after target_market block)**

```typescript
    // ── Phase 1: Seed brand_image_styles (for Imagineer flash workflow) ──
    if (style_guide) {
      const sg = style_guide
      const bisPayload = {
        name: 'Default Style',
        user_name: username,
        visual_style: sg.visual_mood || sg.imagery_style || null,
        color_palette: [sg.primary_color, sg.accent_color].filter(Boolean).join(', ') || null,
        mood_and_atmosphere: sg.visual_mood || null,
        composition_style: sg.composition_style || null,
        lighting_preferences: sg.lighting_preferences || null,
        image_type_preferences: sg.imagery_style || null,
        subject_guidelines: sg.subject_guidelines || null,
        prohibited_elements: sg.prohibited_elements || null,
        preferred_elements: sg.preferred_elements || null,
        ai_prompt_instructions: sg.ai_prompt_instructions || null,
      }

      // Unique constraint on (name, user_name) — use select-first pattern
      // Not using dbUpsert because it filters on a single column;
      // brand_image_styles needs compound filter (name + user_name)
      const { data: existingBis } = await supabase
        .from('brand_image_styles')
        .select('id')
        .eq('user_name', username)
        .eq('name', 'Default Style')
        .limit(1)
        .maybeSingle()

      if (existingBis) {
        await supabase.from('brand_image_styles')
          .update(bisPayload)
          .eq('id', existingBis.id)
      } else {
        const { error: bisErr } = await supabase
          .from('brand_image_styles')
          .insert(bisPayload)
        if (bisErr) {
          console.warn(`[PROVISION] brand_image_styles insert failed: ${bisErr.message}`)
          warnings.push(`brand_image_styles: ${bisErr.message}`)
        }
      }
    }
```

- [ ] **Step 4: Commit**

```bash
git add app/api/provision/route.ts
git commit -m "feat: add target_market + brand_image_styles writes to provision"
```

---

## Task 6: Modify NetworkForm — Step 0 & Upload Path

**Files:**
- Modify: `components/NetworkForm.tsx`

- [ ] **Step 1: Add new state variables (after line 116)**

```typescript
// ── Upload path state ──
const [entryMode, setEntryMode] = useState<'choose' | 'upload' | 'scratch'>('choose')
const [uploadFile, setUploadFile] = useState<File | null>(null)
const [uploadSiteCount, setUploadSiteCount] = useState(5) // total sites (1 hub + 4 subs)
const [parseJobId, setParseJobId] = useState<string | null>(null)
const [parseStatus, setParseStatus] = useState<string>('')
const [parsedSites, setParsedSites] = useState<any[]>([])
```

- [ ] **Step 2: Replace SECTIONS constant (lines 15-20) with dynamic sections**

Replace the existing `const SECTIONS = [...]` at lines 15-20 with:

```typescript
const UPLOAD_SECTIONS = [
  { key: 'entry', label: 'Start', icon: '📄' },
  { key: 'domains', label: 'Domains & Names', icon: '🌐' },
  { key: 'launch', label: 'Launch', icon: '🚀' },
]

const SCRATCH_SECTIONS = [
  { key: 'niche', label: 'Network Setup', icon: '🌐' },
  { key: 'review', label: 'Review Sites', icon: '✏️' },
  { key: 'research', label: 'Brand Research', icon: '🔬' },
  { key: 'launch', label: 'Launch', icon: '🚀' },
]
```

Then inside the component, compute which sections are active:

```typescript
const activeSections = entryMode === 'upload' ? UPLOAD_SECTIONS
  : entryMode === 'scratch' ? SCRATCH_SECTIONS
  : UPLOAD_SECTIONS // default during 'choose' phase
```

- [ ] **Step 3: Update sidebar nav (lines 427-437)**

Replace `{SECTIONS.map((s, i) => (` with:

```tsx
{activeSections.map((s, i) => (
  <button
    key={s.key}
    onClick={() => setActiveSection(i)}
    className={`w-full text-left px-3 py-2 rounded text-sm ${
      activeSection === i ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    {s.icon} {s.label}
  </button>
))}
```

- [ ] **Step 4: Add upload handlers**

```typescript
const handleUploadParse = async () => {
  if (!uploadFile) return
  setParseStatus('Uploading...')
  setError('')

  const formData = new FormData()
  formData.append('file', uploadFile)
  formData.append('siteCount', String(uploadSiteCount))

  try {
    const res = await fetch('/api/admin/parse-brand-guide', {
      method: 'POST',
      body: formData,
    })
    const { jobId, error } = await res.json()
    if (error) throw new Error(error)
    setParseJobId(jobId)
    pollParseJob(jobId)
  } catch (err: any) {
    setError(err.message)
    setParseStatus('')
  }
}

const pollParseJob = async (jobId: string) => {
  const maxPoll = 180_000
  const start = Date.now()
  let interval = 2000

  while (Date.now() - start < maxPoll) {
    await new Promise(r => setTimeout(r, interval))
    interval = Math.min(interval * 1.3, 5000)

    try {
      const res = await fetch(`/api/admin/parse-brand-guide?jobId=${jobId}`)
      const job = await res.json()

      if (job.status === 'parsing') setParseStatus('Parsing document...')
      else if (job.status === 'extracting') setParseStatus('Extracting brand data...')
      else if (job.status === 'synthesizing') setParseStatus('Synthesizing research context...')
      else if (job.status === 'done' && job.result) {
        setParseStatus('')
        populateFromParsed(job.result)
        return
      } else if (job.status === 'error') {
        throw new Error(job.error || 'Parse failed')
      }
    } catch (err: any) {
      setError(err.message)
      setParseStatus('')
      return
    }
  }
  setError('Parse timed out after 3 minutes. Try again or use Build from Scratch.')
  setParseStatus('')
}
```

- [ ] **Step 5: Add populateFromParsed**

```typescript
const populateFromParsed = (sites: any[]) => {
  setParsedSites(sites)

  const mapped: NicheSuggestion[] = sites.map((s) => ({
    niche: s.niche,
    description: s.brand_personality || '',
    suggested_brand_name: s.placeholder_name,
    suggested_username: s.placeholder_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    enabled: true,
    domain: '',
    domainSuggestions: [],
    loadingDomains: false,
  }))
  setNiches(mapped)

  const brands: Record<number, any> = {}
  const research: Record<number, any> = {}
  sites.forEach((s, i) => {
    brands[i] = {
      brand_voice: s.brand_voice,
      target_market: s.ica_profile?.persona_name
        ? `${s.ica_profile.persona_name} (${s.ica_profile.age_range}, ${s.ica_profile.income})`
        : '',
      brand_blurb: s.tagline || '',
      seed_keywords: s.content_types?.join(', ') || '',
      image_style: {
        visual_style: s.style_guide?.visual_mood || '',
        color_palette: s.style_guide?.primary_color || '',
        mood: s.style_guide?.imagery_style || '',
      },
    }
    if (s.research_context) research[i] = s.research_context
  })
  setNicheBrands(brands)
  setNicheResearch(research)

  if (sites[0]?.pod_name) setNetworkName(sites[0].pod_name)
  if (sites[0]?.pod_theme) setSeedNiche(sites[0].pod_theme)

  setActiveSection(1) // advance to domains step
}
```

- [ ] **Step 6: Refactor JSX sections to use key-based rendering**

Replace the current section rendering pattern (lines 492-936). Currently each section is gated by `activeSection === 0`, `activeSection === 1`, etc. Change to key-based:

```tsx
{/* Step 0 — Entry point (upload path only) */}
{activeSections[activeSection]?.key === 'entry' && (
  <div className="space-y-6">
    {entryMode === 'choose' ? (
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setEntryMode('upload')}
          className="p-6 border-2 border-dashed rounded-lg hover:border-blue-500 text-left"
        >
          <h3 className="text-lg font-semibold">Upload Brand Guide</h3>
          <p className="text-sm text-gray-500 mt-1">
            Parse a PDF from your AI tool to extract sites, brand data, and products.
          </p>
        </button>
        <button
          onClick={() => { setEntryMode('scratch'); setActiveSection(0) }}
          className="p-6 border-2 border-dashed rounded-lg hover:border-green-500 text-left"
        >
          <h3 className="text-lg font-semibold">Build from Scratch</h3>
          <p className="text-sm text-gray-500 mt-1">
            Enter a seed niche and generate everything with AI.
          </p>
        </button>
      </div>
    ) : (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Number of sites</label>
          <div className="flex items-center gap-2">
            <span className="text-sm">1 Hub +</span>
            <select
              value={uploadSiteCount - 1}
              onChange={e => setUploadSiteCount(parseInt(e.target.value) + 1)}
              className="border rounded px-2 py-1"
            >
              {[1,2,3,4,5,6,7].map(n => (
                <option key={n} value={n}>{n} sub-sites</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Brand Guide PDF</label>
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-400"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f?.type === 'application/pdf') setUploadFile(f)
            }}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.pdf'
              input.onchange = () => { if (input.files?.[0]) setUploadFile(input.files[0]) }
              input.click()
            }}
          >
            {uploadFile ? (
              <p className="text-sm">{uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)</p>
            ) : (
              <p className="text-gray-400">Drag & drop PDF or click to browse</p>
            )}
          </div>
        </div>
        <button
          onClick={handleUploadParse}
          disabled={!uploadFile || !!parseStatus}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {parseStatus || 'Parse Brand Guide'}
        </button>
      </div>
    )}
  </div>
)}

{/* Niche setup (scratch path only) */}
{activeSections[activeSection]?.key === 'niche' && (
  // ... existing lines 492-533 JSX unchanged ...
)}

{/* Domain search & review (upload path uses 'domains', scratch path uses 'review') */}
{(activeSections[activeSection]?.key === 'review' || activeSections[activeSection]?.key === 'domains') && (
  <div className="space-y-4">
    {/* Hub assignment radio (upload path only) */}
    {entryMode === 'upload' && (
      <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
        <span className="font-medium">Hub site:</span> Select which site is the hub
      </div>
    )}
    {/* Existing niche cards from lines 536-668 — add hub radio + placeholder label */}
    {niches.map((n, idx) => (
      <div key={idx} className="border rounded-lg p-4">
        {entryMode === 'upload' && (
          <div className="flex items-center gap-4 mb-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="hub-site"
                checked={idx === 0} // default first as hub
                onChange={() => {
                  // Move selected site to index 0
                  const reordered = [...niches]
                  const [selected] = reordered.splice(idx, 1)
                  reordered.unshift(selected)
                  setNiches(reordered)
                }}
              />
              Hub
            </label>
            {parsedSites[idx]?.placeholder_name && (
              <span className="text-xs text-gray-400">
                (from PDF: {parsedSites[idx].placeholder_name})
              </span>
            )}
          </div>
        )}
        {/* ... rest of existing niche card JSX (toggle, brand name, username, niche, domain search) ... */}
        {/* The enable/disable toggle already exists in the review section JSX and works for both paths */}
      </div>
    ))}
  </div>
)}

{/* Brand research (scratch path only — upload path skips this) */}
{activeSections[activeSection]?.key === 'research' && (
  // ... existing lines 671-811 JSX unchanged ...
)}

{/* Launch (both paths) */}
{activeSections[activeSection]?.key === 'launch' && (
  // ... existing lines 814-936 JSX unchanged ...
)}
```

- [ ] **Step 7: Update launchNetwork member payload (around line 317-330)**

Add parsed data to each member in the `members.map()`:

```typescript
const origIdx = niches.indexOf(n)
const parsedSite = parsedSites[origIdx]

// Existing fields...
brand_voice: nicheBrands[origIdx]?.brand_voice || undefined,
target_market: nicheBrands[origIdx]?.target_market || undefined,
blurb: nicheBrands[origIdx]?.brand_blurb || undefined,
// ... existing seed_keywords, image_style, research_context ...

// Brand guide upload fields
...(parsedSite?.ica_profile && { ica_profile: parsedSite.ica_profile }),
...(parsedSite?.style_guide && { style_guide: parsedSite.style_guide }),
...(parsedSite?.affiliate_products?.length && {
  approved_products: parsedSite.affiliate_products.map((p: any) => ({
    name: p.name,
    category: p.category,
    product_type: p.product_type || 'saas',
    has_affiliate_program: true,
    metadata: {
      commission: p.commission,
      recurring: p.recurring,
      cookie_duration: p.cookie_duration,
    },
  }))
}),
...(entryMode === 'upload' && { is_affiliate: true }),
```

- [ ] **Step 8: Commit**

```bash
git add components/NetworkForm.tsx
git commit -m "feat: add brand guide upload UI with Step 0, dynamic sections, hub radio"
```

---

## Task 7: End-to-End Test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test upload path**

1. Navigate to `/admin/network`
2. Verify two cards appear
3. Select "Upload Brand Guide"
4. Set "1 Hub + 5 sub-sites"
5. Upload the test PDF
6. Click "Parse Brand Guide"
7. Verify progress states cycle
8. Verify 6 sites populate with niches, brand data
9. Verify hub radio on first site
10. Click "Suggest Domains" on a site
11. Verify domain suggestions appear

- [ ] **Step 3: Test scratch path still works**

1. Refresh page
2. Select "Build from Scratch"
3. Verify existing 4-step wizard works unchanged

- [ ] **Step 4: Fix any issues found and commit**

```bash
git add -A
git commit -m "fix: address issues found during e2e testing"
```
