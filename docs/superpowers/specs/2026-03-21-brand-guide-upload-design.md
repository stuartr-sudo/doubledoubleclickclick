# Brand Guide Upload — Design Spec

**Date:** 2026-03-21
**Status:** Approved
**Scope:** doubleclicker-1 (Blog Cloner) + Doubleclicker integration

## Problem

The client produces structured brand guide PDFs (via her AI tool) that define entire site networks — niches, brand identity, ICA profiles, affiliate products, style guides, and pod hierarchy. Currently, the `/admin/network` wizard generates all this data via AI (expand-network + deep-niche-research + enhance-brand). She wants to upload the document and have the system parse it, skipping the AI generation steps while still using domain search and the existing provisioning pipeline.

## Solution

Add a "Upload Brand Guide" entry point to the existing network wizard. The PDF is parsed via LlamaParse + LLM extraction, producing structured data that populates the same `NetworkForm` state the AI-generation path uses. Everything downstream (domain search, review, launch, Doubleclicker onboarding) stays untouched.

## User Flow

### Step 0 — Entry Point (new first screen)

Two cards on `/admin/network`:
- **"Upload Brand Guide"** — parse a PDF, extract sites automatically
- **"Build from Scratch"** — existing AI-driven flow (unchanged)

Upload path:
1. Number picker: "1 Hub + ___ sub-sites" (dropdown 1-7)
2. File upload zone (drag & drop, PDF only, max 10MB)
3. "Parse Brand Guide" button with progress indicator

**Progress UX:** The parse endpoint is long-running (30-120s). The client polls `GET /api/admin/parse-brand-guide?jobId=X` for status updates. UI shows three progress phases: "Parsing document..." → "Extracting brand data..." → "Synthesizing research context..." with a spinner. If polling exceeds 3 minutes, show timeout error with retry button.

### Step 1 — Domain Search & Site Names

Pre-populated with extracted niches and brand data per site. Each site gets:
- Niche (from PDF, editable)
- Brand voice, visual direction, ICA summary (read-only preview, expandable)
- "Suggest Domains" button (reuses existing `fetchDomains()`)
- Site display name derived from chosen domain (not from PDF placeholder names)
- `placeholder_name` from PDF shown as a label during review for reference
- Toggle sites on/off

**Hub assignment:** The first site extracted is marked as hub by default (matching the PDF's hub designation). User can reassign hub role to any site via a radio button. The `siteCount` picker sets the expected total; if the PDF contains more sites than requested, only the first N are extracted. If fewer, extraction fails with an error asking the user to adjust the count.

### Step 2 — Review & Launch

Same as current network wizard Steps 3-4: review all data, edit overrides, configure Fly region / Google services / translation, launch. The upload path skips the "Brand Research" step entirely since all brand data comes from the PDF + synthesis.

**Step mapping:** Upload path has 3 steps (Entry → Domains → Launch). Scratch path has 4 steps (Niche → Review → Research → Launch). The `SECTIONS` array in NetworkForm.tsx is dynamic based on which path was chosen.

## Parsing Pipeline

### API Route: `POST /api/admin/parse-brand-guide`

**Auth:** Same session-based auth as other `/api/admin/*` routes (checked via Supabase auth cookie).

**Request:** `multipart/form-data` — `file` (PDF, max 10MB) + `siteCount` (number)

**Response (immediate):** `{ jobId: string }` — client polls for result.

**Poll: `GET /api/admin/parse-brand-guide?jobId=X`**
- Returns `{ status: 'parsing' | 'extracting' | 'synthesizing' | 'done' | 'error', result?: SiteData[], error?: string }`

### Stage 1 — LlamaParse (PDF to Markdown)

- LlamaParse v2 API: `https://api.cloud.llamaindex.ai/api/v2`
- Tier: `agentic` (best for structured docs with tables)
- Async: upload file, poll job status, fetch markdown result
- Pattern ported from alighos `src/lib/rag/parser.ts`
- Env var: `LLAMA_CLOUD_API_KEY` (matches LlamaParse v2 SDK convention; alighos uses `LLAMAPARSE_API_KEY` — we use the newer name)

### Stage 2 — LLM Structured Extraction (Markdown to JSON)

- **Model:** `gpt-4o` via OpenAI API (uses existing `OPENAI_API_KEY`). Chosen for structured JSON output reliability and cost efficiency. Temperature: 0. Max tokens: 8000.
- Send markdown + site count with schema-driven prompt
- Per site extracts:
  - `niche` (string), `hub_or_sub` ("hub" | "sub"), `placeholder_name` (string)
  - `brand_voice` (string), `tagline` (string), `tone` (string), `visual_direction` (string), `brand_personality` (string)
  - `style_guide`: `{ primary_color: string, accent_color: string, heading_font: string, body_font: string, visual_mood: string, imagery_style: string, dark_light: "dark" | "light", prohibited_elements: string, preferred_elements: string }`
  - `ica_profile`: `{ persona_name: string, age_range: string, income: string, pain_points: string[], goals: string[], motivations: string[], buying_behavior: string, search_behaviour: string[], content_voice: string, email_hook: string }`
  - `affiliate_products[]`: see Product Schema below
  - `content_types[]`: string[]
  - `pod_name` (string) → maps to `site_networks.name`, `pod_theme` (string) → maps to `site_networks.seed_niche`
- Returns validated JSON (retry up to 2 times on malformed response)

**Product Schema (extracted from PDF):**
```typescript
{
  name: string;           // → discovered_products.name, promoted_products.title
  category: string;       // → discovered_products.niche, promoted_products.category
  commission: string;     // → stored in promoted_products.metadata.commission
  recurring: boolean;     // → stored in promoted_products.metadata.recurring
  cookie_duration: string; // → stored in promoted_products.metadata.cookie_duration
  product_type: "saas" | "physical" | "course"; // → discovered_products.product_type
}
```
Products are passed to Doubleclicker as `approved_products[]` in the onboard payload. DC inserts into `discovered_products` (status: 'approved') then promotes to `promoted_products` with `has_affiliate_program: true`. Fields not available from PDF (`url`, `affiliate_program_url`, `description`) are left null — filled later via outreach or manual entry.

### Stage 3 — Research Context Synthesis (JSON to Pipeline-Ready Data)

- **Model:** Same `gpt-4o`, temperature 0.3 (slightly creative for market analysis).
- Per site, synthesizes `research_context` matching Doubleclicker's `deep-niche-research` output shape:

```typescript
{
  market_overview: string;     // 2-3 paragraph market analysis
  content_pillars: string[];   // 5-8 content themes, e.g. ["Product Reviews", "Buying Guides", ...]
  keyword_themes: string[];    // 10-15 keyword clusters, e.g. ["best [niche] tools", "[tool] vs [tool]", ...]
  primary_persona: {           // Mirrors ICA profile in narrative form
    name: string;
    description: string;       // 2-3 sentence persona summary
    pain_points: string[];
    goals: string[];
  };
  buyer_journey: {
    awareness: string;         // What triggers their search
    consideration: string;     // How they evaluate options
    decision: string;          // What makes them convert
  };
  unique_angles: string[];     // 3-5 differentiators for this site vs competitors
}
```
- Runs in parallel for all sites (Promise.all)

**Response:** JSON array of site objects with extracted brand data + synthesized `research_context`.

## Data Mapping (Verified Against Live Supabase)

### Username Creation (per site, via Doubleclicker)

Doubleclicker's `POST /api/onboarding/createBrandUsername`:
1. INSERT `company_information` — `username`, `client_namespace` (display name), `client_website`
2. Find `stuartr@sewo.io` in `user_profiles`
3. UPDATE `user_profiles.assigned_usernames[]` — append new username

### Provision Writes (Blog Cloner `/api/provision`)

| PDF Data | Table | Columns |
|----------|-------|---------|
| Brand voice + tone | `brand_guidelines` | `voice_and_tone`, `brand_personality` |
| Target market summary | `brand_guidelines` | `target_market` (TEXT) |
| Target market summary | `company_information` | `target_market` (TEXT) |
| Tagline + blurb | `company_information` | `blurb` |
| Colors | `brand_specifications` | `primary_color`, `accent_color`, `secondary_color` |
| Fonts | `brand_specifications` | `heading_font`, `body_font` |
| Logo | `brand_specifications` | `logo_url` (generated via fal.ai) |
| Hero image | `brand_specifications` | `hero_image_url` (generated in Phase 1.5) |
| Author info | `brand_guidelines` | `default_author`, `author_bio`, `author_image_url`, `author_url` |
| Author record | `authors` | `name`, `bio`, `profile_image_url`, `slug`, `user_name` |
| Credentials | `integration_credentials` | `provider`, `author_name`, `author_bio` |
| Publishing settings | `app_settings` | `setting_name: 'publishing_settings:{username}'` |
| Network partners | `app_settings` | `setting_name: 'network_partners:{username}'` (via DC) |
| Pod name/theme | `site_networks` | `name` ← pod_name, `seed_niche` ← pod_theme, `created_by` |
| Per-site network | `site_network_members` | `network_id`, `username`, `display_name`, `niche`, `domain`, `role` |

### NEW Writes (added to provision)

| PDF Data | Table | Columns | Notes |
|----------|-------|---------|-------|
| ICA profile (detailed) | `target_market` | `target_market_name`, `username`, `age`, `income_level`, `occupation`, `location`, `lifestyle`, `hobbies_and_interests`, `values`, `challenges`, `pain_points`, `goals`, `motivations`, `buying_behavior`, `preferred_channels`, `tech_savviness` | All TEXT columns, verified in live DB. Outline writer reads `target_market_name` + `description`. |
| Style guide visuals | `brand_image_styles` | `name` ("Default Style"), `user_name`, `visual_style`, `color_palette`, `mood_and_atmosphere`, `composition_style`, `lighting_preferences`, `image_type_preferences`, `subject_guidelines`, `prohibited_elements`, `preferred_elements`, `ai_prompt_instructions` | All TEXT columns, verified in live DB. Unique constraint on `(name, user_name)`. Imagineer flash auto-loads first row per user_name. |

No new migrations needed — both tables exist with the exact columns listed above (verified via `information_schema.columns` on live Supabase project `uscmvlfleccbctuvhhcj`).

### Affiliate Products (via Doubleclicker)

Products from the PDF are passed in the onboard payload as `approved_products[]` using the Product Schema defined above. See Stage 2 for field mapping details.

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `lib/parse-brand-guide.ts` | LlamaParse + LLM extraction pipeline (3 stages) |
| `app/api/admin/parse-brand-guide/route.ts` | API route — accepts PDF, returns jobId; poll for result |

### Modified Files
| File | Change |
|------|--------|
| `components/NetworkForm.tsx` | Add Step 0 entry point toggle + upload UI; dynamic SECTIONS array; populate form from parsed data |
| `app/api/provision/route.ts` | Add writes to `target_market` table + `brand_image_styles` table |
| `.env.local` | Add `LLAMA_CLOUD_API_KEY` |

### Unchanged
| File | Why |
|------|-----|
| `app/api/admin/provision-network/route.ts` | Payload shape unchanged |
| `app/api/admin/domain-suggestions/route.ts` | Reused as-is |
| `app/api/admin/dc-proxy/route.ts` | Reused as-is |
| All Doubleclicker endpoints | Same payload shape consumed |

## Error Handling

- **LlamaParse timeout/failure:** Show error with retry button, offer "Build from Scratch" fallback
- **LLM extraction wrong site count:** If PDF has fewer sites than `siteCount`, return error asking user to adjust. If more, extract first N only.
- **Partial extraction (missing fields):** Populate what we have, flag empty fields in review step for manual entry
- **Poll timeout (>3 min):** Show timeout error with retry

## Style Guide Usage (4 places)

1. **`brand_specifications`** — colors (`primary_color`, `accent_color`), fonts (`heading_font`, `body_font`) for frontend site theming
2. **`brand_image_styles`** — Imagineer flash workflow (`openclaw-flash.js`) + editor (`ImagineerModal.jsx`) auto-loads for all image generation
3. **`app_settings` publishing_settings** — `image_style` JSON for Doubleclicker article image generation
4. **fal.ai prompts** — style guide visual direction feeds hero image + logo generation at provision time

## Dependencies

- `LLAMA_CLOUD_API_KEY` — LlamaParse v2 API key
- `OPENAI_API_KEY` — for LLM extraction (Stages 2 & 3, using gpt-4o)
- Existing: `FAL_KEY` for image generation
- No new database migrations — all target tables verified in live Supabase
