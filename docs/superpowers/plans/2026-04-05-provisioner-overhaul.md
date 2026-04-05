# Provisioner Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the provisioning system — fix security holes, decompose the 2,378-line monolith form, standardize pipeline error handling, remove dead code, and improve brand data quality.

**Architecture:** Incremental cleanup. The admin wizard splits from one file into 12 focused components sharing state via React Context. The provision backend gets standardized error handling via a `runPhase()` helper. Dead code (PDF upload mode, unused fields) is removed. Theme headers gain tagline support.

**Tech Stack:** Next.js 14, React Context + useReducer, Supabase, Fly.io API, Google Cloud APIs

**Note:** No test suite is configured for this project. Verification is via `npm run build` (catches type errors) and `npm run dev` (manual smoke testing). Each task includes specific build/lint verification steps.

**Spec:** `docs/superpowers/specs/2026-04-05-provisioner-overhaul-design.md`

---

## File Structure

### New files (12):
```
components/provision/
├── ProvisionWizard.tsx          # ~200 lines — Shell: mode selector, step nav, context provider, secret input
├── ProvisionContext.tsx          # ~250 lines — React context, reducer, types, initial state
├── steps/
│   ├── NicheStep.tsx            # ~150 lines — Niche input + AI research trigger
│   ├── BrandUrlStep.tsx         # ~150 lines — Website URL + auto-brand extraction
│   ├── DomainStep.tsx           # ~250 lines — Domain search, selection, purchase, manual DNS
│   ├── VoiceContentStep.tsx     # ~200 lines — Brand voice, target market, blurb, keywords
│   ├── ImageStyleStep.tsx       # ~200 lines — Visual style, mood, composition, logo gen
│   ├── AuthorStep.tsx           # ~150 lines — Author name, bio, image, socials
│   ├── DeployConfigStep.tsx     # ~250 lines — Theme, colors, fonts, region, toggles
│   └── LaunchStep.tsx           # ~200 lines — Summary, provision button, tracking
├── PipelineTracker.tsx          # ~150 lines — Phase status display
└── hooks/
    └── useProvision.ts          # ~100 lines — Provision API + polling
```

### Modified files:
```
app/api/provision/route.ts       # Idempotency guard, hardcoded email fix, runPhase helper, tagline
app/admin/provision/page.tsx     # Import ProvisionWizard instead of ProvisionForm
lib/brand.ts                     # Add tagline to SELECT, remove font_sizes dead code
components/themes/ThemeRenderer.tsx  # Add console.warn for unknown themes
components/themes/editorial/Header.tsx  # Already has tagline — no change needed
components/themes/boutique/Header.tsx   # Re-enable tagline (remove {false &&)
components/themes/modern/Header.tsx     # Add tagline prop + rendering
components/CookieConsent.tsx            # Replace hardcoded colors with CSS variables
```

### Deleted files:
```
app/api/admin/provision-secret/route.ts  # Security: removes unauthenticated secret endpoint
app/api/admin/parse-brand-guide/route.ts # Dead code: PDF upload replaced by MCP
lib/parse-brand-guide.ts                 # Dead code: PDF parsing utility
components/ProvisionForm.tsx             # Replaced by components/provision/*
```

---

## Task 1: Security Fixes

**Files:**
- Delete: `app/api/admin/provision-secret/route.ts`
- Modify: `app/api/provision/route.ts`

- [ ] **Step 1: Delete the provision-secret endpoint and fix all consumers**

Delete `app/api/admin/provision-secret/route.ts`. This endpoint returns `PROVISION_SECRET` with zero authentication.

**Three files consume this endpoint and must be updated:**

1. `components/ProvisionForm.tsx` — fetches secret on mount. This will be handled when the component is replaced by ProvisionWizard (Task 6). For now, remove the fetch call and hardcode an empty string (the file is deleted in Task 6 anyway).

2. `components/DraftReview.tsx` — calls `fetch('/api/admin/provision-secret')` on mount (around line 234). Add a password input to the DraftReview component where the admin enters the provision secret. Store in local state. Remove the `fetchProvisionSecret` fetch call.

3. `components/ApiKeyManager.tsx` — calls the same endpoint via a `getSecret()` helper (around line 19). Add a password input for the provision secret. Store in local state. Remove the `getSecret` fetch call.

- [ ] **Step 2: Add idempotency guard to provision route**

In `app/api/provision/route.ts`, before the auto-onboard call (the section that calls `DOUBLECLICKER_API_URL/api/strategy/auto-onboard`), add:

```typescript
// Idempotency: skip auto-onboard if brand already provisioned
const { data: existingCreds } = await supabase
  .from('integration_credentials')
  .select('id')
  .eq('user_name', username)
  .limit(1)
  .maybeSingle()

if (existingCreds && !force_reprovision) {
  notifications.doubleclicker = {
    status: 'skipped',
    reason: 'Brand already provisioned. Use force_reprovision=true to override.'
  }
} else {
  // existing auto-onboard call stays here
}
```

Also extract `force_reprovision` from the request body alongside the other fields.

- [ ] **Step 3: Fix hardcoded domain email**

In `app/api/provision/route.ts`, find the `registerDomain` call that uses `'stuartr@sewo.io'`. Replace with:

```typescript
const domainAdminEmail = process.env.DOMAIN_ADMIN_EMAIL || 'stuartr@sewo.io'
```

Use `domainAdminEmail` in the `registerDomain` call.

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds. The deleted endpoint causes no import errors (it's a standalone route).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: security and reliability improvements to provision pipeline

- Delete unauthenticated provision-secret endpoint
- Add idempotency guard to prevent duplicate auto-onboard calls
- Move hardcoded domain email to DOMAIN_ADMIN_EMAIL env var"
```

---

## Task 2: Remove PDF Upload Mode

**Files:**
- Delete: `app/api/admin/parse-brand-guide/route.ts`
- Delete: `lib/parse-brand-guide.ts`
- Modify: `components/ProvisionForm.tsx` (removing upload branches only — full decomposition in later tasks)

- [ ] **Step 1: Delete PDF parsing files**

Delete both:
- `app/api/admin/parse-brand-guide/route.ts`
- `lib/parse-brand-guide.ts`

- [ ] **Step 2: Remove upload mode from ProvisionForm**

In `components/ProvisionForm.tsx`:

1. Remove the `mode === 'upload'` option from the mode selector UI (look for the three mode buttons/tabs near the top of the JSX)
2. Remove the `handleUploadParse` function (line ~367) and all code that references it
3. Remove the `uploadFile` useState
4. Remove any JSX sections gated by `mode === 'upload'` (file upload UI, parsing status display, etc.)
5. Remove the `saveBrandProfile()` function and its call (saves to localStorage, never read back)

Do NOT restructure the rest of the component — that's Task 3-6.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no references to deleted files.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove PDF upload mode (replaced by MCP client submission)

- Delete parse-brand-guide route and utility
- Remove upload mode branches from ProvisionForm
- Remove saveBrandProfile localStorage dead code"
```

---

## Task 3: Create ProvisionContext

**Files:**
- Create: `components/provision/ProvisionContext.tsx`

- [ ] **Step 1: Create the provision context and reducer**

Create `components/provision/ProvisionContext.tsx` with:

1. `ProvisionState` type (all state fields from the spec — provisionSecret, mode, brand identity, voice, author, visual, deploy config, domain, products, content config, network, UI state)
2. `ProvisionAction` discriminated union for the reducer (SET_FIELD for individual updates, SET_FIELDS for batch updates, RESET for starting over)
3. `initialState` with sensible defaults (empty strings, false booleans, 'editorial' theme, 'syd' region, etc.)
4. `provisionReducer` function
5. `ProvisionContext` React context
6. `ProvisionProvider` component wrapping useReducer
7. `useProvisionContext()` hook that throws if used outside provider

Key design decisions:
- `SET_FIELD` action takes `{ field: keyof ProvisionState, value: any }` for individual field updates
- `SET_FIELDS` takes `Partial<ProvisionState>` for batch updates (used when AI populates multiple fields)
- Export all types so step components can import them

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds. New file has no consumers yet — just needs to compile.

- [ ] **Step 3: Commit**

```bash
git add components/provision/ProvisionContext.tsx
git commit -m "feat: add ProvisionContext with reducer for provisioner state management"
```

---

## Task 4: Create useProvision Hook and PipelineTracker

**Files:**
- Create: `components/provision/hooks/useProvision.ts`
- Create: `components/provision/PipelineTracker.tsx`

- [ ] **Step 1: Create useProvision hook**

Create `components/provision/hooks/useProvision.ts`:

1. `useProvision(provisionSecret: string)` hook
2. `handleProvision(state: ProvisionState)` — builds the provision payload from context state, calls `POST /api/provision` with Bearer auth, returns result
3. `startPolling(trackingPath: string)` — polls `/api/admin/pipeline-status` every 5s, calls callback with pipeline status updates
4. `stopPolling()` — clears the interval
5. Returns `{ handleProvision, startPolling, stopPolling, isProvisioning, provisionResult }`

Extract the payload-building logic from the current `handleProvision` in ProvisionForm.tsx. The new hook should map ProvisionState fields to the provision API payload shape (snake_case keys, nested objects for products/ICA/etc).

- [ ] **Step 2: Create PipelineTracker component**

Create `components/provision/PipelineTracker.tsx`:

1. Props: `{ pipelineStatus, logs, provisionResult }`
2. Renders the phase-by-phase status display currently inline in ProvisionForm
3. Shows each phase with status icon (checkmark/warning/error/spinner)
4. Shows accumulated logs with timestamps
5. Shows final result summary (success/warnings/errors)

Extract the pipeline tracking JSX from the current ProvisionForm (the section shown during `phase === 'tracking'` and `phase === 'done'`).

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add components/provision/hooks/useProvision.ts components/provision/PipelineTracker.tsx
git commit -m "feat: add useProvision hook and PipelineTracker component"
```

---

## Task 5: Create Step Components

**Files:**
- Create: `components/provision/steps/NicheStep.tsx`
- Create: `components/provision/steps/BrandUrlStep.tsx`
- Create: `components/provision/steps/DomainStep.tsx`
- Create: `components/provision/steps/VoiceContentStep.tsx`
- Create: `components/provision/steps/ImageStyleStep.tsx`
- Create: `components/provision/steps/AuthorStep.tsx`
- Create: `components/provision/steps/DeployConfigStep.tsx`
- Create: `components/provision/steps/LaunchStep.tsx`

Each step component:
- Reads from and writes to `useProvisionContext()`
- Has no knowledge of other steps or navigation
- Renders its own section of the form
- Handles its own AI generation buttons (if any)

- [ ] **Step 1: Create NicheStep**

Extract from ProvisionForm: the niche input field, the "Research Niche" button that calls `POST /api/admin/dc-proxy` for deep-niche-research, and the research status display. When research completes, batch-update context with `SET_FIELDS` for researchContext, brandVoice, targetMarket, brandBlurb, seedKeywords.

- [ ] **Step 2: Create BrandUrlStep**

Extract from ProvisionForm: the website URL input, the "Extract Brand" button that calls auto-brand via dc-proxy, and the extraction status. On completion, populate brand voice, target market, etc. via `SET_FIELDS`.

- [ ] **Step 3: Create DomainStep**

Extract from ProvisionForm: domain input, domain suggestions (calls `/api/admin/domain-suggestions`), domain selection list, purchase toggle, manual DNS toggle. This is the most complex step (~250 lines) due to the domain suggestion UI.

- [ ] **Step 4: Create VoiceContentStep**

Extract from ProvisionForm: brand voice textarea, target market textarea, brand blurb textarea, seed keywords input. Include the "Generate from niche" AI buttons that call enhance-brand.

- [ ] **Step 5: Create ImageStyleStep**

Extract from ProvisionForm: image style configuration (visual_style, mood, composition, lighting, color palette, subject), logo URL input, "Generate Logo" button.

- [ ] **Step 6: Create AuthorStep**

Extract from ProvisionForm: author name, bio, image URL, page URL, social URLs (dynamic list with add/remove).

- [ ] **Step 7: Create DeployConfigStep**

Extract from ProvisionForm: theme selector (editorial/boutique/modern) with preview, primary/accent color pickers, heading/body font inputs, Fly region selector, stitch toggle, Google services toggles (GA4/GTM/GSC), translation toggle + language selector, articles per day.

Also add niche-aware defaults (spec section 6b):
- When theme changes, auto-set border_radius default (editorial: 0px, boutique: 16px, modern: 8px)
- When niche is set in context, auto-call `suggestNicheColors()` to populate color defaults. This function currently lives in `components/ProvisionForm.tsx` — extract it to a utility (e.g., `lib/niche-colors.ts`) and call it from a `useEffect` in DeployConfigStep that watches the `niche` field from context

- [ ] **Step 8: Create LaunchStep**

Extract from ProvisionForm: the summary review panel (showing all configured values), provision button, and PipelineTracker integration. Uses the `useProvision` hook. Reads the provision secret from ProvisionContext (entered in the wizard shell, not here).

- [ ] **Step 9: Verify all steps build**

Run: `npm run build`
Expected: Build succeeds. Steps are standalone components — no consumers yet.

- [ ] **Step 10: Commit**

```bash
git add components/provision/steps/
git commit -m "feat: create 8 provision wizard step components

Extract form sections from ProvisionForm.tsx into focused components:
NicheStep, BrandUrlStep, DomainStep, VoiceContentStep,
ImageStyleStep, AuthorStep, DeployConfigStep, LaunchStep"
```

---

## Task 6: Create ProvisionWizard and Wire Everything Together

**Files:**
- Create: `components/provision/ProvisionWizard.tsx`
- Modify: `app/admin/provision/page.tsx`
- Delete: `components/ProvisionForm.tsx`

- [ ] **Step 1: Create ProvisionWizard**

Create `components/provision/ProvisionWizard.tsx`:

1. Wraps everything in `<ProvisionProvider>`
2. **Provision secret input** at the very top — a password field where the admin pastes the secret. Stored in ProvisionContext (`provisionSecret` field) so all steps and the useProvision hook can access it. This replaces the deleted provision-secret endpoint.
3. Mode selector: "I have a website" (brand) vs "I have a niche idea" (niche)
4. Step navigation:
   ```typescript
   const NICHE_STEPS = ['niche', 'domain', 'voice', 'imageStyle', 'author', 'deploy', 'launch']
   const BRAND_STEPS = ['brandUrl', 'domain', 'voice', 'imageStyle', 'author', 'deploy', 'launch']
   ```
4. Step indicator/breadcrumb showing progress
5. Next/Back buttons (Back hidden on first step, Next disabled until step validates)
6. Renders the current step component based on `activeStep`
7. When `phase !== 'form'`, replaces step UI with PipelineTracker

- [ ] **Step 2: Update provision page to use ProvisionWizard**

In `app/admin/provision/page.tsx`, change:
```typescript
import ProvisionForm from '@/components/ProvisionForm'
```
to:
```typescript
import ProvisionWizard from '@/components/provision/ProvisionWizard'
```
And update the JSX to render `<ProvisionWizard />`.

- [ ] **Step 3: Delete ProvisionForm.tsx**

Delete `components/ProvisionForm.tsx`. All its functionality now lives in the provision/ directory.

- [ ] **Step 4: Check for other imports of ProvisionForm**

Search the codebase for any other files importing ProvisionForm. If found, update them to import ProvisionWizard instead. Check:
- Other admin pages
- Any dynamic imports
- Any re-exports from index files

Run: `grep -r "ProvisionForm" --include="*.tsx" --include="*.ts"` to find all references.

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: Build succeeds. This is the critical integration step — all components must work together.

- [ ] **Step 6: Verify dev server works**

Run: `npm run dev`
Navigate to `/admin/provision` and verify:
- Mode selector shows 2 options (no upload mode)
- Step navigation works (next/back)
- Form fields are editable
- No console errors

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: replace ProvisionForm monolith with ProvisionWizard

Break 2,378-line monolith into 12 focused components:
- ProvisionWizard shell with step navigation
- ProvisionContext for shared state management
- 8 step components (Niche, BrandUrl, Domain, VoiceContent, ImageStyle, Author, DeployConfig, Launch)
- PipelineTracker for phase status display
- useProvision hook for API integration"
```

---

## Task 7: Pipeline Error Handling Standardization

**Files:**
- Modify: `app/api/provision/route.ts`

- [ ] **Step 1: Add PhaseResult type and runPhase helper**

At the top of `app/api/provision/route.ts`, add:

```typescript
type PhaseResult = {
  phase: string
  status: 'success' | 'warning' | 'error' | 'skipped'
  severity: 'critical' | 'important' | 'optional' | 'silent'
  message?: string
  data?: Record<string, unknown>
  duration_ms: number
}

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 2000))
        continue
      }
      const status = severity === 'silent' ? 'success' : (severity === 'critical' ? 'error' : 'warning')
      return { phase: name, status, severity, message, duration_ms: Date.now() - start }
    }
  }
  throw new Error('unreachable')
}
```

- [ ] **Step 2: Wrap each phase in runPhase**

Refactor each phase's try/catch block to use `runPhase()`:

```typescript
const phase_results: PhaseResult[] = []

// DB Seed — critical, 2 retries (3 total attempts)
const dbResult = await runPhase('db_seed', 'critical', 2, async () => {
  // existing DB seed logic — move it into this function body
  return { tables_seeded: 8 }
})
phase_results.push(dbResult)

// Auto-onboard — important, 0 retries (1 attempt only)
// Note: remove any existing fetchWithRetry wrapper to avoid double-retry
const onboardResult = await runPhase('auto_onboard', 'important', 0, async () => {
  // existing auto-onboard logic (with idempotency check from Task 1)
  return { triggered: true }
})
phase_results.push(onboardResult)

// Google services — important, 0 retries (1 attempt)
const googleResult = await runPhase('google_services', 'important', 0, async () => { ... })

// Fly deploy — critical, 2 retries
const flyResult = await runPhase('fly_deploy', 'critical', 2, async () => { ... })

// Domain purchase — optional, 0 retries
const domainResult = await runPhase('domain_purchase', 'optional', 0, async () => { ... })

// ... same pattern for tls_certs, search_console, dns_config, email_notify (all optional, 0 retries)
// ... hero_image and analytics_log use severity 'silent', 0 retries
```

**Important:** Some phases currently use their own retry wrappers (e.g., `fetchWithRetry` for auto-onboard). Remove these internal retry wrappers when wrapping in `runPhase` to avoid double-retry behavior.

Keep the existing `notifications` object populated for backwards compatibility. Build it from `phase_results` at the end.

- [ ] **Step 3: Add phase_results to response**

In the final `NextResponse.json()`, add `phase_results` alongside existing fields:

```typescript
return NextResponse.json({
  success: true,
  data: { username, display_name, /* ... */ },
  warnings: phase_results.filter(p => p.status === 'warning').map(p => `${p.phase}: ${p.message}`),
  notifications,  // backwards compat
  phase_results,   // new structured output
})
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/api/provision/route.ts
git commit -m "refactor: standardize provision pipeline error handling

Add runPhase() helper with categorized retry logic:
- Critical (db_seed, fly_deploy): 2 retries
- Important (auto_onboard, google_services): 1 retry
- Optional (domain, certs, DNS, email): no retry
- Silent (hero_image, analytics): no warning on failure

Add phase_results array to response for structured status tracking."
```

---

## Task 8: Theme Cleanup

**Files:**
- Modify: `components/themes/ThemeRenderer.tsx`
- Modify: `components/themes/boutique/Header.tsx`
- Modify: `components/themes/modern/Header.tsx`
- Modify: `components/CookieConsent.tsx`

- [ ] **Step 1: Add ThemeRenderer warning**

In `components/themes/ThemeRenderer.tsx`, for each of the three component maps (`HEADERS`, `HOME_PAGES`, `BLOG_POSTS`), add a warning before the fallback:

```typescript
export function ThemeHeader({ theme, ...props }: { theme: string } & HeaderProps) {
  if (!HEADERS[theme]) {
    console.warn(`[ThemeRenderer] Unknown theme "${theme}", falling back to editorial`)
  }
  const Component = HEADERS[theme] || HEADERS.editorial
  return <Component {...props} />
}
```

Apply the same pattern to `ThemeHomePage` and `ThemeBlogPost`.

- [ ] **Step 2: Re-enable boutique tagline**

In `components/themes/boutique/Header.tsx`, find line 163 with `{false && tagline && (` and change `{false &&` to just `{`:

```typescript
// Before:
{false && tagline && (
// After:
{tagline && (
```

- [ ] **Step 3: Add tagline to modern Header**

In `components/themes/modern/Header.tsx`, add `tagline` to the component props (check the existing props interface or inline destructuring). Add rendering next to the brand name in the nav:

```tsx
{tagline && (
  <span style={{
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted, #6b7280)',
    marginLeft: '12px',
    fontWeight: 400,
  }}>
    {tagline}
  </span>
)}
```

- [ ] **Step 4: Update CookieConsent to use CSS variables**

In `components/CookieConsent.tsx`, replace hardcoded colors:

| Hardcoded | Replace with |
|-----------|-------------|
| `#ffffff` (modal bg) | `var(--color-bg)` |
| `#0f172a` (main text) | `var(--color-text)` |
| `#475569` (secondary text) | `var(--color-text-muted, #475569)` |
| `#3b82f6` (primary button) | `var(--color-accent)` |
| `#2563eb` (primary hover) | `var(--color-accent)` with opacity/filter |
| `#f1f5f9` (secondary bg) | `var(--color-bg-muted, #f1f5f9)` |
| `#cbd5e1` (border) | `var(--color-border, #cbd5e1)` |

Add `fontFamily: 'var(--font-body)'` and `borderRadius: 'var(--border-radius)'` to the modal and button styles.

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add components/themes/ components/CookieConsent.tsx
git commit -m "fix: theme cleanup — tagline support, warnings, CSS variables

- Add console.warn for unknown theme names in ThemeRenderer
- Re-enable tagline rendering in boutique Header
- Add tagline prop to modern Header
- Replace hardcoded colors in CookieConsent with CSS variables"
```

---

## Task 9: Brand Data Quality — Tagline and Niche Defaults

**Files:**
- Modify: `lib/brand.ts`
- Modify: `app/api/provision/route.ts`

- [ ] **Step 1: Run tagline DB migration**

Execute via Supabase dashboard or CLI:

```sql
ALTER TABLE brand_guidelines ADD COLUMN IF NOT EXISTS tagline TEXT;
```

- [ ] **Step 2: Add tagline to provision payload**

In `app/api/provision/route.ts`, in the `guidelinesPayload` object (the object passed to the brand_guidelines upsert), add:

```typescript
tagline: body.tagline || null,
```

- [ ] **Step 3: Add tagline to brand data fetch**

In `lib/brand.ts`, the `getBrandData()` function queries brand_guidelines with `select('*')` or a specific field list. If using `*`, tagline is already included. If using a field list, add `tagline` to it.

Also, add `tagline` to the `BrandGuidelines` interface:

```typescript
interface BrandGuidelines {
  // ...existing fields
  tagline?: string | null
}
```

- [ ] **Step 4: Remove font_sizes dead code from lib/brand.ts**

In `lib/brand.ts`, if `font_sizes` is referenced in the `BrandSpecs` interface or fetch, remove it. It's fetched from DB but never used by any rendering component.

- [ ] **Step 5: Pass tagline through layout to theme headers**

Check `app/layout.tsx` and the theme header rendering. The layout currently reads tagline as `brand.company?.blurb` (around line 95). Update it to use a fallback chain:

```typescript
const tagline = brand.guidelines?.tagline || brand.company?.blurb || ''
```

This preserves backward compatibility for existing sites that have blurb but no tagline column yet. Ensure the resolved `tagline` is passed as a prop to the `ThemeHeader` component.

- [ ] **Step 6: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add lib/brand.ts app/api/provision/route.ts app/layout.tsx
git commit -m "feat: add tagline support to brand data pipeline

- Add tagline column to brand_guidelines (migration)
- Include tagline in provision payload and brand data fetch
- Pass tagline from layout through to theme headers
- Remove unused font_sizes from BrandSpecs interface"
```

---

## Task 10: Final Verification and Cleanup

**Files:**
- Modify: `.env.local.example` (if it exists)

- [ ] **Step 1: Add new env vars to example file**

If `.env.local.example` exists, add:

```
# Domain registration admin email (defaults to stuartr@sewo.io if not set)
DOMAIN_ADMIN_EMAIL=
```

- [ ] **Step 2: Run full build**

Run: `npm run build`
Expected: Clean build with no warnings related to changed files.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No new lint errors from changed files.

- [ ] **Step 4: Check for stale imports**

Run grep to verify no remaining references to deleted files:

```bash
grep -r "ProvisionForm" --include="*.tsx" --include="*.ts" .
grep -r "parse-brand-guide" --include="*.tsx" --include="*.ts" .
grep -r "provision-secret" --include="*.tsx" --include="*.ts" .
```

Expected: No results (all references updated or removed).

- [ ] **Step 5: Update EducateProvisioner references**

`app/admin/educate-provisioner/EducateProvisioner.tsx` contains documentation references to `GET /api/admin/provision-secret` (around line 656) and references to `ProvisionForm.tsx` (around line 1533). Update these to reflect the new architecture:
- Remove or update the provision-secret endpoint reference
- Change `ProvisionForm.tsx` references to `components/provision/ProvisionWizard.tsx`

- [ ] **Step 6: Commit any cleanup**

```bash
git add -A
git commit -m "chore: final cleanup — env vars, stale import check"
```

---

## Execution Order and Dependencies

```
Task 1 (Security) ─────────────────────────────┐
Task 2 (Remove PDF) ───────────────────────────┤
                                                ├─→ Task 6 (Wire Wizard) ─→ Task 10 (Final)
Task 3 (Context) ──→ Task 4 (Hook+Tracker) ──→ │
                  ──→ Task 5 (Steps) ──────────┘
Task 7 (Pipeline) ─────────────────────────────────→ Task 10
Task 8 (Theme Cleanup) ────────────────────────────→ Task 10
Task 9 (Brand Quality) ────────────────────────────→ Task 10
```

**Parallelizable groups:**
- Tasks 1, 2, 3, 7, 8, 9 can all run in parallel (no dependencies on each other)
- Tasks 4 and 5 depend on Task 3 (need ProvisionContext)
- Task 6 depends on Tasks 1-5 (wires everything together)
- Task 10 depends on all other tasks

**Note on Task 2:** The modifications to ProvisionForm.tsx in Task 2 are throwaway work — the file is deleted in Task 6. Task 2 exists so the build passes at each intermediate step.

---

## Cross-Repo Follow-Up

After this plan is complete, the following change is needed in the **Doubleclicker** repo (`/Users/stuarta/doubleclicker`):

**Research context pass-through** — In `api/strategy/auto-onboard.js`, pass `research_context` from the `onboard_config` app_setting through to the `launch` payload so it reaches the `discover_keywords` and `build_topical_map` steps. See spec section 6a for details.
