// lib/parse-brand-guide.ts

import type { ParsedSite, ResearchContext } from './brand-guide-types'

// ---------------------------------------------------------------------------
// Stage 1: PDF → Markdown via LlamaParse v2
// ---------------------------------------------------------------------------

const LLAMA_BASE = 'https://api.cloud.llamaindex.ai/api/v2'
const PARSE_TIMEOUT_MS = 3 * 60 * 1000 // 3 minutes

export async function parsePdfToMarkdown(
  fileBuffer: Buffer,
  filename: string,
): Promise<string> {
  const apiKey = process.env.LLAMA_CLOUD_API_KEY
  if (!apiKey) throw new Error('LLAMA_CLOUD_API_KEY is not set')

  // Step 1: Upload file
  const formData = new FormData()
  const blob = new Blob([fileBuffer], { type: 'application/pdf' })
  formData.append('upload_file', blob, filename)

  const uploadRes = await fetch(`${LLAMA_BASE}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  if (!uploadRes.ok) {
    const text = await uploadRes.text()
    throw new Error(`LlamaParse upload failed (${uploadRes.status}): ${text}`)
  }

  const uploadData = (await uploadRes.json()) as { id: string }
  const fileId = uploadData.id

  // Step 2: Start parse job
  const jobRes = await fetch(`${LLAMA_BASE}/parsing/upload`, {
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

  if (!jobRes.ok) {
    const text = await jobRes.text()
    throw new Error(`LlamaParse job start failed (${jobRes.status}): ${text}`)
  }

  const jobData = (await jobRes.json()) as { id: string }
  const jobId = jobData.id

  // Step 3: Poll with exponential backoff until done or timeout
  const deadline = Date.now() + PARSE_TIMEOUT_MS
  let delay = 2000

  while (Date.now() < deadline) {
    await sleep(delay)
    delay = Math.min(delay * 1.5, 10000)

    const statusRes = await fetch(`${LLAMA_BASE}/parsing/job/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!statusRes.ok) {
      const text = await statusRes.text()
      throw new Error(`LlamaParse status check failed (${statusRes.status}): ${text}`)
    }

    const statusData = (await statusRes.json()) as { status: string; error?: string }

    if (statusData.status === 'ERROR' || statusData.status === 'FAILED') {
      throw new Error(`LlamaParse job failed: ${statusData.error ?? 'unknown error'}`)
    }

    if (statusData.status === 'SUCCESS') {
      // Step 4: Fetch markdown result
      const resultRes = await fetch(
        `${LLAMA_BASE}/parsing/job/${jobId}/result/markdown`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      )

      if (!resultRes.ok) {
        const text = await resultRes.text()
        throw new Error(
          `LlamaParse result fetch failed (${resultRes.status}): ${text}`,
        )
      }

      const resultData = (await resultRes.json()) as { markdown: string }
      return resultData.markdown
    }
  }

  throw new Error('LlamaParse timed out after 3 minutes')
}

// ---------------------------------------------------------------------------
// Stage 2: Markdown → ParsedSite[] via GPT-4o
// ---------------------------------------------------------------------------

const PARSED_SITE_SCHEMA = `{
  "niche": "string — short niche description",
  "hub_or_sub": "'hub' | 'sub'",
  "placeholder_name": "string — working brand name",
  "brand_voice": "string",
  "tagline": "string",
  "tone": "string",
  "visual_direction": "string",
  "brand_personality": "string",
  "style_guide": {
    "primary_color": "string (hex or name)",
    "accent_color": "string (hex or name)",
    "heading_font": "string",
    "body_font": "string",
    "visual_mood": "string",
    "imagery_style": "string",
    "dark_light": "'dark' | 'light'",
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
      "recurring": true,
      "cookie_duration": "string",
      "product_type": "'saas' | 'physical' | 'course'"
    }
  ],
  "content_types": ["string"],
  "pod_name": "string — podcast/content pod name",
  "pod_theme": "string — podcast/content pod theme"
}`

export async function extractSitesFromMarkdown(
  markdown: string,
  siteCount: number,
): Promise<ParsedSite[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const systemPrompt = [
    `You are a brand analysis expert. Extract exactly ${siteCount} site definitions from the provided brand guide markdown.`,
    'Return ONLY a valid JSON array — no markdown fences, no commentary.',
    `Each element must conform to this schema:\n${PARSED_SITE_SCHEMA}`,
    'If a field is not present in the source material, use a sensible empty-string or empty-array default.',
  ].join('\n\n')

  const userPrompt = [
    `Extract exactly ${siteCount} sites from the following brand guide markdown.`,
    'Return a raw JSON array only.',
    '',
    '--- BRAND GUIDE START ---',
    markdown,
    '--- BRAND GUIDE END ---',
  ].join('\n')

  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await callOpenAI({
      apiKey,
      model: 'gpt-4o',
      temperature: 0,
      max_tokens: 8000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = stripMarkdownFences(response)

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      if (attempt === maxAttempts) {
        throw new Error(
          `extractSitesFromMarkdown: JSON parse failed after ${maxAttempts} attempts. Last response:\n${raw}`,
        )
      }
      console.warn(`extractSitesFromMarkdown attempt ${attempt}: JSON parse error, retrying…`)
      continue
    }

    if (!Array.isArray(parsed)) {
      if (attempt === maxAttempts) {
        throw new Error('extractSitesFromMarkdown: response is not an array')
      }
      console.warn(`extractSitesFromMarkdown attempt ${attempt}: not an array, retrying…`)
      continue
    }

    if (parsed.length < siteCount) {
      if (attempt === maxAttempts) {
        throw new Error(
          `extractSitesFromMarkdown: expected ${siteCount} sites, got ${parsed.length}`,
        )
      }
      console.warn(
        `extractSitesFromMarkdown attempt ${attempt}: got ${parsed.length} sites, expected ${siteCount}, retrying…`,
      )
      continue
    }

    // Return exactly siteCount sites
    return (parsed as ParsedSite[]).slice(0, siteCount)
  }

  // Should be unreachable
  throw new Error('extractSitesFromMarkdown: exhausted all attempts')
}

// ---------------------------------------------------------------------------
// Stage 3: Synthesise ResearchContext for each site via GPT-4o
// ---------------------------------------------------------------------------

export async function synthesizeAllResearchContexts(
  sites: ParsedSite[],
): Promise<ParsedSite[]> {
  const results = await Promise.all(
    sites.map(async (site) => {
      try {
        const ctx = await synthesizeResearchContext(site)
        return { ...site, research_context: ctx }
      } catch (err) {
        console.error(
          `synthesizeResearchContext failed for site "${site.niche}":`,
          err,
        )
        return site // leave research_context undefined
      }
    }),
  )
  return results
}

const RESEARCH_CONTEXT_SCHEMA = `{
  "market_overview": "string — 2-3 sentence overview of the market landscape",
  "content_pillars": ["string — 4-6 core content themes"],
  "keyword_themes": ["string — 6-10 high-level keyword clusters"],
  "primary_persona": {
    "name": "string",
    "description": "string",
    "pain_points": ["string"],
    "goals": ["string"]
  },
  "buyer_journey": {
    "awareness": "string — what content reaches them at awareness stage",
    "consideration": "string — what content helps during consideration",
    "decision": "string — what pushes them to convert"
  },
  "unique_angles": ["string — 3-5 differentiated content or positioning angles"]
}`

async function synthesizeResearchContext(site: ParsedSite): Promise<ResearchContext> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const systemPrompt = [
    'You are a content strategy and SEO research expert.',
    'Given information about a niche affiliate/content site, synthesise a ResearchContext object.',
    'Return ONLY valid JSON — no markdown fences, no commentary.',
    `Schema:\n${RESEARCH_CONTEXT_SCHEMA}`,
  ].join('\n\n')

  const userPrompt = buildResearchPrompt(site)

  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await callOpenAI({
      apiKey,
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = stripMarkdownFences(response)

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      if (attempt === maxAttempts) {
        throw new Error(
          `synthesizeResearchContext: JSON parse failed after ${maxAttempts} attempts`,
        )
      }
      console.warn(`synthesizeResearchContext attempt ${attempt}: JSON parse error, retrying…`)
      continue
    }

    return parsed as ResearchContext
  }

  throw new Error('synthesizeResearchContext: exhausted all attempts')
}

function buildResearchPrompt(site: ParsedSite): string {
  const productList = site.affiliate_products
    .map((p) => `  - ${p.name} (${p.category}, ${p.product_type}, commission: ${p.commission})`)
    .join('\n')

  return [
    `Niche: ${site.niche}`,
    `Brand voice: ${site.brand_voice}`,
    `Tone: ${site.tone}`,
    `Brand personality: ${site.brand_personality}`,
    '',
    'ICA Profile:',
    `  Persona: ${site.ica_profile.persona_name}, age ${site.ica_profile.age_range}, income ${site.ica_profile.income}`,
    `  Pain points: ${site.ica_profile.pain_points.join(', ')}`,
    `  Goals: ${site.ica_profile.goals.join(', ')}`,
    `  Motivations: ${site.ica_profile.motivations.join(', ')}`,
    `  Buying behaviour: ${site.ica_profile.buying_behavior}`,
    `  Search behaviour: ${site.ica_profile.search_behaviour.join(', ')}`,
    '',
    `Content types produced: ${site.content_types.join(', ')}`,
    '',
    'Affiliate products:',
    productList || '  (none listed)',
    '',
    'Synthesise a comprehensive ResearchContext JSON for this site.',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface CallOpenAIOptions {
  apiKey: string
  model: string
  temperature: number
  max_tokens: number
  messages: OpenAIMessage[]
}

async function callOpenAI(opts: CallOpenAIOptions): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: opts.temperature,
      max_tokens: opts.max_tokens,
      messages: opts.messages,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI API error (${res.status}): ${text}`)
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[]
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI returned empty content')

  return content
}
