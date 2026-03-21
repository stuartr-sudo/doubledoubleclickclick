# Agent-Driven Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MCP server + API endpoint system so clients' AI agents can submit structured site concepts directly, replacing the fragile PDF parsing pipeline.

**Architecture:** New `POST /api/drafts` endpoint accepts structured site concept data, validates it, stores in a `site_drafts` Supabase table. API key auth via `client_api_keys` table. Two admin pages for key management and draft review. Standalone MCP server repo (`doubleclicker-onboard`) with one tool that wraps the API call.

**Tech Stack:** Next.js 14 (App Router), Supabase (PostgreSQL), bcryptjs (existing dep), TypeScript, MCP SDK (`@modelcontextprotocol/sdk`)

**Spec:** `docs/superpowers/specs/2026-03-21-agent-onboarding-design.md`

---

## File Structure

### New Files (Blog Cloner — this repo)
- `app/api/drafts/route.ts` — POST endpoint for draft submission
- `app/admin/api-keys/page.tsx` — Admin API key management page
- `app/admin/api-keys/ApiKeyManager.tsx` — Client component for key generation/revocation
- `app/admin/drafts/page.tsx` — Admin draft review dashboard
- `app/admin/drafts/DraftReview.tsx` — Client component for draft detail/edit/provision
- `lib/api-keys.ts` — API key generation, hashing, validation utilities
- `lib/drafts.ts` — Draft validation, storage, and provision mapping utilities
- `lib/draft-types.ts` — TypeScript interfaces for SiteConceptPayload, SiteConcept, etc.

### New Files (Separate repo — doubleclicker-onboard)
- `doubleclicker-onboard/package.json`
- `doubleclicker-onboard/tsconfig.json`
- `doubleclicker-onboard/src/index.ts` — MCP server with submit_site_concept tool
- `doubleclicker-onboard/.env.example`
- `doubleclicker-onboard/README.md`

### Modified Files
- None — all new files. Existing provision flow is called from the new admin UI, not modified.

---

## Tasks

### Task 1: TypeScript Types + Validation Utilities

**Files:**
- Create: `lib/draft-types.ts`
- Create: `lib/drafts.ts`

- [ ] **Step 1: Create type definitions**

Create `lib/draft-types.ts` with all TypeScript interfaces matching the spec schema:

```typescript
// lib/draft-types.ts

export interface SiteConceptPayload {
  type: "single" | "network"
  network_name?: string
  sites: SiteConcept[]
  contact_email: string
  contact_name?: string
  notes?: string
}

export interface SiteConcept {
  role: "main" | "hub" | "sub"
  niche: string
  placeholder_name?: string
  brand_voice: string
  tone?: string
  tagline?: string
  ica_profile?: ICAProfile
  style_guide?: StyleGuide
  affiliate_products?: AffiliateProduct[]
  content_types?: string[]
  seed_keywords?: string[]
  articles_per_day?: number
  languages?: string[]
  author_name?: string
  author_bio?: string
}

export interface ICAProfile {
  persona_name?: string
  age_range?: string
  income?: string
  pain_points?: string[]
  goals?: string[]
  motivations?: string[]
  buying_behavior?: string
  search_behaviour?: string[]
}

export interface StyleGuide {
  primary_color?: string
  accent_color?: string
  heading_font?: string
  body_font?: string
  visual_mood?: string
  imagery_style?: string
  dark_light?: "dark" | "light"
}

export interface AffiliateProduct {
  name: string
  category?: string
  commission?: string
  product_type?: "saas" | "physical" | "course"
  url?: string
}

export interface DraftRecord {
  id: string
  client_api_key_id: string
  client_name: string
  contact_email: string
  contact_name: string | null
  type: "single" | "network"
  network_name: string | null
  sites: SiteConcept[]
  notes: string | null
  status: "pending" | "reviewed" | "provisioning" | "provisioned" | "rejected"
  admin_notes: string | null
  domain_selections: DomainSelection[] | null
  provision_results: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface DomainSelection {
  site_index: number
  domain: string
  username: string
  purchase_domain?: boolean
  domain_yearly_price?: Record<string, unknown>
}

export interface ClientApiKey {
  id: string
  client_name: string
  contact_email: string
  key_prefix: string
  created_at: string
  revoked_at: string | null
}
```

- [ ] **Step 2: Create validation utility**

Create `lib/drafts.ts` with validation logic:

```typescript
// lib/drafts.ts
import { SiteConceptPayload } from './draft-types'

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateDraftPayload(payload: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const data = payload as SiteConceptPayload

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Payload must be a JSON object'] }
  }

  // Type
  if (!data.type || !['single', 'network'].includes(data.type)) {
    errors.push('type is required and must be "single" or "network"')
  }

  // Contact email
  if (!data.contact_email || !EMAIL_REGEX.test(data.contact_email)) {
    errors.push('contact_email is required and must be a valid email')
  }

  // Sites array
  if (!Array.isArray(data.sites) || data.sites.length === 0) {
    errors.push('sites must be a non-empty array')
  } else {
    // Validate each site
    data.sites.forEach((site, i) => {
      if (!site.niche || typeof site.niche !== 'string' || site.niche.trim() === '') {
        errors.push(`sites[${i}].niche is required`)
      }
      if (!site.brand_voice || typeof site.brand_voice !== 'string' || site.brand_voice.trim() === '') {
        errors.push(`sites[${i}].brand_voice is required`)
      }
      if (!site.role || !['main', 'hub', 'sub'].includes(site.role)) {
        errors.push(`sites[${i}].role must be "main", "hub", or "sub"`)
      }
      // Validate hex colors if provided
      if (site.style_guide?.primary_color && !HEX_COLOR_REGEX.test(site.style_guide.primary_color)) {
        errors.push(`sites[${i}].style_guide.primary_color must be a valid hex color (e.g. #1a5632)`)
      }
      if (site.style_guide?.accent_color && !HEX_COLOR_REGEX.test(site.style_guide.accent_color)) {
        errors.push(`sites[${i}].style_guide.accent_color must be a valid hex color (e.g. #c4a35a)`)
      }
    })

    // Role validation
    if (data.type === 'single') {
      if (data.sites.length !== 1) {
        errors.push('Single site type must have exactly 1 site')
      } else if (data.sites[0]?.role !== 'main') {
        errors.push('Single site must have role "main"')
      }
    }

    if (data.type === 'network') {
      const hubs = data.sites.filter(s => s.role === 'hub')
      const subs = data.sites.filter(s => s.role === 'sub')
      if (hubs.length !== 1) {
        errors.push('Network must have exactly 1 hub site')
      }
      if (subs.length < 1) {
        errors.push('Network must have at least 1 sub site')
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add lib/draft-types.ts lib/drafts.ts
git commit -m "feat: add draft type definitions and validation utilities"
```

---

### Task 2: Database Tables (Supabase Migration)

**Files:**
- Create: Supabase migration (via API or SQL)

- [ ] **Step 1: Create client_api_keys table**

Run this SQL against the Supabase project. You can use the Supabase dashboard or the MCP tool `apply_migration`. Find the project ID first via `list_projects`.

```sql
CREATE TABLE IF NOT EXISTS client_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  contact_email text NOT NULL,
  api_key_hash text NOT NULL,
  key_prefix text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX idx_client_api_keys_prefix ON client_api_keys (key_prefix);
CREATE INDEX idx_client_api_keys_active ON client_api_keys (revoked_at) WHERE revoked_at IS NULL;
```

- [ ] **Step 2: Create site_drafts table**

```sql
CREATE TABLE IF NOT EXISTS site_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_api_key_id uuid REFERENCES client_api_keys(id),
  client_name text NOT NULL,
  contact_email text NOT NULL,
  contact_name text,
  type text NOT NULL CHECK (type IN ('single', 'network')),
  network_name text,
  sites jsonb NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'provisioning', 'provisioned', 'rejected')),
  admin_notes text,
  domain_selections jsonb,
  provision_results jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_drafts_status ON site_drafts (status);
CREATE INDEX idx_site_drafts_client ON site_drafts (client_api_key_id);
```

- [ ] **Step 3: Commit note**

No file to commit — tables created in Supabase directly. Note the migration was applied.

---

### Task 3: API Key Utilities

**Files:**
- Create: `lib/api-keys.ts`

- [ ] **Step 1: Create API key utility functions**

```typescript
// lib/api-keys.ts
import { createServiceClient } from '@/lib/supabase/service'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const KEY_PREFIX = 'dc_live_'

export function generateApiKey(): { key: string; prefix: string } {
  const random = crypto.randomBytes(24).toString('base64url') // 32 chars
  const key = `${KEY_PREFIX}${random}`
  const prefix = key.substring(0, 12)
  return { key, prefix }
}

export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10)
}

export async function createApiKeyRecord(clientName: string, contactEmail: string): Promise<{ key: string; id: string }> {
  const { key, prefix } = generateApiKey()
  const hash = await hashApiKey(key)

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('client_api_keys')
    .insert({
      client_name: clientName,
      contact_email: contactEmail,
      api_key_hash: hash,
      key_prefix: prefix,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create API key: ${error.message}`)

  return { key, id: data.id }
}

export async function validateApiKey(bearerToken: string): Promise<{ valid: boolean; keyRecord?: { id: string; client_name: string; contact_email: string } }> {
  if (!bearerToken || !bearerToken.startsWith(KEY_PREFIX)) {
    return { valid: false }
  }

  const supabase = createServiceClient()

  // Filter by prefix first (avoids O(n) bcrypt comparisons)
  const prefix = bearerToken.substring(0, 12)
  const { data: keys, error } = await supabase
    .from('client_api_keys')
    .select('id, client_name, contact_email, api_key_hash')
    .eq('key_prefix', prefix)
    .is('revoked_at', null)

  if (error || !keys || keys.length === 0) {
    return { valid: false }
  }

  // Compare against each active key hash
  for (const keyRecord of keys) {
    const match = await bcrypt.compare(bearerToken, keyRecord.api_key_hash)
    if (match) {
      return {
        valid: true,
        keyRecord: {
          id: keyRecord.id,
          client_name: keyRecord.client_name,
          contact_email: keyRecord.contact_email,
        },
      }
    }
  }

  return { valid: false }
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('client_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)

  if (error) throw new Error(`Failed to revoke API key: ${error.message}`)
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add lib/api-keys.ts
git commit -m "feat: add API key generation, hashing, and validation utilities"
```

---

### Task 4: POST /api/drafts Endpoint

**Files:**
- Create: `app/api/drafts/route.ts`

- [ ] **Step 1: Create the drafts API route**

```typescript
// app/api/drafts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-keys'
import { validateDraftPayload } from '@/lib/drafts'
import { createServiceClient } from '@/lib/supabase/service'
import type { SiteConceptPayload } from '@/lib/draft-types'

export async function POST(request: NextRequest) {
  // 1. Extract Bearer token
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Missing or invalid Authorization header' },
      { status: 401 }
    )
  }

  const token = authHeader.replace('Bearer ', '')

  // 2. Validate API key
  const { valid, keyRecord } = await validateApiKey(token)
  if (!valid || !keyRecord) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Invalid or revoked API key' },
      { status: 401 }
    )
  }

  // 3. Parse request body
  let payload: SiteConceptPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Request body must be valid JSON' },
      { status: 400 }
    )
  }

  // 4. Validate payload
  const { valid: payloadValid, errors } = validateDraftPayload(payload)
  if (!payloadValid) {
    return NextResponse.json(
      { error: 'validation_error', message: errors[0], details: errors },
      { status: 400 }
    )
  }

  // 5. Store draft
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('site_drafts')
    .insert({
      client_api_key_id: keyRecord.id,
      client_name: keyRecord.client_name,
      contact_email: payload.contact_email,
      contact_name: payload.contact_name || null,
      type: payload.type,
      network_name: payload.network_name || null,
      sites: payload.sites,
      notes: payload.notes || null,
      status: 'pending',
    })
    .select('id, status, type')
    .single()

  if (error) {
    console.error('Failed to store draft:', error)
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to store draft' },
      { status: 500 }
    )
  }

  // 6. Return success
  return NextResponse.json(
    {
      draft_id: data.id,
      status: data.status,
      type: data.type,
      site_count: payload.sites.length,
      message: 'Draft submitted successfully. It will be reviewed shortly.',
    },
    { status: 201 }
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Test manually with curl**

After deploying or running `npm run dev`, test with:

```bash
curl -X POST http://localhost:3002/api/drafts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dc_live_test_key" \
  -d '{"type":"single","sites":[{"role":"main","niche":"test","brand_voice":"test"}],"contact_email":"test@test.com"}'
```

Expected: 401 (no valid key yet). This confirms the route is working.

- [ ] **Step 4: Commit**

```bash
git add app/api/drafts/route.ts
git commit -m "feat: add POST /api/drafts endpoint with validation and API key auth"
```

---

### Task 5: Admin API Keys Page

**Files:**
- Create: `app/admin/api-keys/page.tsx`
- Create: `app/admin/api-keys/ApiKeyManager.tsx`

- [ ] **Step 1: Create the server page component**

```typescript
// app/admin/api-keys/page.tsx
import { createServiceClient } from '@/lib/supabase/service'
import ApiKeyManager from './ApiKeyManager'
import type { ClientApiKey } from '@/lib/draft-types'

export default async function ApiKeysPage() {
  const supabase = createServiceClient()
  const { data: keys } = await supabase
    .from('client_api_keys')
    .select('id, client_name, contact_email, key_prefix, created_at, revoked_at')
    .order('created_at', { ascending: false })

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        API Keys
      </h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
        Generate and manage API keys for client onboarding agents.
      </p>
      <ApiKeyManager initialKeys={(keys || []) as ClientApiKey[]} />
    </main>
  )
}
```

- [ ] **Step 2: Create the client component**

Create `app/admin/api-keys/ApiKeyManager.tsx` — a client component that handles:
- Displaying the keys table (Client Name, Email, Key Prefix, Status, Created, Actions)
- "Generate Key" button that opens an inline form (client name + email)
- On submit: POST to a new `/api/admin/api-keys` route (create this as part of this step)
- Shows the full key ONCE in a copyable box with a warning
- "Revoke" button per row with confirmation
- Status badges: green "Active" / red "Revoked"

This is a client component ('use client') with state for the form, the generated key display, and the keys list.

- [ ] **Step 3: Create the admin API keys route**

Create `app/api/admin/api-keys/route.ts`:

```typescript
// app/api/admin/api-keys/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createApiKeyRecord, revokeApiKey } from '@/lib/api-keys'

// POST — generate a new key
export async function POST(request: NextRequest) {
  // Simple auth: check for PROVISION_SECRET (same as other admin endpoints)
  const secret = request.headers.get('x-provision-secret')
  if (secret !== process.env.PROVISION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { client_name, contact_email } = await request.json()

  if (!client_name || !contact_email) {
    return NextResponse.json(
      { error: 'client_name and contact_email are required' },
      { status: 400 }
    )
  }

  try {
    const { key, id } = await createApiKeyRecord(client_name, contact_email)
    return NextResponse.json({ id, key }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE — revoke a key
export async function DELETE(request: NextRequest) {
  const secret = request.headers.get('x-provision-secret')
  if (secret !== process.env.PROVISION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key_id } = await request.json()

  if (!key_id) {
    return NextResponse.json({ error: 'key_id is required' }, { status: 400 })
  }

  try {
    await revokeApiKey(key_id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/admin/api-keys/ app/api/admin/api-keys/
git commit -m "feat: add admin API key management page with generate and revoke"
```

---

### Task 6: Admin Drafts Page

**Files:**
- Create: `app/admin/drafts/page.tsx`
- Create: `app/admin/drafts/DraftReview.tsx`

- [ ] **Step 1: Create the server page component**

```typescript
// app/admin/drafts/page.tsx
import { createServiceClient } from '@/lib/supabase/service'
import DraftReview from './DraftReview'
import type { DraftRecord } from '@/lib/draft-types'

export default async function DraftsPage() {
  const supabase = createServiceClient()
  const { data: drafts } = await supabase
    .from('site_drafts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Site Drafts
      </h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
        Review submitted site concepts, select domains, and provision.
      </p>
      <DraftReview initialDrafts={(drafts || []) as DraftRecord[]} />
    </main>
  )
}
```

- [ ] **Step 2: Create the DraftReview client component**

Create `app/admin/drafts/DraftReview.tsx` — a large client component that handles:

**Draft list table:**
- Columns: Client, Type (badge), Sites (count), Niche(s), Status (colored badge), Submitted, Actions
- Status badges: pending=yellow, reviewed=blue, provisioning=orange, provisioned=green, rejected=red
- Click a row to expand detail view

**Expanded detail view (for a selected draft):**
- For each site in the draft's `sites` array:
  - Niche, placeholder name, role
  - Brand voice + tone
  - ICA profile: persona, pain points, goals (if provided)
  - Style guide: color swatches (render actual color boxes from hex), fonts, mood
  - Affiliate products list
  - Content types, keywords, languages
  - Author name + bio

**Domain selection section:**
- For each site: username input (auto-suggest from niche slug) + domain input
- Purchase domain toggle (checkbox)
- Save domain selections → PATCH to `/api/admin/drafts` (update `domain_selections` field)

**Action buttons:**
- **Save Domains** — updates `domain_selections` jsonb, sets status to "reviewed"
- **Provision** — calls `/api/provision` (single) or `/api/admin/provision-network` (network) with mapped payload data. Read `lib/drafts.ts` for the mapping logic (create a `mapDraftToProvisionPayload` function there). Updates status to "provisioning" → "provisioned" on success. Stores results in `provision_results`.
- **Reject** — text input for admin notes, sets status to "rejected"

- [ ] **Step 3: Create the admin drafts API route**

Create `app/api/admin/drafts/route.ts` for PATCH (update draft) and POST (provision from draft):

```typescript
// app/api/admin/drafts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// PATCH — update draft (domain selections, status, admin notes)
export async function PATCH(request: NextRequest) {
  const secret = request.headers.get('x-provision-secret')
  if (secret !== process.env.PROVISION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { draft_id, domain_selections, status, admin_notes } = await request.json()

  if (!draft_id) {
    return NextResponse.json({ error: 'draft_id is required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (domain_selections !== undefined) updates.domain_selections = domain_selections
  if (status !== undefined) updates.status = status
  if (admin_notes !== undefined) updates.admin_notes = admin_notes

  const { data, error } = await supabase
    .from('site_drafts')
    .update(updates)
    .eq('id', draft_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

- [ ] **Step 4: Add mapDraftToProvisionPayload to lib/drafts.ts**

Add a function to `lib/drafts.ts` that converts a draft record + domain selections into the payload format expected by `POST /api/provision` (single site) or `POST /api/admin/provision-network` (network):

```typescript
// Add to lib/drafts.ts
import type { DraftRecord, DomainSelection, SiteConcept } from './draft-types'

export function mapDraftToProvisionPayload(draft: DraftRecord) {
  if (draft.type === 'single') {
    return mapSingleSite(draft.sites[0], draft.domain_selections?.[0], draft.contact_email)
  } else {
    return mapNetwork(draft)
  }
}

function mapSingleSite(site: SiteConcept, domain?: DomainSelection, contactEmail?: string) {
  return {
    username: domain?.username || slugify(site.niche),
    display_name: site.placeholder_name || site.niche,
    niche: site.niche,
    brand_voice: site.brand_voice,
    tone: site.tone,
    target_market: site.ica_profile ? formatICA(site.ica_profile) : '',
    primary_color: site.style_guide?.primary_color || '#1a1a1a',
    accent_color: site.style_guide?.accent_color || '#8b7355',
    heading_font: site.style_guide?.heading_font,
    body_font: site.style_guide?.body_font,
    author_name: site.author_name || 'Editorial Team',
    author_bio: site.author_bio || '',
    contact_email: contactEmail || '',
    domain: domain?.domain,
    purchase_domain: domain?.purchase_domain || false,
    domain_yearly_price: domain?.domain_yearly_price,
    seed_keywords: site.seed_keywords || [],
    approved_products: (site.affiliate_products || []).map(p => ({
      name: p.name,
      category: p.category,
      product_url: p.url,
      product_type: p.product_type,
    })),
    content_types: site.content_types,
    articles_per_day: site.articles_per_day || 3,
    languages: site.languages || [],
  }
}

function mapNetwork(draft: DraftRecord) {
  const members = draft.sites.map((site, i) => {
    const domainSel = draft.domain_selections?.find(d => d.site_index === i)
    return {
      ...mapSingleSite(site, domainSel, draft.contact_email),
      role: site.role === 'hub' ? 'seed' : 'satellite',
    }
  })

  return {
    network_name: draft.network_name || 'Site Network',
    members,
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function formatICA(ica: NonNullable<SiteConcept['ica_profile']>): string {
  const parts = []
  if (ica.persona_name) parts.push(ica.persona_name)
  if (ica.age_range) parts.push(`Age: ${ica.age_range}`)
  if (ica.pain_points?.length) parts.push(`Pain points: ${ica.pain_points.join(', ')}`)
  if (ica.goals?.length) parts.push(`Goals: ${ica.goals.join(', ')}`)
  return parts.join('. ')
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add app/admin/drafts/ app/api/admin/drafts/ lib/drafts.ts
git commit -m "feat: add admin drafts review page with domain selection and provisioning"
```

---

### Task 7: MCP Server Repository

**Files (in a NEW directory — NOT inside the blog cloner repo):**
- Create: `doubleclicker-onboard/package.json`
- Create: `doubleclicker-onboard/tsconfig.json`
- Create: `doubleclicker-onboard/src/index.ts`
- Create: `doubleclicker-onboard/.env.example`
- Create: `doubleclicker-onboard/README.md`
- Create: `doubleclicker-onboard/.gitignore`

Create this as a sibling directory to the blog cloner repo, e.g. at `/Users/stuarta/doubleclicker-onboard/`.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "doubleclicker-onboard",
  "version": "1.0.0",
  "description": "MCP server for submitting blog site concepts to Doubleclicker",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.11.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src"]
}
```

Note: `@modelcontextprotocol/sdk` is ESM-only. Also add `"type": "module"` to `package.json`.

- [ ] **Step 3: Create the MCP server**

Create `src/index.ts` — the MCP server with one tool. This is the core file. It should:
- Read `DOUBLECLICKER_API_KEY` and `DOUBLECLICKER_API_URL` from environment
- Define a `submit_site_concept` tool with the full JSON schema matching `SiteConceptPayload`
- The tool description must contain the conversational guidance prompt from the spec (Section 5) — this is what teaches the AI how to collect the information from the client
- On tool call: POST to `${DOUBLECLICKER_API_URL}/api/drafts` with Bearer auth
- Return the API response (draft_id, status, message) or error details

Use `@modelcontextprotocol/sdk` for the server implementation with stdio transport.

- [ ] **Step 4: Create .env.example**

```
DOUBLECLICKER_API_KEY=dc_live_your_key_here
DOUBLECLICKER_API_URL=https://doubledoubleclickclick.fly.dev
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
.env
```

- [ ] **Step 6: Create README.md**

Write setup instructions:
1. Clone the repo
2. `npm install && npm run build`
3. Copy `.env.example` to `.env`, add your API key
4. Add to Claude Code settings:
```json
{
  "mcpServers": {
    "doubleclicker": {
      "command": "node",
      "args": ["/path/to/doubleclicker-onboard/dist/index.js"],
      "env": {
        "DOUBLECLICKER_API_KEY": "dc_live_your_key_here",
        "DOUBLECLICKER_API_URL": "https://doubledoubleclickclick.fly.dev"
      }
    }
  }
}
```
5. Start a conversation: "I want to set up a new blog site"
6. The AI will guide you through defining your site concept

- [ ] **Step 7: Install, build, verify**

```bash
cd /Users/stuarta/doubleclicker-onboard
npm install
npm run build
```

- [ ] **Step 8: Commit (separate repo)**

```bash
git init
git add -A
git commit -m "feat: initial MCP server for agent-driven site onboarding"
```

---

### Task 8: End-to-End Test + Deploy

**Files:**
- No new files — testing and deployment

- [ ] **Step 1: Deploy blog cloner updates to Fly**

```bash
cd /Users/stuarta/Documents/GitHub/doubleclicker-1
git push origin main
fly deploy -a doubledoubleclickclick
```

- [ ] **Step 2: Create the Supabase tables**

If not done in Task 2, run the CREATE TABLE SQL against your Supabase project now.

- [ ] **Step 3: Generate a test API key**

Navigate to `https://doubledoubleclickclick.fly.dev/admin/api-keys`, generate a test key. Save the key.

- [ ] **Step 4: Test the API endpoint with curl**

```bash
curl -X POST https://doubledoubleclickclick.fly.dev/api/drafts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dc_live_YOUR_TEST_KEY" \
  -d '{
    "type": "single",
    "sites": [{
      "role": "main",
      "niche": "longevity science",
      "brand_voice": "Authoritative yet approachable",
      "placeholder_name": "The Longevity Post"
    }],
    "contact_email": "test@example.com"
  }'
```

Expected: 201 with draft_id.

- [ ] **Step 5: Verify draft appears in admin**

Navigate to `https://doubledoubleclickclick.fly.dev/admin/drafts`. The test draft should appear with status "pending".

- [ ] **Step 6: Test the MCP server**

Configure the MCP server in Claude Code with the test API key. Start a conversation: "I want to set up a new blog site about longevity." The AI should guide you through the questions and call `submit_site_concept` at the end.

- [ ] **Step 7: Clean up test data**

Delete the test draft from Supabase. Revoke the test API key if not needed.
