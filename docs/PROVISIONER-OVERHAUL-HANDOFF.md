# Provisioner Overhaul — Doubleclicker Handoff Document

**Date:** 2026-04-05
**Repo:** doubleclicker-1 (the multi-tenant blog frontend + provisioner)
**Purpose:** Complete reference of all changes made, for the Doubleclicker app to consume

---

## 1. New Database Columns on `brand_guidelines`

Seven new columns were added to `brand_guidelines`. All are populated during provisioning. The Doubleclicker writer should check these fields first, falling back to `voice_and_tone` if empty.

### 1a. Tagline

```sql
ALTER TABLE brand_guidelines ADD COLUMN IF NOT EXISTS tagline TEXT;
```

- Set during provisioning from `body.tagline`
- Rendered in all 3 theme headers (editorial, boutique, modern)
- Falls back to `company_information.blurb` if null
- The writer/onboard pipeline does NOT need to populate this — it comes from provisioning

### 1b. Structured Voice Fields (6 columns)

These are populated by a GPT-4.1 call during provisioning. If `OPENAI_API_KEY` is not set or the call fails, they default to null/empty.

```sql
-- Already applied via migration
ALTER TABLE brand_guidelines ADD COLUMN IF NOT EXISTS voice_formality TEXT;
ALTER TABLE brand_guidelines ADD COLUMN IF NOT EXISTS voice_perspective TEXT;
ALTER TABLE brand_guidelines ADD COLUMN IF NOT EXISTS voice_personality_traits TEXT[];
ALTER TABLE brand_guidelines ADD COLUMN IF NOT EXISTS voice_sentence_style JSONB;
ALTER TABLE brand_guidelines ADD COLUMN IF NOT EXISTS voice_vocabulary_preferences JSONB;
ALTER TABLE brand_guidelines ADD COLUMN IF NOT EXISTS voice_example_sentences TEXT[];
```

**Field details:**

| Column | Type | Values | Example |
|--------|------|--------|---------|
| `voice_formality` | text | `"casual"`, `"casual-professional"`, `"formal"` | `"casual-professional"` |
| `voice_perspective` | text | `"second_person"` (brand sites), `"third_person"` (affiliate/review), `"first_person"` | `"second_person"` |
| `voice_personality_traits` | text[] | 3-5 specific traits | `["authoritative", "warm", "direct"]` |
| `voice_sentence_style` | jsonb | `{ "avg_length": "short"|"medium"|"long", "fragments_ok": bool, "rhetorical_questions": bool }` | `{ "avg_length": "medium", "fragments_ok": true, "rhetorical_questions": false }` |
| `voice_vocabulary_preferences` | jsonb | `{ "prefer": string[], "avoid": string[] }` | `{ "prefer": ["straightforward", "evidence-based"], "avoid": ["leverage", "synergy", "paradigm", "gamechanger", "seamless", "utilize"] }` |
| `voice_example_sentences` | text[] | 3-5 niche-specific sentences | `["Your NAD+ levels decline by 50% every 20 years — here's what the research actually says about supplementation.", ...]` |

**How the writer should use these:**

1. Check if `voice_formality` is non-null — if so, use the structured fields
2. If null/empty, fall back to `voice_and_tone` (the existing free-text field)
3. The structured fields are additive — `voice_and_tone` continues to be populated
4. `voice_vocabulary_preferences.avoid` always includes: "leverage", "utilize", "synergy", "paradigm", "gamechanger", "seamless" plus brand-specific terms
5. `voice_example_sentences` are specific to the brand's niche — use them as style examples when prompting the LLM for article writing

---

## 2. Provision API Changes

### 2a. New Request Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tagline` | string | null | Brand tagline for header display |
| `secondary_color` | string | null | Secondary brand color (hex) |
| `force_reprovision` | boolean | false | Override idempotency guard — forces auto-onboard even if brand already exists |

### 2b. Idempotency Guard

**Before calling auto-onboard**, the provisioner now checks `integration_credentials` for an existing row with the given `user_name`. If found and `force_reprovision` is not `true`, the auto-onboard call is **skipped**:

```json
{
  "notifications": {
    "doubleclicker": {
      "status": "skipped",
      "reason": "Brand already provisioned. Use force_reprovision=true to override."
    }
  }
}
```

**Impact on Doubleclicker:** If a provisioning call skips auto-onboard, Doubleclicker will NOT receive a `POST /api/strategy/auto-onboard` call. This is intentional — it prevents duplicate content pipelines when re-provisioning to update brand data only.

To force a re-run of the content pipeline, the caller must set `force_reprovision: true`.

### 2c. New Response Field: `phase_results`

The provision response now includes a structured `phase_results` array alongside the existing `notifications` object:

```json
{
  "success": true,
  "notifications": { ... },
  "phase_results": [
    {
      "phase": "db_seed",
      "status": "success",
      "severity": "critical",
      "duration_ms": 1850
    },
    {
      "phase": "auto_onboard",
      "status": "success",
      "severity": "important",
      "duration_ms": 2340,
      "data": { "triggered": true }
    },
    {
      "phase": "hero_image",
      "status": "success",
      "severity": "silent",
      "duration_ms": 4200
    },
    {
      "phase": "google_services",
      "status": "success",
      "severity": "important",
      "duration_ms": 3100
    },
    {
      "phase": "fly_deploy",
      "status": "success",
      "severity": "critical",
      "duration_ms": 45000
    }
  ],
  "warnings": []
}
```

**Phase IDs:** `db_seed`, `auto_onboard`, `hero_image`, `google_services`, `fly_deploy`, `domain_purchase`, `tls_certs`, `search_console`, `dns_config`, `email_notify`, `analytics_log`

**Severity categories:**

| Severity | Phases | Retries | On failure |
|----------|--------|---------|------------|
| `critical` | db_seed, fly_deploy | 2 retries (3 attempts) | status: "error" |
| `important` | auto_onboard, google_services | 0 retries (1 attempt) | status: "warning" |
| `optional` | domain_purchase, tls_certs, search_console, dns_config, email_notify | 0 retries | status: "warning" |
| `silent` | hero_image, analytics_log | 0 retries | status: "success" (no warning) |

The `notifications` object is still populated for backwards compatibility. `phase_results` is the new structured format.

---

## 3. Deleted Endpoints

These endpoints no longer exist. Any code calling them will get 404:

| Endpoint | Why removed | Replacement |
|----------|-------------|-------------|
| `GET /api/admin/provision-secret` | Security: returned PROVISION_SECRET with zero auth | Manual password input on admin pages |
| `POST /api/admin/parse-brand-guide` | Dead code: PDF upload replaced by MCP client submission | `POST /api/drafts` (MCP draft system) |

---

## 4. Admin UI Architecture Change

The admin provisioner at `/admin/provision` was completely restructured:

**Before:** Single `ProvisionForm.tsx` (2,378 lines, 40+ useState calls)

**After:** 12 focused components:

```
components/provision/
├── ProvisionWizard.tsx          # Shell: mode selector, step navigation, secret input
├── ProvisionContext.tsx          # Shared state via React context + reducer
├── PipelineTracker.tsx          # Phase status display with live polling
├── hooks/
│   └── useProvision.ts          # Provision API call + pipeline polling
└── steps/
    ├── NicheStep.tsx            # Niche input + AI deep-niche-research
    ├── BrandUrlStep.tsx         # Website URL + AI brand extraction
    ├── DomainStep.tsx           # Domain search, selection, purchase
    ├── VoiceContentStep.tsx     # Brand voice, target market, blurb, keywords
    ├── ImageStyleStep.tsx       # Visual style, mood, composition, logo gen
    ├── AuthorStep.tsx           # Author details + social URLs
    ├── DeployConfigStep.tsx     # Theme, colors, fonts, region, toggles
    └── LaunchStep.tsx           # Summary, provision button, tracking
```

**Only 2 provisioning modes now:**
- "I have a website" → product-first (calls `/api/strategy/auto-brand` via dc-proxy)
- "I have a niche idea" → niche-first (calls `/api/strategy/deep-niche-research` via dc-proxy)

PDF upload mode was removed entirely.

---

## 5. Theme Changes

### 5a. Tagline Support

All 3 themes now render a tagline in the header:

| Theme | Placement | Style |
|-------|-----------|-------|
| Editorial | Below brand name in masthead | Italicized, thin separator |
| Boutique | Below brand name | Smaller text, accent color |
| Modern | Next to brand name in nav | Muted text, smaller font |

Tagline is hidden when null/empty (no blank space rendered).

**Data flow:** `brand_guidelines.tagline` → `getBrandData()` → `app/layout.tsx` → `ThemeHeader` component

**Fallback:** `brand.guidelines.tagline || brand.company.blurb || ''`

### 5b. ThemeRenderer Warning

Unknown theme names now log `console.warn` before falling back to editorial. Previously this was silent.

### 5c. CookieConsent

CookieConsent component now uses CSS variables (`--color-bg`, `--color-text`, `--color-accent`, `--border-radius`, `--font-body`) instead of hardcoded colors. It respects whatever theme the site uses.

---

## 6. Environment Variable Changes

| Variable | Change | Description |
|----------|--------|-------------|
| `DOMAIN_ADMIN_EMAIL` | **New** | Email used for domain registrations (defaults to `stuartr@sewo.io`) |
| `OPENAI_API_KEY` | **Now used** | Required for structured voice extraction via GPT-4.1 during provisioning. Optional — degrades gracefully. |
| `LLAMA_CLOUD_API_KEY` | **Removed** | Was used for PDF parsing (deleted feature) |

---

## 7. Dead Code Removed

| Item | Description |
|------|-------------|
| `app/api/admin/provision-secret/route.ts` | Unauthenticated secret endpoint |
| `app/api/admin/parse-brand-guide/route.ts` | PDF parsing endpoint |
| `lib/parse-brand-guide.ts` | 410-line PDF parsing utility (LlamaParse + GPT-4o) |
| `components/ProvisionForm.tsx` | 2,378-line monolith (replaced by components/provision/) |
| `font_sizes` in BrandSpecs | Fetched from DB but never used by any rendering component |
| PDF upload mode | All `mode === 'upload'` branches removed |

---

## 8. What the Writer/Onboard Pipeline Should Do

### 8a. Read Structured Voice Fields

When generating content, the writer should check for structured voice data:

```javascript
// In article writing / outline generation
const brand = await supabase
  .from('brand_guidelines')
  .select('voice_and_tone, voice_formality, voice_perspective, voice_personality_traits, voice_sentence_style, voice_vocabulary_preferences, voice_example_sentences')
  .eq('user_name', username)
  .single()

const hasStructuredVoice = brand.data?.voice_formality != null

if (hasStructuredVoice) {
  // Use structured fields for precise voice control
  const voicePrompt = `
    Write in a ${brand.data.voice_formality} tone.
    Use ${brand.data.voice_perspective} perspective.
    Personality: ${brand.data.voice_personality_traits.join(', ')}.
    Sentence style: ${brand.data.voice_sentence_style.avg_length} sentences.
    ${brand.data.voice_sentence_style.fragments_ok ? 'Sentence fragments are OK.' : 'Use complete sentences.'}
    ${brand.data.voice_sentence_style.rhetorical_questions ? 'Rhetorical questions encouraged.' : 'Avoid rhetorical questions.'}
    Prefer words like: ${brand.data.voice_vocabulary_preferences.prefer?.join(', ')}.
    NEVER use: ${brand.data.voice_vocabulary_preferences.avoid?.join(', ')}.

    Example sentences in this brand's voice:
    ${brand.data.voice_example_sentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}
  `
} else {
  // Fall back to free-text voice description
  const voicePrompt = `Write in this voice: ${brand.data.voice_and_tone}`
}
```

### 8b. Research Context Pass-Through (Action Required)

**This is the one cross-repo change needed in the Doubleclicker repo.**

In `api/strategy/auto-onboard.js`, the `research_context` from `onboard_config:{username}` in `app_settings` should be passed through to the `launch` payload so it reaches the `discover_keywords` and `build_topical_map` steps.

Currently, `research_context` is stored correctly in `app_settings` by the provisioner, but the auto-onboard launch step may not be passing it through to the keyword discovery and topical map generation steps.

**What research_context contains:**
```json
{
  "content_pillars": ["Anti-aging strategies", "NAD+ research", "Longevity biomarkers"],
  "keyword_themes": [
    { "theme": "NAD+ Biology", "keywords": ["NAD+ supplements", "NMN", "NR"] },
    { "theme": "Aging Mechanisms", "keywords": ["cellular senescence", "telomere length"] }
  ],
  "unique_angles": ["Biohacking angle", "Science-backed protocols"],
  "market_overview": "..."
}
```

**How it should be used:**
- `content_pillars` → structure article outlines around these topics
- `keyword_themes` → feed into keyword discovery for SEO targeting
- `unique_angles` → differentiation strategy for unique value proposition

---

## 9. Complete brand_guidelines Schema (Current)

For reference, here are all columns the provisioner populates on `brand_guidelines`:

| Column | Type | Source | Description |
|--------|------|--------|-------------|
| `user_name` | text | `body.username` | Tenant identifier |
| `name` | text | `body.display_name` | Brand display name |
| `company_name` | text | `body.display_name` | Same as name |
| `website_url` | text | `body.website_url` | Brand website |
| `voice_and_tone` | text | `body.brand_voice_tone` | Free-text voice description |
| `brand_personality` | text | `body.brand_voice_tone` | Same as voice_and_tone |
| `tagline` | text | `body.tagline` | Brand tagline for headers |
| `voice_formality` | text | GPT-4.1 extraction | casual / casual-professional / formal |
| `voice_perspective` | text | GPT-4.1 extraction | second_person / third_person / first_person |
| `voice_personality_traits` | text[] | GPT-4.1 extraction | 3-5 specific traits |
| `voice_sentence_style` | jsonb | GPT-4.1 extraction | avg_length, fragments_ok, rhetorical_questions |
| `voice_vocabulary_preferences` | jsonb | GPT-4.1 extraction | prefer/avoid word lists |
| `voice_example_sentences` | text[] | GPT-4.1 extraction | 3-5 niche-specific example sentences |
| `target_market` | text | `body.target_market` | Target audience description |
| `content_style_rules` | text | Derived from research_context | Content pillars, keyword themes, angles |
| `stitch_enabled` | boolean | `body.stitch_enabled` | Enable Stitch video worker |
| `default_author` | text | `body.author_name` | Default article author |
| `author_bio` | text | `body.author_bio` | Author biography |
| `author_image_url` | text | `body.author_image_url` | Author avatar |
| `author_url` | text | `body.author_url` | Author profile URL |
| `author_social_urls` | jsonb | `body.author_social_urls` | Social media links |
| `seed_keywords` | text[] | `body.seed_keywords` | Initial keyword seeds |
| `niche` | text | `body.niche` | Industry/topic niche |
| `preferred_elements` | text[] | `body.preferred_elements` | Content elements to include |
| `prohibited_elements` | text[] | `body.prohibited_elements` | Content elements to avoid |
| `ai_instructions_override` | text | `body.ai_instructions_override` | Custom AI instructions |
| `logo_url` | text | `body.logo_url` | Logo image URL |

---

## 10. MCP Draft Submission System

External clients can now submit brand concepts via the MCP (Model Context Protocol) instead of PDF upload:

**Flow:**
1. Client AI (via `doubleclicker-onboard` MCP server) guides user through 7-phase consultation
2. Submits structured `SiteConceptPayload` to `POST /api/drafts` with API key auth
3. Draft appears in `/admin/drafts` for admin review
4. Admin selects domains, clicks "Provision"
5. DraftReview maps draft → provision payload → calls `POST /api/provision`

**Doubleclicker impact:** None — the auto-onboard call from provisioning is identical regardless of whether the provision was initiated from the admin wizard or a draft review. Doubleclicker only receives `{ username }` and reads everything from the shared DB.

---

## 11. Summary of What Doubleclicker Needs to Do

| Priority | Action | Description |
|----------|--------|-------------|
| **High** | Read structured voice fields | Check `voice_formality` != null, use 6 structured fields for article writing. Fall back to `voice_and_tone` if null. |
| **High** | Pass research_context through | In `auto-onboard.js`, ensure `research_context` from `onboard_config` reaches `discover_keywords` and `build_topical_map` |
| **Medium** | Handle `force_reprovision` awareness | Auto-onboard may not be called on re-provisions unless `force_reprovision: true`. This is by design — don't treat it as an error. |
| **Low** | Use `phase_results` for tracking | If the DC pipeline-status polling reads provision results, the new `phase_results` array provides structured status per phase |
| **None** | Tagline, themes, CookieConsent | These are frontend-only changes. No Doubleclicker action needed. |
