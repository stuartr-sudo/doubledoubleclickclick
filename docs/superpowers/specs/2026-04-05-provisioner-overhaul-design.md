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

**Fix:** Delete `app/api/admin/provision-secret/route.ts` entirely. Replace with a manual secret input in the admin UI.

**Changes required:**

1. **Delete** `app/api/admin/provision-secret/route.ts`
2. **ProvisionWizard** (new shell component): Add a password input field at the top of the wizard where the admin pastes the provision secret. Store in React state only (not persisted to localStorage or cookies). The secret is used as the `Authorization: Bearer {secret}` header when calling `POST /api/provision`.
3. **Remove** the `fetchProvisionSecret()` call that currently runs on ProvisionForm mount.
4. **DraftReview.tsx**: Already accepts the provision secret as a prop passed from the drafts page (fetched via `x-provision-secret` header pattern). No change needed here — DraftReview uses the secret from the admin page's own fetch, which is already auth-gated.

### 1b. Idempotency Guard

**File:** `app/api/provision/route.ts` (before Phase 2)

**Problem:** Calling `POST /api/provision` twice with the same username triggers duplicate auto-onboard calls, creating parallel content pipelines.

**Fix:** Before Phase 2, check if this username already has brand data seeded (indicating a previous provision). The `pipeline_runs` table lives in the shared Supabase DB (created by Doubleclicker) and tracks auto-onboard pipeline state. However, since its schema may change independently, we use a simpler check: query `integration_credentials` for an existing row with this `user_name`. If found and `force_reprovision` is not set, skip auto-onboard.

```typescript
// Before Phase 2: idempotency check
const { data: existingCreds } = await supabase
  .from('integration_credentials')
  .select('id')
  .eq('user_name', username)
  .limit(1)
  .maybeSingle()

if (existingCreds && !body.force_reprovision) {
  // Brand already provisioned — skip auto-onboard to prevent duplicate pipelines
  notifications.doubleclicker = {
    status: 'skipped',
    reason: 'Brand already provisioned. Use force_reprovision=true to override.'
  }
} else {
  // Call auto-onboard as normal
}
```

Add `force_reprovision: boolean` parameter to the provision payload for explicit re-provisioning. When true, auto-onboard is called regardless of existing data (useful for re-seeding brand config).

### 1c. Hardcoded Domain Email

**File:** `app/api/provision/route.ts` (in the domain registration call)

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
  products: ProductEntry[]  // name, url, isAffiliate, affiliateLink, commission info

  // Content config
  skipPipeline: boolean
  preferredElements: string
  prohibitedElements: string
  aiInstructionsOverride: string

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

Phases are identified by name (not number) to match the actual code structure:

| Category | Phase ID | Description | Retry | On failure |
|----------|----------|-------------|-------|------------|
| **Critical** | `db_seed` | Seed 8 tables + app_settings | 2 attempts, 2s delay | `severity: 'critical'` |
| **Critical** | `fly_deploy` | Create app, set secrets, allocate IPs, create machine | 2 attempts, 2s delay | `severity: 'critical'` |
| **Important** | `auto_onboard` | Trigger Doubleclicker pipeline | 1 attempt | `severity: 'important'` |
| **Important** | `google_services` | Create GA4 property + GTM container | 1 attempt | `severity: 'important'` |
| **Optional** | `domain_purchase` | Register domain via Cloud Domains | None | `severity: 'optional'` |
| **Optional** | `tls_certs` | Request TLS certs for www + apex | None | `severity: 'optional'` |
| **Optional** | `search_console` | Add site to Google Search Console | None | `severity: 'optional'` |
| **Optional** | `dns_config` | Auto-configure DNS records | None | `severity: 'optional'` |
| **Optional** | `email_notify` | Email DNS records to admin | None | `severity: 'optional'` |
| **Silent** | `hero_image` | Generate hero banner via fal.ai | None | No warning |
| **Silent** | `analytics_log` | Log provisioning event | None | No warning |

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
  throw new Error('unreachable')  // satisfies TypeScript control flow
}
```

## 5. Dead Code & Theme Cleanup

### Remove

| Item | Location | Reason |
|------|----------|--------|
| `font_sizes` handling | provision/route.ts | Stored in brand_specifications but never read by frontend |
| `saveBrandProfile()` | ProvisionForm.tsx | Saves to localStorage, never read back |
| PDF upload mode | ProvisionForm.tsx + parse-brand-guide endpoint + lib/parse-brand-guide.ts (if exists) | Replaced by MCP (Section 2) |

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

Update CookieConsent component to use CSS variables (Footer already uses `var(--color-footer-bg)` correctly):
- CookieConsent: replace hardcoded `#ffffff` and other color values with `var(--color-bg)`, `var(--color-text)`, `var(--color-accent)`
- CookieConsent buttons: use `var(--border-radius)` for rounded corners
- CookieConsent text: use `var(--font-body)` for font family

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

**DB migration required:**

```sql
ALTER TABLE brand_guidelines ADD COLUMN IF NOT EXISTS tagline TEXT;
```

**Provision endpoint change:** Add `tagline` to the `guidelinesPayload` in the `db_seed` phase:

```typescript
const guidelinesPayload = {
  // ...existing fields
  tagline: body.tagline || null,
}
```

**Read-side data flow:** Update `lib/brand.ts` to include `tagline` in the brand_guidelines SELECT:

```typescript
// In getBrandData()
const { data: guidelinesData } = await supabase
  .from('brand_guidelines')
  .select('*, tagline, brand_specifications(*)')  // add tagline
  .eq('user_name', username)
  .single()
```

**Theme rendering:** The editorial and boutique Headers already accept `tagline` via `HeaderProps`. The boutique Header has tagline rendering disabled with `{false &&` — re-enable it. The modern Header needs the `tagline` prop added to its component signature. All three themes render tagline conditionally (hidden when null/empty).

## Summary of Changes

| Area | Files Modified | Files Added | Files Removed |
|------|---------------|-------------|---------------|
| Security | provision-secret/route.ts, provision/route.ts | — | provision-secret/route.ts (replaced with manual input) |
| PDF removal | ProvisionForm.tsx | — | parse-brand-guide/route.ts |
| UI decomposition | ProvisionForm.tsx → split | 12 new files in components/provision/ | ProvisionForm.tsx (replaced) |
| Pipeline | provision/route.ts | — | — |
| Dead code | provision/route.ts, ProvisionForm.tsx | — | — |
| Themes | ThemeRenderer.tsx, all 3 theme Headers, Footer, CookieConsent, BrandStyles.tsx | — | — |
| Brand quality | provision/route.ts, DeployConfigStep.tsx | — | — |

## Cross-Repo Dependencies

These changes are required in the **Doubleclicker** repo (`/Users/stuarta/doubleclicker`) but are documented here for tracking:

| Change | File | Description |
|--------|------|-------------|
| Research context pass-through | `api/strategy/auto-onboard.js` | Pass `research_context` from `onboard_config` through to the `launch` payload's `discover_keywords` and `build_topical_map` steps |

These should be implemented after the doubleclicker-1 changes are complete, since the data flow originates here.

## Out of Scope

- Unified draft-first architecture (deferred — Approach B for future)
- Database schema changes for column naming consistency (user_name vs username)
- Partial re-deploy capability (skip individual phases)
- Stitch queue idempotency
- Network partners URL validation
