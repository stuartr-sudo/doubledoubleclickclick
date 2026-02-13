# Plan: Seed Homepage (Option B) + Stitch for Images

**Goal:** Add a new API route that accepts niche/brand inputs, uses an LLM to generate homepage copy, and uses **Stitch** (http://localhost:4390) for images. No OpenClaw dependency.

---

## Scope

1. **New route: `POST /api/setup/seed-homepage`** (or `POST /api/seed-homepage` if you prefer it outside `/setup`).
2. **Text:** Request body includes brand name, niche/target market, brand blurb, and optionally Imagineer/image guidelines. Route calls an LLM (e.g. OpenAI/Claude via env-configured API key) with a prompt + schema to generate a JSON payload matching `homepage_content` text fields (hero_title, hero_description, about_title, about_description, services, faq_items, blog_grid_title, CTAs, etc.).
3. **Images:** Route calls **Stitch Imagineer** at `POST {STITCH_URL}/api/imagineer/generate` (one call per image slot). Prompt + style + dimensions from request `imageStyle` and slot; merge returned image URLs into `homepage_content`. See [STITCH_INTEGRATION.md](STITCH_INTEGRATION.md).
4. **Persistence:** Route uses the same Supabase service client as the rest of the app to update the single `homepage_content` row (either after text generation only, or after text + image URLs are ready).
5. **Auth:** Protect the route (e.g. API key in header or server-side-only usage) so only your pipeline or Stitch can call it.

---

## Implementation outline

| Step | Task |
|------|------|
| 1 | Add `app/api/setup/seed-homepage/route.ts` (or `app/api/seed-homepage/route.ts`). |
| 2 | Define request body type: `{ brandName, niche, brandBlurb, imageStyle?: object }`. Optional: `siteUrl` or `domain` for Stitch callbacks. |
| 3 | Implement LLM call: build a prompt that asks for a JSON object matching the text fields of `homepage_content` (and only those). Parse response and validate shape. |
| 4 | Add helper: for each image slot (hero_image, hero_background_image, logo_image, about_image, etc.), build a prompt from `imageStyle` + slot, call `POST {STITCH_URL}/api/imagineer/generate` with prompt + style + dimensions; parse response for image URL; merge into payload. Use `STITCH_URL` (default `http://localhost:4390`) and `STITCH_API_TOKEN` (default `stitch_dev_token_2024`). |
| 5 | Upsert `homepage_content` with the combined payload (text + image URLs if available). Return success and any generated field summary. |
| 6 | Add env var(s): `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` for the LLM; `STITCH_URL` (default `http://localhost:4390`); `STITCH_API_TOKEN` (default `stitch_dev_token_2024`). |
| 7 | Add auth: e.g. require `Authorization: Bearer <secret>` or `x-api-key` header; secret from env `SEED_HOMEPAGE_API_KEY`. |

---

## Stitch (Imagineer) contract

See **[STITCH_INTEGRATION.md](STITCH_INTEGRATION.md)** for endpoint, auth, request/response, and slot-to-dimensions mapping.

---

## Files to add or touch

- **New:** `app/api/setup/seed-homepage/route.ts` (or `app/api/seed-homepage/route.ts`).
- **Reference:** [app/api/homepage/route.ts](app/api/homepage/route.ts) for the update shape; [supabase/COMPLETE_SETUP.sql](supabase/COMPLETE_SETUP.sql) and [app/HomePageClient.tsx](app/HomePageClient.tsx) for `homepage_content` field list.
- **New:** `docs/STITCH_INTEGRATION.md` – Stitch Imagineer API and slot mapping for seed-homepage.

---

## Out of scope

- No OpenClaw / Claw usage.
- No image generation inside this repo beyond calling Stitch; no DALL·E/Midjourney calls in the template unless you add them later.
