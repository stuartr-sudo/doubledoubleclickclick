# Brand Guide Upload — Design Spec

**Date:** 2026-03-21
**Status:** Approved
**Scope:** doubleclicker-1 (Blog Cloner) + Doubleclicker integration

## Problem

The client produces structured brand guide PDFs (via her AI tool) that define entire site networks — niches, brand identity, ICA profiles, affiliate products, style guides, and pod hierarchy. Currently, the `/admin/network` wizard generates all this data via AI (expand-network + deep-niche-research + enhance-brand). She wants to upload the document and have the system parse it, skipping the AI generation steps while still using domain search and the existing provisioning pipeline.

## Solution

Add a "Upload Brand Guide" entry point to the existing network wizard. The PDF is parsed via LlamaParse + LLM extraction, producing structured data that populates the same `NetworkForm` state the AI-generation path uses. Everything downstream (domain search, review, launch, Doubleclicker onboarding) stays untouched.

## User Flow

### Step 0 — Entry Point (new)

Two cards on `/admin/network`:
- **"Upload Brand Guide"** — parse a PDF, extract sites automatically
- **"Build from Scratch"** — existing AI-driven flow (unchanged)

Upload path:
1. Number picker: "1 Hub + ___ sub-sites" (dropdown 1-7)
2. File upload zone (drag & drop, PDF only, max 10MB)
3. "Parse Brand Guide" button with progress states

### Step 1 — Domain Search & Site Names

Pre-populated with extracted niches and brand data per site. Each site gets:
- Niche (from PDF, editable)
- Brand voice, visual direction, ICA summary (read-only preview, expandable)
- "Suggest Domains" button (reuses existing `fetchDomains()`)
- Site display name derived from chosen domain (not from PDF placeholder names)
- Toggle sites on/off, reorder hub/sub roles

### Steps 2-3 — Review & Launch

Same as current Steps 3-4: review all data, edit overrides, launch.

## Parsing Pipeline

### API Route: `POST /api/admin/parse-brand-guide`

**Request:** `multipart/form-data` — `file` (PDF, max 10MB) + `siteCount` (number)

**Stage 1 — LlamaParse (PDF to Markdown)**
- LlamaParse v2 API: `https://api.cloud.llamaindex.ai/api/v2`
- Tier: `agentic` (best for structured docs with tables)
- Async: upload file, poll job status, fetch markdown result
- Pattern ported from alighos `src/lib/rag/parser.ts`
- Env var: `LLAMA_CLOUD_API_KEY`

**Stage 2 — LLM Structured Extraction (Markdown to JSON)**
- Send markdown + site count to LLM with schema-driven prompt
- Per site extracts:
  - `niche`, `hub_or_sub` role, `placeholder_name`
  - `brand_voice`, `tagline`, `tone`, `visual_direction`, `brand_personality`
  - `style_guide`: colors (primary, accent), fonts (heading, body), visual mood, imagery style, dark/light preference, prohibited elements, preferred elements
  - `ica_profile`: persona name, age range, income, pain points, goals, motivations, buying behavior, search behaviour, content voice, email hook
  - `affiliate_products[]`: name, category, commission structure, recurring flag, cookie duration
  - `content_types[]`: list of content formats
  - `pod_name`, `pod_theme`: overarching network identity
- Returns validated JSON (retry on malformed response)

**Stage 3 — Research Context Synthesis (JSON to Pipeline-Ready Data)**
- Per site, LLM synthesizes a `research_context` matching Doubleclicker's `deep-niche-research` output:
  - `market_overview` — from ICA profile + niche + brand personality
  - `content_pillars` — from content types + niche focus
  - `keyword_themes` — from ICA search behaviour + niche
  - `primary_persona` — mapped from ICA profile
  - `buyer_journey` — from ICA awareness stage + conversion path
  - `unique_angles` — from brand differentiator + voice
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
| Network metadata | `site_networks` | `name`, `seed_niche`, `created_by` |
| Per-site network | `site_network_members` | `network_id`, `username`, `display_name`, `niche`, `domain`, `role` |

### NEW Writes (added to provision)

| PDF Data | Table | Columns |
|----------|-------|---------|
| ICA profile (detailed) | `target_market` | `target_market_name`, `username`, `age`, `income_level`, `occupation`, `location`, `lifestyle`, `hobbies_and_interests`, `values`, `challenges`, `pain_points`, `goals`, `motivations`, `buying_behavior`, `preferred_channels`, `tech_savviness` |
| Style guide visuals | `brand_image_styles` | `name` ("Default Style"), `user_name`, `visual_style`, `color_palette`, `mood_and_atmosphere`, `composition_style`, `lighting_preferences`, `image_type_preferences`, `subject_guidelines`, `prohibited_elements`, `preferred_elements`, `ai_prompt_instructions` |

### Affiliate Products (via Doubleclicker)

Products from the PDF are passed in the onboard payload as `approved_products[]`:
- Inserted into `discovered_products` with `status: 'approved'` (skip scoring/review)
- Promoted to `promoted_products` with `has_affiliate_program: true`
- No affiliate links yet — `affiliate_program_url` left null
- Feed into RAG ingestion + article writing structures

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `lib/parse-brand-guide.ts` | LlamaParse + LLM extraction pipeline (3 stages) |
| `app/api/admin/parse-brand-guide/route.ts` | API route — accepts PDF, returns structured JSON |

### Modified Files
| File | Change |
|------|--------|
| `components/NetworkForm.tsx` | Add Step 0 entry point toggle + upload UI; populate form from parsed data |
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

- **LlamaParse timeout/failure:** Show error, offer retry or fall back to "Build from Scratch"
- **LLM extraction wrong site count:** Validation check, prompt user to adjust
- **Partial extraction (missing fields):** Populate what we have, flag empty fields for manual entry in review step

## Style Guide Usage (4 places)

1. **`brand_specifications`** — colors, fonts for frontend site theming
2. **`brand_image_styles`** — Imagineer flash workflow + editor auto-loads for all image generation
3. **`app_settings` publishing_settings** — `image_style` JSON for Doubleclicker article images
4. **fal.ai prompts** — style guide visual direction feeds hero image + logo generation at provision time

## Dependencies

- `LLAMA_CLOUD_API_KEY` — LlamaParse v2 API key
- Existing: `FAL_KEY`, `OPENAI_API_KEY` or Claude API for LLM extraction
- No new database migrations — all target tables exist
