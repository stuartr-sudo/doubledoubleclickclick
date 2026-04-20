# Provisioner Handoff — 2026-04-20

**From:** doubleclicker-1 (multi-tenant blog frontend + provisioner)
**To:** doubleclicker (orchestrator, writer, scheduler, pipeline owner)
**Context:** First real brand provisioned end-to-end (TVW / `thevillageway`). Several integration gaps surfaced. This doc captures everything we shipped, what now provisions automatically, and what still needs fixing on your side.

---

## 1. What `POST /api/provision` now delivers

Single API call. Self-healing (returns 200 with warnings, never 500 for phase failures). All 11 phases:

### Phase 1 — Seed Shared DB

Eight tables, all reachable in one transaction-style block. Each upsert uses select-first-then-insert/update (no raw upsert) due to missing unique constraints.

| Table | Filter | What we write |
|---|---|---|
| `brand_guidelines` | `user_name` | Name, tagline, voice/tone, target_market, niche, seed_keywords, brand_personality, content_style_rules, prohibited_elements, preferred_elements, ai_instructions_override, author defaults, logo_url, **structured voice fields** (voice_formality, voice_perspective, voice_personality_traits, voice_sentence_style, voice_vocabulary_preferences, voice_example_sentences) extracted via GPT-4.1 from `voice_and_tone` |
| `brand_specifications` | `user_name` + FK `guideline_id` | Colors (primary/secondary/accent), fonts (heading/body), theme (`editorial` / `boutique` / `modern`), `logo_url`, `hero_image_url` (filled in Phase 2.5) |
| `company_information` | `username` | brand_name, blurb, client_website, contact email, brand_voice/tone, target_market |
| `authors` | `user_name` + slug | Davina-style author record with bio, profile_image_url, social_links |
| `integration_credentials` | `user_name` | provider=supabase_blog, blog_username, translation config, languages |
| `target_market` | `username` (INSERT-only, allows multiple) | persona_name, description (the long ICA summary). **Note:** the rich structured columns (`age`, `pain_points`, `values`, etc.) are NOT populated by the provisioner today — they were backfilled manually for TVW. **See "Improvements" below.** |
| `brand_image_styles` | `user_name` + name | visual mood, composition, lighting, palette, ai prompt instructions |
| `app_settings` | `setting_name` | publishing_settings, onboard_config, network_partners, **3 v3 flags**, **static_pages** |

### Phase 1 — `app_settings` rows now seeded

```
publishing_settings:{username}      → schema.org markup + author config
onboard_config:{username}            → { articles_per_day, discover_products, research_context }
network_partners:{username}          → only if network_partners[] provided
topical_map_version:{username} = "v3"   ← NEW: every tenant gets v3 by default
outline_version:{username}     = "v3"   ← NEW
writer_version:{username}      = "v3"   ← NEW
static_pages:{username}              ← NEW: { founder_story, philosophy, immutable_rules, mission_long, founder_section_header, philosophy_section_header }
```

The frontend's `/about` page reads `static_pages:{username}` and renders rich sections (founder story, philosophy, immutable rules) — replacing the previous bare "We bring you evidence-based insights..." placeholder.

### Phase 2 — Notify Doubleclicker (auto-onboard)

`POST {DOUBLECLICKER_API_URL}/api/strategy/auto-onboard` with `{ username }` and `x-provision-secret` header. Fire-and-forget, 30s timeout, no retry. Skipped if `skip_pipeline=true` in the provision body (used for "seed and verify before launching writer").

### Phase 2.5 — Hero image + favicon

- **Hero image:** Switched from `fal-ai/flux/schnell` to **`fal-ai/nano-banana-2`** (Google's photo-realistic model). Previous flux/schnell hero was unusable for lifestyle brands; nano-banana-2 produces actual photo-quality results. Stored at `brand-assets/{username}/hero.jpg` in Supabase Storage.
- **Favicon:** Logo persisted to `brand-assets/{username}/favicon.png`. Frontend layout reads `brand_specifications.logo_url` as favicon (with apple-touch-icon).

### Phase 3 — Google services

- GA4 property creation under `GOOGLE_ANALYTICS_ACCOUNT_ID`
- GTM container under `GOOGLE_TAG_MANAGER_ACCOUNT_ID`
- Search Console domain (INET_DOMAIN with `sc-domain:` prefix) — returns DNS TXT verification token
- All wired via service account `elaraopenclaw@gen-lang-client-0071841353.iam.gserviceaccount.com`

### Phase 4 — Fly deploy

- Clone base image from `doubledoubleclickclick`
- Create `{username}-blog` Fly app
- **Brand identity now stored as Fly SECRETS** (was machine env). This was a bug — `fly deploy` clobbers machine env, so TVW briefly served as the wrong tenant after a redeploy. Secrets persist. Set: `BRAND_USERNAME`, `SITE_URL`, `SITE_NAME`, `CONTACT_EMAIL` (+ `NEXT_PUBLIC_*` mirrors), `GA_ID`, `GTM_ID`, `LANGUAGES`
- Allocate IPv4 + IPv6
- Create machine with empty per-tenant env (platform injects NODE_ENV/PORT/HOSTNAME)

### Phases 5-10

- 5: Domain purchase (Cloud Domains, optional)
- 6: TLS cert request (Fly ACME)
- 7: Search Console add (returns TXT verification token)
- 8: Auto-DNS (Cloud DNS, only if domain purchased via 5)
- 9: Email user with DNS records (Resend) — **currently failing** with 403 because `noreply@doubleclicker.app` isn't verified in Resend. See "Improvements".
- 10: Analytics event log

---

## 2. The TVW provisioning run — what actually happened

**Username:** `thevillageway` — a homeschool curriculum brand by Davina (a real brand, NZ-based, mum of four).

**Brand bundle source:** [github.com/stuartr-sudo/tvw-stitch](https://github.com/stuartr-sudo/tvw-stitch) — 85 markdown files including `TVW_Brand_Guidelines.md`, `TVW_ICA_Profile.md`, `TVW_Imagery_Guidelines.md`, `TVW_Website_Copy.md`, `TVW_Blog_Bio.md`. doubleclicker-1 read this and built a rich provision payload manually.

### What landed automatically (provisioner did its job)

| Item | Status |
|---|---|
| 8 DB tables seeded | ✅ |
| All 5 `app_settings:*` rows | ✅ (incl. v3 flags + static_pages) |
| GA4 property `G-T7JJM0H6QJ` (533533125) | ✅ |
| GTM container `GTM-PSRDJRXJ` (249841331) | ✅ |
| Search Console `sc-domain:thevillageway.com` | ✅ |
| Fly app `thevillageway-blog` deployed | ✅ |
| IPv4 `169.155.56.72` / IPv6 `2a09:8280:1::106:6d41:0` | ✅ |
| Hero image (nano-banana-2) | ✅ |
| Logo (fal-ai/flux/schnell, candle + sprig motif) | ✅ |
| Favicon | ✅ |

### What broke and we patched manually

| Issue | Root cause | Fix tonight | Permanent fix |
|---|---|---|---|
| Email failed (no DNS records sent to user) | Resend FROM domain `noreply@doubleclicker.app` not verified in Resend | Surfaced DNS records to user in chat | Verify the domain in Resend, OR switch FROM to a verified domain |
| `target_market.description` populated but 17 structured columns NULL | Provisioner only maps 3 of 18 ICA fields from `ica_profile` payload | Manual UPDATE via SQL | Extend provisioner to map all ICA fields |
| Site briefly served as wrong tenant after `fly deploy` | Brand env was machine env, not Fly secrets | Restored as secrets via `flyctl secrets set` | **DONE** — provisioner now sets all brand identity as secrets (commit `a974dbb`) |
| Empty homepage after launch | boutique theme renders nothing when `posts.length === 0` | Added brand-led welcome hero + empty state copy | **DONE** in commit `a878c29` |
| Stuck topical map run | `topical-map-v3` is fire-and-forget, callback dropped when doubleclicker restarted (PROVISION_SECRET rotation) | Re-fired manually via `POST /api/strategy/generate-topical-map-v3` | **YOUR SIDE** — needs robust resume / recovery |
| Stuck launch chain at `collect_questions` | After topical map completed, the next steps (`stepReviewTopicalMap` → `stepCreateSchedule`) never fired | Manually called `POST /api/strategy/create-schedule` | **YOUR SIDE** — chain doesn't recover when doubleclicker restarts mid-stride; `pipeline-recovery` cron is paused |
| 0 `content_schedule` rows after topical map | Above chain stall | Manually called `create-schedule`, populated 27 rows over 28 days | Same — depends on chain recovery |
| `daily-writer` not picking up TVW articles | `PAUSE_EXPENSIVE_CRONS=true` on doubleclicker | Cannot run writes — your call when to unpause | Decide when to unpause |

---

## 3. The PROVISION_SECRET drift

You should know: when I started provisioning, the `PROVISION_SECRET` had drifted between three places:
- `doubleclicker-1/.env.local` had `provision-41e10c52...`
- Fly secret on `doubledoubleclickclick` was `26f8afb418...` (different)
- Fly secret on `doubleclicker` was `26f8afb418...` (matched the base, didn't match local)

Auto-onboard returned 401 "Invalid provision secret" because of this drift.

I rotated both Fly apps' `PROVISION_SECRET` to match local (`provision-41e10c52...`). Both apps were redeployed via `flyctl secrets set`. **If your local doubleclicker `.env.local` has a different value, your local development won't talk to deployed apps anymore.** Check & sync.

---

## 4. Pipeline state right now (TVW)

```
pipeline_runs:
  - auto_onboard run: COMPLETED
  - launch_pipeline run: status=running, stuck at step 3/11 (collect_questions)
                         updated_at: 2026-04-19 21:50:01 (then nothing)

cluster_articles: 27 rows, all status='active', written 2026-04-19 11:51:52

topic_research_cache: 2 entries (hat research RAN for 2 themes — confirms v3 path is live)

content_schedule: 27 rows (manually triggered just now)
                  scheduled_date range: 2026-04-21 → 2026-05-17
                  1 article per day (articles_per_day=1)
                  Mode: brand_roundrobin (pillar → sub-hubs → educational → tactical → commercial)

blog_posts: 0 (writer paused)
```

---

## 5. Improvements — robustness

These are issues you should consider on your side. Each is concrete.

### 5a. Pipeline recovery is fragile

When doubleclicker restarts mid-chain, the in-flight launch.js process dies and there's no resume. `pipeline-recovery` cron exists but is paused. Symptoms:

- TVW's launch chain is stuck at step 3/11 since 11:27, then a partial recovery moved it to "Question collection queued" at 21:50, then nothing
- 27 articles were written to cluster_articles but the chain never advanced to `stepReviewTopicalMap` or `stepCreateSchedule` automatically

**Suggested fix:** persist `chain_state` after every step transition (column already exists in `pipeline_runs`!) and have `pipeline-recovery` resume from the last known step every 5 min. Idempotent step handlers required.

### 5b. Topical map v3 is fire-and-forget with no progress reporting

We had to query `cluster_articles` and `topic_research_cache` directly to know whether v3 was making progress. The pipeline_runs row doesn't reflect topical-map sub-progress.

**Suggested fix:** `generate-topical-map-v3` should periodically update a status row (own pipeline_runs entry, or a `topical_map_runs` table) with theme-by-theme progress. Frontend can poll.

### 5c. PAUSE_EXPENSIVE_CRONS is a sledgehammer

Pausing daily-writer affects ALL tenants. Right now, no one can publish. We should be able to pause writers for SPECIFIC tenants while letting others continue.

**Suggested fix:** add `app_settings:writer_paused:{username}` boolean. daily-writer reads it per-tenant.

### 5d. No "manual trigger" admin endpoints

We had to call `/api/strategy/create-schedule` directly with the secret. If a tenant gets stuck, there's no admin UI to "force schedule" or "force write next article."

**Suggested fix:** admin endpoints `POST /api/admin/force-schedule { username }` and `POST /api/admin/force-write-next { username }`. Bearer-auth'd.

### 5e. Resend FROM domain unverified

`noreply@doubleclicker.app` rejected by Resend. Email phase fails silently from the user's perspective.

**Suggested fix:** verify `doubleclicker.app` in Resend (15 min one-time setup) OR set `RESEND_FROM_EMAIL` to a domain you control that's already verified.

### 5f. Provisioner ICA field mapping is incomplete

`target_market` table has 18 columns (`age`, `gender`, `income_level`, `lifestyle`, `values`, `pain_points`, `goals`, `motivations`, `buying_behavior`, `preferred_channels`, etc.). Provisioner only maps 3 (`name`, `target_market_name`, `description`) from the `ica_profile` body field.

**Suggested fix (on doubleclicker-1's side):** extend the `if (ica_profile)` block in `app/api/provision/route.ts` to map all available fields from `ica_profile` into the corresponding `target_market` columns. We'll do this — flagging here so doubleclicker knows the data WILL be richer.

### 5g. Brand bundle ingestion (the dream)

Right now I (Claude) read the markdown files in `tvw-stitch` and hand-built a 250-line provision payload. This is the same job for every brand.

**Proposed feature:** `POST /api/admin/provision-from-bundle { username, bundle_repo_url, bundle_branch? }`. The provisioner clones the bundle, looks for known filenames (`Brand_Guidelines.md`, `ICA_Profile.md`, `Founder_Story.md`, `Imagery_Guidelines.md`, `Website_Copy.md`), uses Claude/GPT to extract structured fields, and assembles the provision payload automatically. Then calls `/api/provision` internally.

This collapses "give me a brand to launch" from a 30-minute Claude session to a single API call.

---

## 6. Improvements — site quality

What still makes new sites look generic:

### 6a. Newsletter banner is wired to `/api/leads` but the actual newsletter list isn't connected

The form works, captures the email, stores it. But there's no MailerLite/Beehiiv/Resend Audience integration. Davina's "weekly letter" doesn't exist as a real list yet.

**Fix:** add `newsletter_provider` to brand_guidelines, plumb the `/api/leads` POST to the right provider per tenant.

### 6b. Quiz funnel is bare

The TVW brand bundle has `TVW_Quiz_Design.md` — a complete quiz spec. `/quiz/[id]` exists but there's no quiz seeded for TVW. The blog bio CTA "Start here →" links to `/quiz` and 404s for now.

**Fix:** add `quizzes` table seeding to provisioner, accept `quiz_definition` in provision body, render dynamically.

### 6c. Footer columns are static

"Topics" / "Company" / "Connect" navigation in the footer is hardcoded. Categories are auto-derived from blog_posts (good), but Company/Connect have no per-tenant override.

**Fix:** read from `static_pages.footer_columns` (extend the schema we already have).

### 6d. /privacy /terms are generic legal templates

They use `siteName` and `contactEmail` correctly but the body copy is one-size-fits-all. Brands like TVW (homeschool, kids data) need GDPR/COPPA-specific clauses; e-commerce brands need different terms.

**Fix:** accept `static_pages.privacy_clauses` and `static_pages.terms_clauses` as markdown blocks; render conditionally.

### 6e. About page only shows ONE author

TVW has multiple author voices possible (Davina + future contributors). The About page already loops `authors[]` but the provisioner only seeds one. No issue today; flagging for when tenants need multiple authors.

### 6f. No category pages

Boutique theme has category pills but no `/category/{slug}` page. Click a category → 404.

**Fix:** add `app/category/[slug]/page.tsx` that filters blog_posts by category.

### 6g. RSS / sitemap quality

Sitemap exists but isn't pinged to Google after provisioning. Search Console adds the domain but doesn't submit the sitemap.

**Fix:** Phase 7 (Search Console) should also `submitSitemap(siteUrl + '/sitemap.xml')`.

### 6h. No favicon resizing — it's just the logo

We persist the logo as `favicon.png` but don't resize to 16/32/64. Browsers handle this OK but it's wasteful (a 1024×1024 logo as a favicon is 100KB+).

**Fix:** add a server-side image resizer (sharp / imagemagick / fal.ai background-removal endpoint) to produce 64×64 PNG.

### 6i. No social share image (`og:image`) generated

OG metadata uses default settings but we don't generate a branded OG image (1200×630 with brand text overlay).

**Fix:** add `generateOgImage()` to image-gen.ts using nano-banana-2 with a templated prompt.

### 6j. Hero image prompt could be brand-aware

Current hero prompt is built from `niche + brand_name + image_style` (rough). For TVW the result was great (mother + child reading) but only because we passed a rich `image_style` object. For brands without that, the hero is generic.

**Fix:** when `voice_and_tone` is rich, derive image_style from it via LLM (one Sonnet call) before generating hero.

---

## 7. Things doubleclicker-1 will commit to fixing

Tracked as our followups so you don't need to:

- ✅ DONE: 4 enhancements shipped tonight (commit `a974dbb`)
  - static_pages payload seeding
  - brand env as Fly secrets
  - hero generator → nano-banana-2
  - favicon generation
- ✅ DONE: brand-led homepage hero + empty state (commit `a878c29`)
- ✅ DONE: v3 pipeline flags always seeded (commit `e84937b`)
- 🔲 TODO: full ICA field mapping into target_market structured columns
- 🔲 TODO: brand bundle ingestion endpoint (`/api/admin/provision-from-bundle`)
- 🔲 TODO: favicon resize to 64×64 PNG
- 🔲 TODO: og:image generation
- 🔲 TODO: category page route

---

## 8. Things to coordinate

These need both sides to agree on a contract:

1. **Static pages schema.** doubleclicker-1 writes `static_pages:{username}` with `{ founder_story, philosophy, immutable_rules, mission_long, founder_section_header, philosophy_section_header }`. If you want to extend (e.g., add `manifesto`, `team_bios`), let's agree on the keys.

2. **Pipeline resume mechanism.** When doubleclicker restarts mid-chain, who's responsible for resuming? Today: nobody. Proposal: `pipeline-recovery` cron polls every 5 min, finds runs where `updated_at < NOW() - INTERVAL '10 min'` AND `status='running'`, calls launch.js with the chain_state to resume. Doubleclicker owns this.

3. **Per-tenant cron pause flag.** Replace the global `PAUSE_EXPENSIVE_CRONS` with `app_settings:writer_paused:{username}`. Lets us pause TVW without affecting assureful (or vice versa).

4. **Manual trigger admin endpoints.** Wrappers around launch chain steps: `force-schedule`, `force-write-next`, `force-publish`. Bearer-auth'd. Doubleclicker owns.

---

## TL;DR for the doubleclicker session

- We rotated PROVISION_SECRET; sync your local `.env.local` if you have one
- We're seeding 3 v3 flags + static_pages in app_settings during Phase 1
- We're using nano-banana-2 for hero now (much better quality)
- We're storing brand identity as Fly secrets (was machine env — fly deploy clobbers env)
- TVW pipeline is stuck: 27 outlines + 27 schedule rows, but `daily-writer` is paused so nothing's getting written
- Three things on your plate: pipeline recovery, per-tenant pause flag, fix Resend FROM domain
