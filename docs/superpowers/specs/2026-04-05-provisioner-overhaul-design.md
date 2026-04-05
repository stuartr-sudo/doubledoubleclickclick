# Provisioner Overhaul — Incremental Cleanup

**Date:** 2026-04-05
**Approach:** Incremental cleanup of existing architecture (Approach A)
**Scope:** Security fixes, UI decomposition, pipeline standardization, dead code removal, brand quality improvements

## Context

The provisioning system orchestrates creating new tenant blog sites: seeding 8 DB tables, triggering Doubleclicker auto-onboard, deploying to Fly.io, purchasing domains, configuring DNS, and setting up Google services (GA4, GTM, GSC). The admin UI (`ProvisionForm.tsx`) is a 2,378-line monolith with 125+ state variables across 3 provisioning modes.

The PDF upload mode has been superseded by an MCP-based client submission system (`doubleclicker-onboard`) that feeds structured drafts into `/admin/drafts` for review. The admin wizard (niche-first and product-first modes) remains the primary tool for admin-initiated provisioning.

## 1. Security & Critical Fixes

### 1a. Provision Secret Endpoint

**File:** `app/api/admin/provision-secret/route.ts`

**Problem:** Returns `PROVISION_SECRET` to any caller with no authentication. Any user who discovers this endpoint can obtain the secret used to authorize provisioning.

**Fix:** Add `x-provision-secret` header validation, matching the pattern used by other admin endpoints (`/api/admin/drafts`, `/api/admin/api-keys`).

```typescript
export async function GET(request: NextRequest) {
  const secret = process.env.PROVISION_SECRET
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const authHeader = request.headers.get('x-provision-secret')
  if (authHeader !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ secret })
}
```

**Impact:** The ProvisionForm frontend already stores the provision secret in state (fetched on mount). The form must send the secret as a header when fetching it. This creates a chicken-and-egg problem — the form needs the secret to authenticate, but needs to authenticate to get the secret.

**Resolution:** The provision-secret endpoint should be removed entirely. The ProvisionForm should accept the provision secret as manual input (a text field), or read it from a cookie/session set during admin login. The simplest fix: add a password field to the provision page where the admin enters the secret manually. This avoids exposing it via API at all.

### 1b. Idempotency Guard

**File:** `app/api/provision/route.ts` (before Phase 2)

**Problem:** Calling `POST /api/provision` twice with the same username triggers duplicate auto-onboard calls, creating parallel content pipelines.

**Fix:** Before Phase 2, query `pipeline_runs` for the username with `status IN ('running', 'pending')`. If found, skip auto-onboard.

```typescript
// Before Phase 2
const { data: runningPipeline } = await supabase
  .from('pipeline_runs')
  .select('id, status')
  .eq('username', username)
  .in('status', ['running', 'pending'])
  .limit(1)
  .single()

if (runningPipeline && !body.force_reprovision) {
  notifications.doubleclicker = {
    status: 'skipped',
    reason: 'Pipeline already running',
    existing_run_id: runningPipeline.id
  }
} else {
  // Call auto-onboard as normal
}
```

Add `force_reprovision: boolean` parameter to the provision payload for explicit re-provisioning.

### 1c. Hardcoded Domain Email

**File:** `app/api/provision/route.ts` (line 768)

**Problem:** Domain registration uses hardcoded `'stuartr@sewo.io'`.

**Fix:** Move to `DOMAIN_ADMIN_EMAIL` environment variable with fallback:

```typescript
const domainAdminEmail = process.env.DOMAIN_ADMIN_EMAIL || 'stuartr@sewo.io'
```

Add to `.env.local.example` with description.

## 2. Remove PDF Upload Mode

**Problem:** The `upload` mode in ProvisionForm is dead code — replaced by the MCP client submission system.

### Files to remove:
- `app/api/admin/parse-brand-guide/route.ts` — PDF parsing endpoint with in-memory job store
- All `mode === 'upload'` branches in ProvisionForm
- PDF parsing utilities and dependencies (if any exist as separate files)

### Files to modify:
- `ProvisionForm.tsx` (becomes `ProvisionWizard.tsx` — see Section 3) — remove upload mode, simplify mode selector to 2 options:
  - "I have a website" → product-first mode
  - "I have a niche idea" → niche-first mode

### What to keep:
- The `populateFromParsedSite()` function signature pattern — the DraftReview component maps draft data to a similar shape for the provision payload. The function itself moves to the provision context.

## 3. Break Up ProvisionForm.tsx

### New structure:

```
components/provision/
├── ProvisionWizard.tsx          # Shell: mode selector, step navigation, provision context provider
├── ProvisionContext.tsx          # React context + reducer for all provision state
├── steps/
│   ├── NicheStep.tsx            # Niche input + deep-niche-research trigger
│   ├── BrandUrlStep.tsx         # Website URL input + auto-brand extraction
│   ├── DomainStep.tsx           # Domain search, selection, purchase toggle, manual DNS
│   ├── VoiceContentStep.tsx     # Brand voice, target market, blurb, seed keywords
│   ├── ImageStyleStep.tsx       # Visual style, mood, composition, lighting, logo generation
│   ├── AuthorStep.tsx           # Author name, bio, image, social URLs
│   ├── DeployConfigStep.tsx     # Theme, colors, fonts, region, stitch toggle, Google services toggles
│   └── LaunchStep.tsx           # Summary review, provision button, pipeline tracking
├── PipelineTracker.tsx          # Phase-by-phase status display with live polling
└── hooks/
    └── useProvision.ts          # Provision API call + response handling + polling
```

### ProvisionContext

Replaces 125+ `useState` calls with a single context + reducer:

```typescript
type ProvisionState = {
  // Mode
  mode: 'niche' | 'brand'
  activeStep: number

  // Brand identity
  niche: string
  displayName: string
  username: string
  domain: string
  websiteUrl: string
  contactEmail: string
  tagline: string

  // Brand voice
  brandVoice: string
  targetMarket: string
  brandBlurb: string
  seedKeywords: string

  // Author
  authorName: string
  authorBio: string
  authorImageUrl: string
  authorPageUrl: string
  authorSocials: Record<string, string>

  // Visual
  logoUrl: string
  imageStyle: ImageStyleConfig
  primaryColor: string
  secondaryColor: string
  accentColor: string
  headingFont: string
  bodyFont: string
  theme: 'editorial' | 'boutique' | 'modern'

  // Deploy config
  flyRegion: string
  stitchEnabled: boolean
  setupGoogleAnalytics: boolean
  setupGoogleTagManager: boolean
  setupSearchConsole: boolean
  translationEnabled: boolean
  selectedLanguages: string[]
  articlesPerDay: number

  // Domain purchase
  purchaseDomain: boolean
  selectedDomainData: DomainData | null
  manualDns: boolean

  // Research context (from niche research or brand extraction)
  researchContext: ResearchContext | null
  icaProfile: ICAProfile | null
  styleGuide: StyleGuide | null

  // Products
  products: ProductEntry[]

  // Network
  networkPartners: NetworkPartner[]

  // UI state
  phase: 'form' | 'provisioning' | 'tracking' | 'done'
  provisionResult: ProvisionResult | null
  pipelineStatus: PipelineStatus | null
  logs: LogEntry[]
  error: string | null
  generating: Record<string, boolean>
}
```

### Step navigation

The wizard shell defines step order per mode:

```typescript
const NICHE_STEPS = ['niche', 'domain', 'voice', 'imageStyle', 'author', 'deploy', 'launch']
const BRAND_STEPS = ['brandUrl', 'domain', 'voice', 'imageStyle', 'author', 'deploy', 'launch']
```

Steps don't know about each other. Each step reads from and writes to the provision context. Navigation (next/back) is handled by the wizard shell.

### Target file sizes

Each component targets 150-300 lines. The context/reducer file may be ~200 lines. Total code volume stays similar, but each file is focused and independently understandable.

## 4. Pipeline Error Handling Standardization

### Phase categorization

| Category | Phases | Retry | On failure |
|----------|--------|-------|------------|
| **Critical** | 1 (DB seed), 4 (Fly deploy) | 2 attempts, 2s delay | Warning with `severity: 'critical'` |
| **Important** | 2 (auto-onboard), 3 (Google services) | 1 attempt | Warning with `severity: 'important'` |
| **Optional** | 5-9 (domain, certs, DNS, email) | None | Warning with `severity: 'optional'` |
| **Best-effort** | 10 (analytics), 1.1 (hero image) | None | Silent (no warning) |

### Consistent notification format

Every phase returns the same shape:

```typescript
type PhaseResult = {
  phase: string           // 'db_seed', 'auto_onboard', 'fly_deploy', etc.
  status: 'success' | 'warning' | 'error' | 'skipped'
  severity: 'critical' | 'important' | 'optional' | 'silent'
  message?: string        // Human-readable description
  data?: Record<string, unknown>  // Phase-specific data (IDs, URLs, etc.)
  duration_ms: number     // How long this phase took
}
```

The response includes `phase_results: PhaseResult[]` alongside the existing `notifications` object (for backwards compatibility with DraftReview and any external consumers).

### Phase runner helper

```typescript
async function runPhase(
  name: string,
  severity: PhaseResult['severity'],
  retries: number,
  fn: () => Promise<Record<string, unknown>>
): Promise<PhaseResult> {
  const start = Date.now()
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fn()
      return { phase: name, status: 'success', severity, data, duration_ms: Date.now() - start }
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 2000))
        continue
      }
      const status = severity === 'silent' ? 'success' : (severity === 'critical' ? 'error' : 'warning')
      return { phase: name, status, severity, message: err.message, duration_ms: Date.now() - start }
    }
  }
}
```

## 5. Dead Code & Theme Cleanup

### Remove

| Item | Location | Reason |
|------|----------|--------|
| `font_sizes` handling | provision/route.ts | Stored in brand_specifications but never read by frontend |
| `saveBrandProfile()` | ProvisionForm.tsx | Saves to localStorage, never read back |
| `handleProvisionNetwork()` | ProvisionForm.tsx | Network provisioning lives at `/admin/network` |
| PDF upload mode | ProvisionForm.tsx + parse-brand-guide endpoint | Replaced by MCP (Section 2) |

### Fix: Tagline support across all themes

Add `tagline` to the provision payload and render in all 3 theme headers:

- **Editorial:** Below the brand name in the masthead, italicized, with a thin separator
- **Boutique:** Below the brand name, smaller text, using accent color
- **Modern:** Next to the brand name in the top nav, muted text

All implementations gracefully hide when tagline is empty/null (no blank space, no separator).

### Fix: ThemeRenderer warning

Add `console.warn` when an invalid theme name falls back to editorial:

```typescript
if (!HEADERS[theme]) {
  console.warn(`[ThemeRenderer] Unknown theme "${theme}", falling back to editorial`)
}
```

### Fix: Footer and CookieConsent theming

Update Footer and CookieConsent components to use CSS variables:
- `var(--color-footer-bg)` instead of hardcoded `#1a1a1a`
- `var(--color-footer-text)` instead of hardcoded `#ffffff`
- `var(--font-body)` for text
- `var(--border-radius)` for cookie consent button

## 6. Brand Data Quality Improvements

### 6a. Research context pass-through

**Problem:** Niche research generates structured `research_context` (content pillars, keyword themes, unique angles), stored in `app_settings` as `onboard_config:{username}`. But the topical map generator in Doubleclicker doesn't fully consume it.

**Fix (doubleclicker-1 side):** Ensure `research_context` is passed as structured JSON in the `onboard_config` app_settings value. Currently done correctly — no change needed here.

**Fix (doubleclicker side):** In `auto-onboard.js`, pass `research_context` through to the `launch` payload so it reaches `discover_keywords` and `build_topical_map` steps. This is a Doubleclicker repo change, documented here for completeness.

### 6b. Niche-aware defaults

When niche is set in niche-first mode:
- Auto-call `suggestNicheColors()` (currently requires button click)
- Set `border_radius` based on theme: editorial → `0px`, boutique → `16px`, modern → `8px`
- These become defaults that the user can override in the deploy config step

### 6c. Tagline in provision payload

Add `tagline` to the provision payload. Store in `brand_guidelines.tagline` (column may need adding via migration). Pass through to the deployed site's brand data fetch.

## Summary of Changes

| Area | Files Modified | Files Added | Files Removed |
|------|---------------|-------------|---------------|
| Security | provision-secret/route.ts, provision/route.ts | — | provision-secret/route.ts (replaced with manual input) |
| PDF removal | ProvisionForm.tsx | — | parse-brand-guide/route.ts |
| UI decomposition | ProvisionForm.tsx → split | 11 new files in components/provision/ | ProvisionForm.tsx (replaced) |
| Pipeline | provision/route.ts | — | — |
| Dead code | provision/route.ts, ProvisionForm.tsx | — | — |
| Themes | ThemeRenderer.tsx, all 3 theme Headers, Footer, CookieConsent, BrandStyles.tsx | — | — |
| Brand quality | provision/route.ts, DeployConfigStep.tsx | — | — |

## Out of Scope

- Unified draft-first architecture (deferred — Approach B for future)
- Database schema changes for column naming consistency (user_name vs username)
- Partial re-deploy capability (skip individual phases)
- Stitch queue idempotency
- Network partners URL validation
