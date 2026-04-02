# Doubleclicker Provisioning Platform — Full System Reference

Complete reference for the multi-tenant blog provisioning system. Covers every endpoint, integration, database interaction, theme, deployment step, and configuration option.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Environment Variables](#3-environment-variables)
4. [Tenant System](#4-tenant-system)
5. [Provisioning Pipeline (POST /api/provision)](#5-provisioning-pipeline)
6. [Admin API Endpoints](#6-admin-api-endpoints)
7. [Public API Endpoints](#7-public-api-endpoints)
8. [Google Services Integration](#8-google-services-integration)
9. [Fly.io Integration](#9-flyio-integration)
10. [Supabase / Database](#10-supabase--database)
11. [Theme System](#11-theme-system)
12. [Public-Facing Pages](#12-public-facing-pages)
13. [Middleware](#13-middleware)
14. [Email (Resend)](#14-email-resend)
15. [Image Generation (fal.ai)](#15-image-generation-falai)
16. [Deployment](#16-deployment)
17. [External System Integrations](#17-external-system-integrations)
18. [Pre-Launch Checklist](#18-pre-launch-checklist)

---

## 1. System Overview

Doubleclicker is a **multi-tenant blog platform**. One Next.js 14 codebase is deployed as many independent Fly.io apps. Each deployed site is differentiated solely by the `NEXT_PUBLIC_BRAND_USERNAME` environment variable. All sites share a single Supabase database, with rows filtered by `user_name` or `username` columns (varies by table).

### Key Actors

| Actor | Role |
|-------|------|
| **Blog Cloner** | External service that initiates provisioning via `POST /api/provision` |
| **Doubleclicker (this app)** | Provisions sites, seeds DB, deploys Fly apps, serves blog frontend |
| **Doubleclicker Auto-Onboard** | Content pipeline triggered after DB seeding — keyword research, product discovery, outline generation, draft writing |
| **Stitch** | Background worker that polls `stitch_queue` table every 15 seconds. No HTTP API. |
| **Supabase** | Shared Postgres database for all tenants |
| **Fly.io** | Hosting platform — each tenant gets its own Fly app |
| **Google Cloud** | GA4, GTM, Search Console, Cloud Domains, Cloud DNS |
| **Resend** | Transactional email delivery |
| **fal.ai** | AI image generation (hero banners, logos) |

### System Flow

```
Blog Cloner
  → POST /api/provision (this app)
    → Seeds shared Supabase DB (8 tables)
    → Calls Doubleclicker auto-onboard (fire-and-forget)
    → Generates hero image via fal.ai
    → Creates GA4 property + GTM container
    → Deploys new Fly.io app
    → Purchases domain via Cloud Domains (optional)
    → Requests TLS certificates
    → Adds to Google Search Console
    → Auto-configures DNS via Cloud DNS
    → Emails user with DNS records
    → Logs analytics event

Doubleclicker Auto-Onboard
  → Reads brand config from shared DB
  → Queues work in stitch_queue table

Stitch (separate worker)
  → Polls stitch_queue every 15s
  → Processes content generation tasks
```

---

## 2. Architecture

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/api/provision/` | 10-phase site provisioning pipeline |
| `app/api/provision/verify-domain/` | Domain verification callback |
| `app/api/admin/` | Admin tools (drafts, domain suggestions, Google diagnostics, pipeline status, network provisioning, API keys, logo generation, brand guide parsing, DC proxy) |
| `app/api/blog/` | Blog post CRUD and category listing |
| `app/api/leads/` | Lead capture from homepage |
| `app/api/lead-capture/` | Contact form submissions with rate limiting |
| `app/api/quiz-submit/` | Quiz response scoring |
| `app/api/drafts/` | Site concept draft creation (external API) |
| `app/blog/` | Blog listing and individual post pages |
| `app/about/`, `app/contact/`, `app/privacy/`, `app/terms/` | Static pages |
| `app/quiz/[id]/` | Quiz player |
| `app/admin/` | Admin UI pages (provision form, network form, draft review, API key management) |
| `components/themes/` | 3 themes: editorial, boutique, modern |
| `components/archive/` | Dead components kept for reference |
| `lib/` | Shared utilities (Supabase, Google, Fly, tenant config, posts, brand, themes, spam protection) |

### Path Alias

`@/*` maps to project root (e.g., `@/lib/posts`, `@/components/Footer`).

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **React:** 18.3
- **Database:** Supabase (Postgres)
- **Hosting:** Fly.io (Docker, standalone output)
- **Email:** Resend
- **Analytics:** PostHog, GA4
- **Tag Management:** GTM
- **Auth:** Service account (Google), bearer tokens (Fly, provision)

---

## 3. Environment Variables

### Required for Provisioning

| Variable | Purpose |
|----------|---------|
| `PROVISION_SECRET` | Bearer token authenticating Blog Cloner → Provision endpoint |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (for client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) |
| `DOUBLECLICKER_API_URL` | Doubleclicker backend URL (e.g., `https://doubleclicker.fly.dev`) |
| `FLY_API_TOKEN` | Fly.io API token for app creation/deployment |
| `FLY_ORG_SLUG` | Fly.io organization slug (default: `personal`) |
| `FLY_BASE_APP` | Base Fly app to clone Docker image from (default: `doubledoubleclickclick`) |

### Google Services (Optional but Recommended)

| Variable | Purpose |
|----------|---------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON key for GCP service account |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID (e.g., `gen-lang-client-0071841353`) |
| `GOOGLE_ANALYTICS_ACCOUNT_ID` | GA4 account ID |
| `GOOGLE_TAG_MANAGER_ACCOUNT_ID` | GTM account ID |

### Email

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Sender email address |
| `NOTIFICATION_EMAIL` | Admin notification recipient |

### Per-Tenant (Set on Each Fly Machine)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BRAND_USERNAME` / `BRAND_USERNAME` | Tenant identifier |
| `NEXT_PUBLIC_SITE_URL` / `SITE_URL` | Canonical site URL |
| `NEXT_PUBLIC_SITE_NAME` / `SITE_NAME` | Display name |
| `NEXT_PUBLIC_GA_ID` / `GA_ID` | GA4 Measurement ID |
| `NEXT_PUBLIC_GTM_ID` / `GTM_ID` | GTM Public ID |
| `CONTACT_EMAIL` | Tenant contact email |
| `CONTACT_PHONE` | Tenant contact phone |

### AI / Image Generation (Optional)

| Variable | Purpose |
|----------|---------|
| `FAL_API_KEY` | fal.ai API key for hero images and logos |
| `OPENAI_API_KEY` | OpenAI for brand guide parsing |
| `LLAMA_CLOUD_API_KEY` | LlamaCloud for PDF parsing |

### Analytics (Optional)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL |

### Env Var Precedence

Non-prefixed env vars (runtime) take priority over `NEXT_PUBLIC_*` (build-time) which take priority over empty-string defaults. `getTenantConfig()` returns safe fallbacks when vars are missing — this is intentional for build-time prerendering.

---

## 4. Tenant System

### `getTenantConfig()` — `lib/tenant.ts`

Returns a `TenantConfig` object for the current deployment:

```typescript
interface TenantConfig {
  username: string       // BRAND_USERNAME || NEXT_PUBLIC_BRAND_USERNAME || ''
  siteUrl: string        // SITE_URL || derived from NEXT_PUBLIC_SITE_URL || ''
  siteName: string       // SITE_NAME || NEXT_PUBLIC_SITE_NAME || ''
  contactEmail: string   // CONTACT_EMAIL || ''
  contactPhone: string   // CONTACT_PHONE || ''
  gtmId: string          // GTM_ID || NEXT_PUBLIC_GTM_ID || ''
  gaId: string           // GA_ID || NEXT_PUBLIC_GA_ID || ''
}
```

Empty-string fallbacks are intentional — they allow `next build` to succeed without env vars during static prerendering. Do not add null checks that would break this.

### How Multi-Tenancy Works

1. Each Fly.io app is deployed from identical Docker image
2. Env vars on the Fly machine differentiate the tenant
3. All DB queries filter by `username` or `user_name` from `getTenantConfig().username`
4. Themes, colors, fonts, content all come from the shared Supabase DB

---

## 5. Provisioning Pipeline

### `POST /api/provision`

**Authentication:** `Authorization: Bearer {PROVISION_SECRET}`

**Returns 200** even on phase failures (warnings accumulated). Only returns 500 for auth or configuration errors.

### Input Parameters

```typescript
{
  // Required
  username: string              // Tenant identifier (used in DB + Fly app name)
  display_name: string          // Brand display name

  // Brand Identity
  website_url?: string          // Existing website URL
  niche: string                 // Industry/topic (required if no website_url)
  blurb?: string                // Brand description
  brand_voice_tone?: string     // Voice and tone description
  target_market?: string        // Target audience description
  contact_email?: string        // Derived from domain if omitted

  // Visual Identity
  primary_color?: string        // Hex color (e.g., '#2563eb')
  accent_color?: string         // Hex color
  logo_url?: string             // URL to logo image
  heading_font?: string         // Google Font name
  body_font?: string            // Google Font name
  theme?: string                // 'editorial' | 'boutique' | 'modern' (default: 'editorial')

  // Author
  author_name?: string          // Default author name
  author_bio?: string           // Author biography
  author_image_url?: string     // Author avatar URL
  author_url?: string           // Author website
  author_social_urls?: object   // Social media links

  // Content Configuration
  seed_keywords?: string[]      // Initial keyword seeds
  languages?: string[]          // e.g., ['en', 'es']
  articles_per_day?: number     // Publishing frequency

  // Brand Guide Data (from parse-brand-guide)
  ica_profile?: object          // Ideal Customer Avatar
  style_guide?: object          // Writing style rules
  research_context?: object     // Industry research context
  preferred_elements?: string[] // Content elements to include
  prohibited_elements?: string[] // Content elements to avoid
  ai_instructions_override?: string // Custom AI instructions

  // Google Services (all default true)
  setup_google_analytics?: boolean
  setup_google_tag_manager?: boolean
  setup_search_console?: boolean

  // Domain
  domain?: string               // Custom domain to register
  purchase_domain?: boolean     // Register via Cloud Domains
  manual_dns?: boolean          // Manual DNS setup mode
  domain_yearly_price?: { currencyCode: string, units: string, nanos: number }
  domain_notices?: string[]     // Domain registration notices

  // Deployment
  fly_region?: string           // Fly.io region (default: 'syd')
  skip_pipeline?: boolean       // Skip DC auto-onboard
  skip_deploy?: boolean         // Skip Fly deployment
  stitch_enabled?: boolean      // Enable Stitch worker (default: true)

  // Network
  network_partners?: object[]   // Partner sites for cross-linking
}
```

### Phase 1: Seed Shared Database

Seeds 8 tables in the shared Supabase database. Each upsert retries once on failure.

| Table | Filter Column | Data Seeded |
|-------|---------------|-------------|
| `brand_guidelines` | `user_name` | Brand name, voice/tone, niche, keywords, author defaults, logo URL |
| `brand_specifications` | `user_name` | Colors, fonts, logo URL, theme, hero image |
| `company_information` | `username` | Brand name, website, email, blurb |
| `authors` | `user_name` + `slug` | Name, bio, avatar, social URLs |
| `integration_credentials` | `user_name` | Provider config (translation, blog username) |
| `target_market` | `username` | ICA profile (INSERT only, allows multiple) |
| `brand_image_styles` | `user_name` + `name` | Visual mood/composition for image generation |
| `app_settings` | `user_name` | Publishing settings, onboard config, network partners |

**Helper function:** `dbUpsert(supabase, table, filterCol, filterVal, payload, label, filter2?)` — select-first-then-insert/update pattern (no upsert due to missing unique constraints).

### Phase 2: Notify Doubleclicker (Auto-Onboard)

Calls `POST {DOUBLECLICKER_API_URL}/api/strategy/auto-onboard` with:
- Body: `{ username }`
- Header: `x-provision-secret: {PROVISION_SECRET}`
- Timeout: 30 seconds, 1 retry

This is **fire-and-forget**. Doubleclicker reads all brand/content config from the shared DB. All data must already be seeded (Phase 1) before this call.

After auto-onboard, the content pipeline runs: keyword research → product discovery → outline generation → draft writing → Stitch queue.

### Phase 2.5: Generate Hero Banner Image

Generates a hero banner via fal.ai (non-blocking).

- Builds prompt from niche, brand name, and image style
- Updates `brand_specifications.hero_image_url` on success
- Continues silently if `FAL_API_KEY` not set

### Phase 3: Create Google Services

Only runs if `GOOGLE_SERVICE_ACCOUNT_JSON` is configured.

**GA4 (if `setup_google_analytics=true`):**
- Creates property under `GOOGLE_ANALYTICS_ACCOUNT_ID`
- Creates web data stream with site URL
- Returns `measurementId` (G-XXXXXXX format)

**GTM (if `setup_google_tag_manager=true`):**
- Creates web container on `GOOGLE_TAG_MANAGER_ACCOUNT_ID`
- Returns `publicId` (GTM-XXXXXXX format)

GA/GTM IDs are stored as env vars on the Fly machine in Phase 4.

### Phase 4: Deploy to Fly.io

Skipped if `skip_deploy=true` or no `FLY_API_TOKEN`.

1. Get Docker image from base app (`FLY_BASE_APP`)
2. Create app `{username}-blog` in org `FLY_ORG_SLUG`
3. Set secrets: `NEXT_PUBLIC_SUPABASE_URL`, anon key, service role key, `RESEND_API_KEY`
4. Allocate IPv4 and IPv6 (independently, retry once each)
5. Create machine with env vars:
   - `NEXT_PUBLIC_BRAND_USERNAME`, `BRAND_USERNAME`
   - `NEXT_PUBLIC_SITE_URL`, `SITE_URL`, `SITE_NAME`
   - `CONTACT_EMAIL`
   - `GA_ID`, `NEXT_PUBLIC_GA_ID` (if created)
   - `GTM_ID`, `NEXT_PUBLIC_GTM_ID` (if created)
   - `NODE_ENV=production`, `PORT=3000`, `HOSTNAME=0.0.0.0`

**Machine spec:** shared CPU, 1 core, 512 MB RAM, port 3000, autostop/autostart enabled, min 0 machines.

### Phase 5: Purchase Domain

Optional. Only runs if `purchase_domain=true` and domain price provided.

- Registers domain via Google Cloud Domains
- Privacy: `REDACTED_CONTACT_DATA`
- Returns long-running operation (domain activates in 1–2 minutes)
- Charges the GCP project's billing account

### Phase 6: Request TLS Certificates

Requests HTTPS certificates from Fly's ACME integration for both `www.{domain}` and `{domain}` (apex). Each request is independent — one failure doesn't block the other.

Builds DNS records from whichever succeeded.

### Phase 7: Add to Google Search Console

Only runs if `setup_search_console=true` and Google is configured.

- Adds domain property with `sc-domain:` prefix (NOT `SITE` type — that fails with DNS_TXT verification)
- Requests DNS TXT verification token
- Token included in DNS records for Phase 8

### Phase 8: Auto-Configure DNS (Cloud DNS)

Only runs if domain was purchased via Cloud Domains AND Fly deployed successfully.

- Finds managed zone auto-created by Cloud Domains
- Deletes existing A/AAAA/TXT records (preserves NS and SOA)
- Creates:
  - `A` record → Fly IPv4
  - `AAAA` record → Fly IPv6
  - `CNAME` record → `www` → `{app}.fly.dev`
  - `TXT` records → Search Console verification (if applicable)
- TTL: 300 seconds

### Phase 9: Email User with DNS Records

Sends HTML email via Resend to `contact_email` containing:

- DNS records table (type, name, value)
- CTA button: link to live Fly.dev URL
- CTA button: verify domain link (`/api/provision/verify-domain`)
- Format varies based on `manual_dns` flag

### Phase 10: Log Analytics Event

Inserts `site_provisioned` event into `analytics_events` table with full context (username, domain, all notification statuses, warnings).

### Response Format

```json
{
  "success": true,
  "message": "Site provisioned for {username}",
  "data": {
    "brand_guidelines": [...],
    "brand_specifications": [...],
    "company_information": [...],
    "author": [...],
    "integration_credentials": [...]
  },
  "notifications": {
    "doubleclicker": { "status": "ok|failed|skipped", "statusCode": 200, "data": {}, "error": "" },
    "hero_image": { "status": "ok|failed|skipped", "url": "", "reason": "" },
    "google_analytics": { "status": "ok|failed|skipped", "measurement_id": "", "property_id": "", "error": "" },
    "google_tag_manager": { "status": "ok|failed|skipped", "public_id": "", "container_id": "", "error": "" },
    "fly": { "status": "ok|failed|skipped", "app": "", "url": "", "ipv4": "", "ipv6": "", "error": "" },
    "domain_purchase": { "status": "ok|failed|skipped", "domain": "", "operation": "", "price": {}, "error": "" },
    "domain": { "status": "ok|failed|skipped", "domain": "", "www_cert": {}, "apex_cert": {}, "dns_records": [] },
    "search_console": { "status": "ok|failed|skipped", "site_url": "", "verification_token": "", "error": "" },
    "dns_auto_config": { "status": "ok|failed|skipped", "records": [], "reason": "" },
    "email": { "status": "ok|failed|skipped", "to": "", "error": "" }
  },
  "warnings": ["..."],
  "fly": { "app": "", "url": "", "ipv4": "", "ipv6": "" },
  "dns_records": [{ "type": "A", "name": "@", "value": "..." }],
  "google": { "ga_measurement_id": "", "gtm_public_id": "" }
}
```

---

## 6. Admin API Endpoints

### `GET /api/admin/provision-secret`

Returns the `PROVISION_SECRET` value. Used by the admin UI form. Should be gated behind auth in production.

### `POST /api/admin/provision-network`

Orchestrates parallel provisioning of an entire network of related sites.

**Input:**
```json
{
  "network_name": "string",
  "seed_niche": "string",
  "members": [
    {
      "username": "string",
      "display_name": "string",
      "niche": "string",
      "role": "seed | satellite",
      "contact_email": "string",
      "domain": "string (optional)",
      "purchase_domain": false,
      "domain_yearly_price": {},
      "brand_voice": "string",
      "target_market": "string",
      "primary_color": "#XXXXXX",
      "accent_color": "#XXXXXX",
      "logo_url": "string",
      "author_name": "string",
      "ica_profile": {},
      "style_guide": {},
      "research_context": {}
    }
  ],
  "fly_region": "syd",
  "setup_google_analytics": true,
  "setup_google_tag_manager": true,
  "setup_search_console": true,
  "languages": ["en"],
  "articles_per_day": 1,
  "theme": "editorial"
}
```

**Flow:**
1. Creates `site_networks` record
2. Creates `site_network_members` records
3. Builds `network_partners` list for each member (all OTHER members)
4. Calls `POST /api/provision` in parallel for each member
5. Updates member status: `provisioning` → `done` or `failed`

### `GET /api/admin/provision-network?network_id=X`

Returns network and member statuses.

### `POST /api/admin/api-keys`

Creates API key for external clients (requires `PROVISION_SECRET` header).

**Input:** `{ client_name, contact_email }`
**Output:** `{ id, key }` — full key shown only once.

### `DELETE /api/admin/api-keys`

Revokes API key by ID.

### `GET /api/admin/pipeline-status`

Proxies to Doubleclicker's pipeline status endpoint.

**Query:** `?path=/api/strategy/pipeline-status?username=X&run_id=Y`

### `PATCH /api/admin/drafts`

Updates site draft status, domain selections, admin notes.

**Input:** `{ draft_id, domain_selections, status, admin_notes }`
**Auth:** `PROVISION_SECRET` header.

### `POST /api/admin/generate-logo`

Generates a logo via fal.ai.

**Input:** `{ prompt, username }`
**Output:** `{ success, url }`

### `GET /api/admin/google-test`

Diagnostic endpoint for testing Google API access.

**Query:** `?action=gtm-accounts|gtm-containers|gtm-create`
- `gtm-accounts` — Lists GTM accounts visible to service account
- `gtm-containers` — Lists containers on configured account
- `gtm-create` — Creates a test container (optional `?name=`)

**Auth:** Bearer token (`PROVISION_SECRET`).

### `POST /api/admin/parse-brand-guide`

Fire-and-forget PDF parsing pipeline for brand guide uploads.

**Input:** FormData with `file` (PDF, max 10 MB) and `siteCount` (1–8).
**Output:** `{ jobId }` (202 Accepted).

### `GET /api/admin/parse-brand-guide?jobId=X`

Polls parsing job status.

**Output:** `{ status, result, error }`
**Statuses:** `parsing` → `extracting` → `synthesizing` → `done` / `error`

Result contains enriched site data with ICA profiles, style guides, research context. Jobs stored in-memory (max 50, oldest auto-pruned).

### `POST /api/admin/domain-suggestions`

Searches available domains via Google Cloud Domains.

**Input:** `{ niche, brand_name }`
**Output:** `{ suggestions: [{ domain, price, currency, yearlyPrice, available, domainNotices }], queries_tried, errors }`

Filters to domains under $15/year, sorted by price.

### `POST /api/admin/dc-proxy` / `GET /api/admin/dc-proxy`

Proxies requests to Doubleclicker backend with 120-second timeout.

**Auth:** `PROVISION_SECRET` header.

---

## 7. Public API Endpoints

### `POST /api/blog`

Upserts/publishes/unpublishes blog posts.

**Input:** `{ postId, title, content, slug, status, tags, featured_image, author, ... }`
- Upserts on `external_id` to `blog_posts`
- If `status='draft'` or `'unpublish'`, deletes post

### `GET /api/blog`

Returns published posts for current tenant.

**Query:** `?limit=100&category=X`

### `GET /api/blog/categories`

Returns categories with post counts.

### `POST /api/leads`

Captures homepage lead magnet submissions.

**Input:** `{ name, email, topic, username }`

### `POST /api/lead-capture`

Contact form submissions with rate limiting and email notification.

**Input:** `{ name, email, company, website, message, source, topic }`
- IP-based rate limiting (in-memory cache)
- HTML email notification to admin via Resend
- Spam protection via `lib/spam-protection.ts`

### `POST /api/quiz-submit`

Scores quiz submissions.

**Input:** `{ quizId, brandId, name, email, answers, timeTakenSeconds }`
- Fetches quiz questions, scores each answer
- Stores response in `quiz_responses`
- Returns score, percentage, pass/fail

### `POST /api/drafts`

Creates site concept draft from external API client.

**Input:** SiteConceptPayload (type, contact_email, sites array with niche/brand_voice/role)
**Auth:** Bearer token (API key validation)
**Output:** `{ draft_id, status, type, site_count }`

### `GET /api/provision/verify-domain`

Domain verification callback (linked from DNS email).

**Query:** `?username=X&domain=Y`

**Flow:**
1. Checks TLS certificate status for `www.{domain}`
2. If configured → domain is live:
   - Updates `brand_guidelines.website_url` and `company_information.client_website`
   - Sends confirmation email
   - Returns `{ success: true, status: 'live', live_url }`
3. If not yet issued:
   - Returns `{ success: false, status: 'pending' }`
   - Includes manual DNS records in response

---

## 8. Google Services Integration

### Source: `lib/google.ts`

All APIs authenticated via `GOOGLE_SERVICE_ACCOUNT_JSON` (service account JSON key).

### Service Account Requirements

| Service | Required Role |
|---------|--------------|
| GA4 | Editor role on Analytics account |
| GTM | **Admin-level** access at the GTM account level (NOT just User/Edit) |
| Search Console | Service account becomes verified owner |
| Cloud Domains | `roles/domains.admin` on GCP project |
| Cloud DNS | `roles/dns.admin` on GCP project |

### Functions

**`isGoogleServiceConfigured()`** — Returns `true` if `GOOGLE_SERVICE_ACCOUNT_JSON` is set.

**`createGA4Property(displayName, siteUrl, timeZone)`**
- Creates GA4 property under `GOOGLE_ANALYTICS_ACCOUNT_ID`
- Creates web data stream
- Returns: `{ propertyId, propertyName, measurementId, streamName }`

**`listGTMAccounts()`** — Lists GTM accounts (diagnostics).

**`listGTMContainers()`** — Lists containers on configured account.

**`createGTMContainer(containerName)`**
- Creates web container
- Returns: `{ containerId, publicId, path }`

**`addSearchConsoleSite(siteUrl)`**
- Extracts domain, gets DNS TXT verification token
- Adds domain property with `sc-domain:` prefix
- Returns: `{ siteUrl, domain, verificationToken, verificationMethod }`

**`searchDomains(query)`** — Searches available domains via Cloud Domains.

**`registerDomain(domainName, contactEmail, yearlyPrice, domainNotices)`**
- Registers domain, privacy = `REDACTED_CONTACT_DATA`
- Returns: `{ domainName, operationName, status: 'REGISTRATION_PENDING' }`

**`getDnsZone(domainName)`**
- Finds Cloud DNS managed zone (auto-created by Cloud Domains)
- Returns: `{ zoneName, dnsName }`

**`configureDnsRecords(domainName, records)`**
- Input: `{ ipv4, ipv6, flyAppHostname, txtRecords? }`
- Creates A, AAAA, CNAME (www), and TXT records
- TTL: 300 seconds
- Deletes existing records first (preserves NS and SOA)
- Returns: `{ status, additions: [{ type, name, value }] }`

---

## 9. Fly.io Integration

### Source: `lib/fly.ts`

All functions use `FLY_API_TOKEN` (Bearer auth).

**API endpoints:**
- Machines REST: `https://api.machines.dev/v1`
- GraphQL: `https://api.fly.io/graphql`

### Functions

**`createApp(appName, orgSlug)`** — Creates Fly app. 409/422 = already exists (non-fatal).

**`setSecrets(appName, secrets)`** — Sets app secrets via GraphQL mutation.

**`allocateIpv4(appName)`** / **`allocateIpv6(appName)`** — Allocates static IPs.

**`getAppImage(appName)`** — Gets Docker image from first machine of base app.

**`createMachine(appName, image, env, region)`** — Creates machine:
- CPU: shared, 1 core
- Memory: 512 MB
- Ports: 80 (HTTP), 443 (TLS + HTTP)
- Internal port: 3000
- Autostop/autostart enabled, min 0 machines
- Env: `NODE_ENV=production`, `PORT=3000`, `HOSTNAME=0.0.0.0`, + custom

**`addCertificate(appName, hostname)`** — Requests ACME TLS certificate. 409 = already exists.

**`checkCertificate(appName, hostname)`** — Returns certificate status (`configured` flag).

---

## 10. Supabase / Database

### Client: `lib/supabase/service.ts`

`createServiceClient()` returns a Supabase client with service role key (bypasses RLS). Auth persistence disabled.

### Column Name Inconsistency

This is critical to understand:

| Tables | Filter Column |
|--------|--------------|
| `blog_posts`, `brand_guidelines`, `brand_specifications`, `authors` | `user_name` |
| `company_information`, `target_market`, `cluster_articles`, `content_schedule` | `username` |

### Date Columns on `blog_posts`

- `created_date` (NOT `created_at`)
- `updated_date` (NOT `updated_at`)
- `published_date`

### No Unique Constraints

The following tables have **no unique constraint** on their user column:
- `brand_guidelines`
- `brand_specifications`
- `company_information`
- `authors`

You must use a **select-first-then-insert/update** pattern, NOT upsert.

### Foreign Key Naming

`brand_specifications.guideline_id` (NOT `brand_guideline_id`)

### Tables Seeded During Provisioning

| Table | Key Columns |
|-------|------------|
| `brand_guidelines` | `user_name`, `name`, `voice_and_tone`, `brand_personality`, `niche`, `seed_keywords`, `default_author_name`, `default_author_bio`, `default_author_image`, `logo_url` |
| `brand_specifications` | `user_name`, `guideline_id`, `primary_color`, `accent_color`, `heading_font`, `body_font`, `logo_url`, `theme`, `hero_image_url` |
| `company_information` | `username`, `company_name`, `client_website`, `contact_email`, `blurb` |
| `authors` | `user_name`, `name`, `slug`, `bio`, `avatar_url`, `website`, `social_urls` |
| `integration_credentials` | `user_name`, `provider`, `blog_username`, `translation_enabled`, `languages` |
| `target_market` | `username`, `ica_profile` |
| `brand_image_styles` | `user_name`, `name`, `mood`, `composition`, `color_palette` |
| `app_settings` | `user_name`, `articles_per_day`, `stitch_enabled`, `auto_onboard_complete`, `network_partners` |

### Other Key Tables

| Table | Purpose |
|-------|---------|
| `blog_posts` | Published blog content |
| `leads` | Lead magnet submissions |
| `quiz_responses` | Quiz answers and scores |
| `site_drafts` | Site concept drafts from external clients |
| `site_networks` | Network definitions |
| `site_network_members` | Network member status |
| `api_keys` | External client API keys |
| `analytics_events` | Provision event logs |
| `stitch_queue` | Background worker queue (read by Stitch) |

---

## 11. Theme System

### Three Themes

| Theme | Font | Feel | Key Features |
|-------|------|------|-------------|
| **Editorial** | Georgia (serif) | Classic newspaper | Top bar with date, double-line masthead, category nav, no border radius |
| **Boutique** | DM Sans | Warm & personal | Accent color top bar, centered brand, pill-shaped category nav, 16px radius |
| **Modern** | Inter | Clean & minimal | Compact header, slide-down mobile menu, 8px radius |

### How Themes Work

1. **Selection:** Theme name stored in `brand_specifications.theme` in Supabase
2. **CSS Variables:** `BrandStyles.tsx` (server component) fetches brand specs, gets theme preset from `lib/themes.ts`, merges with brand-specific overrides, injects as `html[data-theme]` CSS
3. **Component Rendering:** `ThemeRenderer.tsx` maps theme name → component (ThemeHomePage, ThemeBlogPost, etc.)
4. **Custom CSS:** `brand_specifications.custom_css` applied on top of theme variables

### Key Files

| File | Purpose |
|------|---------|
| `lib/themes.ts` | `THEMES` constant with all preset definitions |
| `components/BrandStyles.tsx` | Server component injecting theme CSS variables |
| `components/themes/ThemeRenderer.tsx` | Factory mapping theme names to components |
| `components/themes/editorial/` | Editorial theme components |
| `components/themes/boutique/` | Boutique theme components |
| `components/themes/modern/` | Modern theme components |
| `components/themes/types.ts` | Shared type definitions |

### Theme Variables

Each theme defines CSS custom properties:
- `--font-heading`, `--font-body`
- `--color-bg`, `--color-text`, `--color-accent`, `--color-muted`
- `--border-radius`
- `--shadow` (or none)
- Plus many more for fine-grained control

---

## 12. Public-Facing Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Home page (ThemeHomePage — hero, latest grid, product spotlight) |
| `/blog` | `app/blog/page.tsx` | Blog listing — 12 posts/page, category filtering, pagination |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` | Individual blog post with JSON-LD structured data |
| `/about` | `app/about/page.tsx` | About page |
| `/contact` | `app/contact/page.tsx` | Contact form (with spam protection + rate limiting) |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy |
| `/terms` | `app/terms/page.tsx` | Terms of service |
| `/quiz/[id]` | `app/quiz/[id]/page.tsx` | Interactive quiz |

### Blog Post Features

- Theme-specific layout via `ThemeBlogPost`
- JSON-LD structured data (Article + Breadcrumb schemas)
- `generated_llm_schema` support (FAQPage, HowTo, etc.)
- `BlogTracker` component for analytics
- Dynamic OG tags and Twitter cards
- Related posts section

### Admin Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/provision` | ProvisionForm | Single-site provisioning wizard |
| `/admin/network` | NetworkForm | Network provisioning form |
| `/admin/drafts` | DraftReview | Review and approve site concept drafts |
| `/admin/api-keys` | API Key Management | Create and revoke external API keys |

---

## 13. Middleware

### Source: `middleware.ts`

Applied to all routes except Next.js internals and static assets.

**Behaviors:**

1. **Canonical host redirect:** Apex domain → `www` redirect (308 Permanent Redirect). Uses `NEXT_PUBLIC_SITE_URL` to determine canonical host.
2. **Legacy path redirect:** `/pages/contact` → `/contact` (301 Moved Permanently).

---

## 14. Email (Resend)

### DNS Email (Phase 9)

Sent after provisioning with:
- DNS records table
- Link to live Fly.dev URL
- Domain verification link
- Format varies for `manual_dns` mode

### Domain Verification Email

Sent when `verify-domain` endpoint confirms TLS certificate is active.

### Lead Capture Notification

Sent to `NOTIFICATION_EMAIL` when contact form is submitted. HTML formatted with sanitized fields.

### Required Variables

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` — sender address
- `NOTIFICATION_EMAIL` — admin recipient

---

## 15. Image Generation (fal.ai)

### Hero Banner Generation (Phase 2.5)

- Builds prompt from niche, brand name, image style
- Updates `brand_specifications.hero_image_url`
- Non-blocking, continues if `FAL_API_KEY` not set

### Logo Generation (`POST /api/admin/generate-logo`)

- Input: `{ prompt, username }`
- Returns: `{ success, url }`

### Required Variable

- `FAL_API_KEY` (optional — features degrade gracefully without it)

---

## 16. Deployment

### Docker Build

Multi-stage Node 20 Alpine build (see `Dockerfile`):

1. **deps stage:** `npm ci` — install dependencies
2. **builder stage:** `npm run build` — Next.js production build
3. **runner stage:** Minimal production image
   - Non-root `nextjs` user
   - Only `.next/standalone` and `.next/static` (no full `node_modules`)
   - Runs `node server.js`
   - Exposes port 3000

### Fly.io Configuration (`fly.toml`)

```toml
app = 'doubledoubleclickclick'   # Base app name
primary_region = 'syd'           # Sydney, Australia

[env]
  NODE_ENV = 'production'
  PORT = '3000'
  HOSTNAME = '0.0.0.0'

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0       # Scales to zero when idle

[[vm]]
  memory = '512mb'
  cpu_kind = 'shared'
  cpus = 1
```

### Next.js Configuration (`next.config.js`)

- `output: 'standalone'` — self-contained for Docker
- `compress: true`
- `poweredByHeader: false`
- Images: AVIF + WebP, remote patterns allow any domain (`**`), SVG enabled with CSP sandbox
- Package optimization: `@supabase/supabase-js`

### Build & Run Commands

```bash
npm run dev     # Dev server on port 3002
npm run build   # Production build (standalone output)
npm run start   # Start production server
npm run lint    # ESLint
```

No test suite is configured.

---

## 17. External System Integrations

### Doubleclicker Auto-Onboard

- **Endpoint:** `POST {DOUBLECLICKER_API_URL}/api/strategy/auto-onboard`
- **Auth:** `x-provision-secret` header
- **Payload:** `{ username }`
- **Pattern:** Fire-and-forget. All config must be in DB first.
- **Result:** Triggers content pipeline → Stitch queue

### Stitch Background Worker

- **Communication:** DB-only (polls `stitch_queue` table every 15 seconds)
- **No HTTP API**
- **Env vars:** Not needed in this app (Stitch runs separately)

### Brand Provisioner Agent

- **Location:** `~/doubleclick-agent-writer-review` (separate repo)
- **Trigger:** `POST /api/agents/brand-review` on Doubleclicker
- **Purpose:** Validates and enriches `brand_guidelines` specificity after provisioning

### PostHog Analytics

- Client-side via `posthog-js`
- Configured via `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`

---

## 18. Pre-Launch Checklist

### Environment Variables

- [ ] `PROVISION_SECRET` — set and shared with Blog Cloner
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- [ ] `DOUBLECLICKER_API_URL` — Doubleclicker backend URL
- [ ] `FLY_API_TOKEN` — Fly.io API token with deploy permissions
- [ ] `FLY_ORG_SLUG` — Fly.io org slug
- [ ] `FLY_BASE_APP` — Base app name to clone image from
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` — Full GCP service account JSON
- [ ] `GOOGLE_CLOUD_PROJECT` — GCP project ID
- [ ] `GOOGLE_ANALYTICS_ACCOUNT_ID` — GA4 account ID
- [ ] `GOOGLE_TAG_MANAGER_ACCOUNT_ID` — GTM account ID
- [ ] `RESEND_API_KEY` — Resend email API key
- [ ] `RESEND_FROM_EMAIL` — Verified sender email
- [ ] `NOTIFICATION_EMAIL` — Admin notification email
- [ ] `FAL_API_KEY` — fal.ai for image generation (optional)

### Google Service Account Permissions

- [ ] GA4: Editor role on Analytics account
- [ ] GTM: **Admin-level** access at the account level (not just User/Edit)
- [ ] Search Console: Service account added as verified owner
- [ ] Cloud Domains: `roles/domains.admin` on GCP project
- [ ] Cloud DNS: `roles/dns.admin` on GCP project

### Fly.io Setup

- [ ] Base app (`FLY_BASE_APP`) has at least one running machine with the latest Docker image
- [ ] Fly org has billing configured for IP allocations
- [ ] `fly auth token` is valid and has deploy permissions

### Supabase Database

- [ ] All required tables exist (see Section 10)
- [ ] RLS policies allow service role key to read/write all tables
- [ ] Column names match expectations (`user_name` vs `username` per table)

### Doubleclicker Backend

- [ ] Auto-onboard endpoint is live and responding
- [ ] `PROVISION_SECRET` matches between this app and Doubleclicker
- [ ] Stitch worker is running and polling `stitch_queue`

### DNS / Domains

- [ ] GCP billing enabled for Cloud Domains purchases
- [ ] Cloud DNS API enabled in GCP project
- [ ] Domain Registrar API enabled in GCP project

### Email

- [ ] Resend sender domain verified
- [ ] `RESEND_FROM_EMAIL` matches a verified domain

### Admin UI

- [ ] `/admin/provision` accessible and functional
- [ ] `/admin/network` accessible for network provisioning
- [ ] `GET /api/admin/google-test?action=gtm-accounts` returns expected accounts
- [ ] `POST /api/admin/domain-suggestions` returns available domains

### Smoke Test

- [ ] Provision a test site with `skip_deploy=true` — verify DB seeding
- [ ] Provision a test site with full deploy — verify Fly app creation
- [ ] Verify the deployed site loads at `{username}-blog.fly.dev`
- [ ] Verify blog posts appear after Stitch processes the queue
- [ ] Test domain verification flow end-to-end
- [ ] Verify GA4 and GTM IDs appear in page source of deployed site
