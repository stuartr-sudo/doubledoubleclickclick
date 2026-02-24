# Blog Cloner — Full Pipeline Rundown

> Everything from "provision a new blog site" to "content appearing on a custom domain".
> Read top to bottom the first time, then use the section headers to jump around.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [The Three-App System](#2-the-three-app-system)
3. [Provisioning — The 9-Phase Flow](#3-provisioning--the-9-phase-flow)
4. [Admin Provisioning UI](#4-admin-provisioning-ui)
5. [Google Services Integration](#5-google-services-integration)
6. [Domain Lifecycle](#6-domain-lifecycle)
7. [Domain Verification](#7-domain-verification)
8. [Site Networks — Constellation Model](#8-site-networks--constellation-model)
9. [Cross-Site Linking — How It Works](#9-cross-site-linking--how-it-works)
10. [Multi-Tenancy — How One Codebase Serves Many Sites](#10-multi-tenancy--how-one-codebase-serves-many-sites)
11. [Content Display — How Articles Appear](#11-content-display--how-articles-appear)
12. [Lead Capture](#12-lead-capture)
13. [Email System](#13-email-system)
14. [SEO & Structured Data](#14-seo--structured-data)
15. [Fly.io API Integration](#15-flyio-api-integration)
16. [Frontend Pages & Routes](#16-frontend-pages--routes)
17. [API Endpoint Reference](#17-api-endpoint-reference)
18. [Database Tables Used](#18-database-tables-used)
19. [Environment Variables](#19-environment-variables)
20. [Deployment](#20-deployment)
21. [Timing & Performance](#21-timing--performance)
22. [FAQ / Likely Questions](#22-faq--likely-questions)

---

## 1. Architecture Overview

```
Admin UI (/admin/provision)
        │
        │  Enter niche, brand details, domain
        │  Toggle Google services (GA4, GTM, GSC)
        │  Approve discovered products
        ▼
Blog Cloner (this app — Next.js 14)
        │
        ├─ Phase 1: Seed brand data into shared Supabase
        ├─ Phase 2: Create Google services (GA4 property, GTM container)
        ├─ Phase 3: Call Doubleclicker auto-onboard (content pipeline)
        ├─ Phase 4: Purchase domain via Google Cloud Domains
        ├─ Phase 5: Deploy new Fly.io app (Docker)
        ├─ Phase 6: Add custom domain + TLS certificate
        ├─ Phase 7: Add to Google Search Console + DNS verification token
        ├─ Phase 8: Auto-configure DNS records via Cloud DNS
        └─ Phase 9: Email DNS records + log event
        │
        ▼
New site live at: https://{username}-blog.fly.dev
Custom domain:    https://www.{domain} (auto-configured if purchased)
```

**What this app does:**

- Provisions new branded blog sites on Fly.io (single sites or full networks)
- Seeds brand/author data into the shared Supabase database
- Creates Google Analytics, Tag Manager, and Search Console for each site
- Searches for and purchases domains via Google Cloud Domains
- Auto-configures DNS records (A, AAAA, CNAME, TXT) when domain is purchased
- Triggers Doubleclicker's content pipeline with network partner context
- Handles custom domains, TLS certificates, and DNS verification
- Serves the blog frontend (shared Next.js codebase, tenant-specific env vars)
- Orchestrates site network creation (niche expansion, parallel provisioning, cross-site linking)

**What this app does NOT do:**
- Write content (Doubleclicker does that)
- Generate videos (Stitch does that)
- Manage keywords, topical maps, or content schedules (Doubleclicker does that)
- Decide cross-site link placement (Doubleclicker's article writer does that)

---

## 2. The Three-App System

All three apps share one Supabase database: `uscmvlfleccbctuvhhcj.supabase.co`

```
Blog Cloner ──HTTP──▶ Doubleclicker ──shared DB──▶ Stitch
(provisioner)          (orchestrator)               (worker)
```

| App | Role | Tech | URL |
| --- | --- | --- | --- |
| **Blog Cloner** (this repo) | Provision sites, serve blog frontend | Next.js 14, TypeScript | `doubledoubleclickclick.fly.dev` |
| **Doubleclicker** | Content engine — keywords, articles, publishing | Express + React 18 | `doubleclicker.fly.dev` |
| **Stitch** | Video generation from articles | Express + React 18 | `stitch-app.fly.dev` |

**Communication:**
- Blog Cloner → Doubleclicker: `POST /api/strategy/auto-onboard` with `x-provision-secret` header
- Doubleclicker → Stitch: Shared `stitch_queue` table (no HTTP)
- Doubleclicker → Blog sites: Writes to `blog_posts` table, sites render via SSR

---

## 3. Provisioning — The 9-Phase Flow

**Endpoint:** `POST /api/provision`
**Auth:** `Bearer {PROVISION_SECRET}`

One API call provisions an entire site — brand data, Google services, content pipeline, domain purchase, Fly.io deployment, DNS configuration, and notification email.

### Input:

```json
{
  "username": "pure-glow-skincare",
  "display_name": "Pure Glow Skincare",
  "contact_email": "owner@example.com",
  "niche": "natural skincare",
  "website_url": "https://pureglow.com",
  "domain": "purenaturalskincare.com",
  "blurb": "Clean beauty and natural skincare products",
  "target_market": "Health-conscious consumers seeking clean beauty",
  "brand_voice_tone": "Warm, knowledgeable, trustworthy",
  "primary_color": "#2d5016",
  "accent_color": "#c8a951",
  "logo_url": "https://example.com/logo.png",
  "heading_font": "Playfair Display",
  "body_font": "Lato",
  "author_name": "Dr. Sarah Green",
  "author_bio": "Dermatologist and clean beauty advocate",
  "author_image_url": "https://example.com/sarah.jpg",
  "product_url": "https://amazon.com/natural-skincare",
  "seed_keywords": ["natural skincare", "organic moisturizer"],
  "image_style": "Clean, bright product photography with natural elements",
  "fly_region": "syd",
  "skip_pipeline": false,
  "skip_deploy": false,
  "setup_google_analytics": true,
  "setup_google_tag_manager": true,
  "setup_search_console": true,
  "purchase_domain": true,
  "domain_yearly_price": { "currencyCode": "USD", "units": "12" },
  "domain_notices": [],
  "approved_products": [
    { "name": "Vitamin C Serum", "url": "https://amazon.com/...", "description": "..." }
  ],
  "network_partners": [
    { "domain": "mindfulnutrition.com", "niche": "holistic nutrition" },
    { "domain": "homefitnesshub.com", "niche": "home fitness" }
  ]
}
```

**Niche-first mode:** `website_url` is optional. If only `niche` is provided, Doubleclicker researches the niche, discovers products, and generates content autonomously.

### Phase 1: Seed the shared database (~2s)

Inserts (select-first pattern) into four tables with brand identity:

| Table | What gets seeded |
| --- | --- |
| `brand_guidelines` | Brand name, website URL, voice/tone, default author, author bio/image, image style, seed keywords |
| `brand_specifications` | Primary/accent colors, logo URL, heading/body fonts |
| `company_information` | Website, email, blurb, target market |
| `authors` | Default author with name, bio, slug, profile image |

### Phase 2: Create Google services (~3s)

If `GOOGLE_SERVICE_ACCOUNT_JSON` is configured:

| Service | What happens | Output |
| --- | --- | --- |
| **GA4** | Creates property + web data stream | Measurement ID (`G-XXXXXXX`) |
| **GTM** | Creates web container | Public ID (`GTM-XXXXXXX`) |

The Measurement ID and GTM Public ID are passed as env vars to the Fly.io machine (`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`). The blog layout already renders GA4/GTM scripts when these are set.

Skipped if service account not configured or toggles are off.

### Phase 3: Trigger Doubleclicker content pipeline (~1s to trigger, ~20-30 min to complete)

Calls `POST {DOUBLECLICKER_API_URL}/api/strategy/auto-onboard`:

```json
{
  "username": "pure-glow-skincare",
  "displayName": "Pure Glow Skincare",
  "websiteUrl": "https://pureglow.com",
  "assignToEmail": "owner@example.com",
  "productUrl": "https://amazon.com/natural-skincare",
  "niche": "natural skincare",
  "approved_products": [
    { "name": "Vitamin C Serum", "url": "https://amazon.com/...", "description": "..." }
  ],
  "network_partners": [
    { "domain": "mindfulnutrition.com", "niche": "holistic nutrition" },
    { "domain": "homefitnesshub.com", "niche": "home fitness" }
  ]
}
```

Doubleclicker then orchestrates the full chain:
1. Create workspace
2. Store `network_partners` in `app_settings` table (for article writer)
3. Auto-generate brand profile from URL (or research niche if no URL)
4. Discover affiliate products (or use `approved_products` if provided)
5. Discover keywords (DataForSEO)
6. Build topical map + content clusters
7. Create content schedule
8. Daily writer cron starts producing articles (5/day) — with cross-site links if network partners exist
9. If `stitch_enabled=true`, queue Stitch video jobs

**This call returns immediately.** The content pipeline runs asynchronously in Doubleclicker.

Skipped if `skip_pipeline=true` or `DOUBLECLICKER_API_URL` not set.

### Phase 4: Purchase domain via Google Cloud Domains (~5s)

If `purchase_domain=true` and the domain was selected from suggestions:

1. Calls `registrations:register` on the Cloud Domains API
2. Domain contacts use `contact_email` with WHOIS privacy redaction
3. Returns a long-running operation — domain becomes ACTIVE within 1-2 minutes
4. Charges the billing account linked to the GCP project

Skipped if `purchase_domain=false`, service account not configured, or missing price data.

### Phase 5: Deploy to Fly.io (~30-60s)

Creates a new Fly.io app and deploys the blog:

| Step | What happens |
| --- | --- |
| 1 | Get Docker image reference from base app (`FLY_BASE_APP`) |
| 2 | Create new app: `{username}-blog` |
| 3 | Set secrets via GraphQL: Supabase URL/keys, Resend API key |
| 4 | Allocate IPv4 + IPv6 addresses (required for custom domains) |
| 5 | Create machine with tenant-specific env vars (including GA/GTM IDs) |

**Machine env vars (what makes each site unique):**

```
NEXT_PUBLIC_BRAND_USERNAME=pure-glow-skincare
NEXT_PUBLIC_SITE_URL=https://www.purenaturalskincare.com
NEXT_PUBLIC_SITE_NAME=Pure Glow Skincare
NEXT_PUBLIC_CONTACT_EMAIL=owner@example.com
NEXT_PUBLIC_GA_ID=G-XXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

Skipped if `skip_deploy=true` or `FLY_API_TOKEN` not set.

### Phase 6: Custom domain + TLS certificate (~5s)

If a `domain` was provided and Phase 5 succeeded:

1. Request ACME certificate for `www.{domain}`
2. Request ACME certificate for `{domain}` (apex)
3. Build DNS records:

```
Type   | Name | Value
-------|------|------
CNAME  | www  | {username}-blog.fly.dev
A      | @    | {allocated IPv4}
AAAA   | @    | {allocated IPv6}
```

### Phase 7: Google Search Console (~3s)

If `setup_search_console=true` and service account is configured:

1. Requests a DNS TXT verification token from the Site Verification API
2. Adds the site to Search Console (pre-verification)
3. Appends the TXT record to the DNS records list

After DNS propagates (or is auto-configured in Phase 8), call `verifySearchConsoleSite()` to complete verification.

### Phase 8: Auto-configure DNS via Cloud DNS (~3s)

**This is what removes you as a blocker.** If the domain was purchased via Cloud Domains (Phase 4):

1. Finds the Cloud DNS managed zone (auto-created by Cloud Domains)
2. Sets A record → Fly.io IPv4
3. Sets AAAA record → Fly.io IPv6
4. Sets CNAME `www` → `{username}-blog.fly.dev`
5. Sets TXT records (Search Console verification, etc.)

All records are set with 300s TTL. Existing records of the same type are replaced.

If the domain registration hasn't completed yet (takes 1-2 min), this phase is marked as "deferred" — the DNS records are included in the email for manual setup as a fallback.

**Skipped** if the domain was not purchased via Cloud Domains (user brought their own domain → they need to set DNS at their registrar).

### Phase 9: Email DNS records + log event (~3s)

- Sends an HTML email via Resend with DNS records table and "Verify Domain" button
- If DNS was auto-configured (Phase 8), the email serves as confirmation
- If DNS was not auto-configured, the email tells the user what to set at their registrar
- Logs the full provisioning event to `analytics_events` table

### Response:

```json
{
  "success": true,
  "message": "Site provisioned for pure-glow-skincare",
  "data": {
    "brand_guidelines": [...],
    "brand_specifications": [...],
    "company_information": [...],
    "author": [...]
  },
  "notifications": {
    "google_analytics": { "status": "created", "measurement_id": "G-XXXXXXX" },
    "google_tag_manager": { "status": "created", "public_id": "GTM-XXXXXXX" },
    "doubleclicker": { "status": "triggered" },
    "domain_purchase": { "status": "registration_pending", "domain": "purenaturalskincare.com" },
    "fly": { "status": "deployed", "app": "pure-glow-skincare-blog", "url": "https://pure-glow-skincare-blog.fly.dev" },
    "domain": { "status": "certificates_requested" },
    "search_console": { "status": "added", "verification_token": "google-site-verification=..." },
    "dns_auto_config": { "status": "configured", "records": [...] },
    "email": { "status": "sent" }
  },
  "fly": {
    "app": "pure-glow-skincare-blog",
    "url": "https://pure-glow-skincare-blog.fly.dev",
    "ipv4": "149.248.xxx.xxx",
    "ipv6": "2a09:xxx::xxx"
  },
  "google": {
    "ga_measurement_id": "G-XXXXXXX",
    "gtm_public_id": "GTM-XXXXXXX"
  },
  "dns_records": [
    { "type": "CNAME", "name": "www", "value": "pure-glow-skincare-blog.fly.dev" },
    { "type": "A", "name": "@", "value": "149.248.xxx.xxx" },
    { "type": "AAAA", "name": "@", "value": "2a09:xxx::xxx" },
    { "type": "TXT", "name": "@", "value": "google-site-verification=..." }
  ]
}
```

---

## 4. Admin Provisioning UI

**Route:** `/admin/provision`
**Auth:** Requires `PROVISION_SECRET` (entered in the UI)

A step-by-step wizard for provisioning new blog sites. Supports two modes:

### Niche-First Mode (no website URL)

1. Enter a niche (e.g., "natural skincare") → system researches and generates everything
2. "Generate Brand Profile from Niche" button calls Doubleclicker's enhance-brand endpoint
3. "Discover Products" button previews products DC will find for the niche
4. Domain suggestions pulled from Google Cloud Domains API

### Website Mode (has existing URL)

1. Enter the brand's existing website URL
2. "Generate All with AI" button scrapes the site and auto-fills brand profile
3. Manual product entry supported

### Wizard Sections (step-by-step navigation)

| Step | Section | Description |
| --- | --- | --- |
| 1 | Brand Profile | Niche, username, display name, website URL, brand voice, target market, blurb, seed keywords |
| 2 | Image Style | Default image generation style for article hero images |
| 3 | Products & Discovery | Manual product entry or niche-based auto-discovery with approval checkboxes |
| 4 | Appearance | Primary/accent colors, logo, heading/body fonts. "Suggest from Niche" for auto-palette |
| 5 | Author | Default author name, bio, profile image |
| 6 | Domain & Hosting | Domain field with suggestions from Cloud Domains, Fly.io region selector |
| 7 | Google Services | GA4, GTM, Search Console toggles (default: all on). Domain purchase confirmation |
| 8 | Launch | Contact email, skip_deploy/skip_pipeline toggles, Launch button |

### Pipeline Phases Sidebar

The sidebar shows real-time progress through all 9 provisioning phases with status indicators (pending, running, completed, failed, skipped).

### Domain Suggestions

Clicking "Suggest Domains" calls `POST /api/admin/domain-suggestions` with the niche and brand name. Returns available domains under $15/yr with pricing. Selecting a domain stores the full pricing data for the purchase step.

---

## 5. Google Services Integration

**Library:** `lib/google.ts`
**Auth:** GCP service account via `google-auth-library`

All Google management APIs use OAuth2 service account authentication. The service account credentials are stored in `GOOGLE_SERVICE_ACCOUNT_JSON`.

### Service Account Setup

| Service | Permission needed | How to grant |
| --- | --- | --- |
| GA4 | Editor on GA account | analytics.google.com → Admin → Account Access Management |
| GTM | **Admin** at account level | tagmanager.google.com → Admin → Account → User Management (NOT container-level — container permissions can't create new containers) |
| Search Console | (automatic) | SA becomes verified owner via API |
| Cloud Domains | `roles/domains.admin` | GCP IAM console |
| Cloud DNS | (included in Cloud Domains) | Managed zones auto-created on domain registration |

### Functions

| Function | API | Purpose |
| --- | --- | --- |
| `createGA4Property()` | Analytics Admin API | Create GA4 property + web data stream → returns Measurement ID |
| `listGTMAccounts()` | Tag Manager API | List GTM accounts visible to SA (diagnostic) |
| `listGTMContainers()` | Tag Manager API | List containers on configured account (diagnostic) |
| `createGTMContainer()` | Tag Manager API | Create GTM web container → returns Public ID |
| `addSearchConsoleSite()` | Site Verification + Webmasters API | Add site as `INET_DOMAIN` with `sc-domain:` prefix + get DNS TXT verification token |
| `verifySearchConsoleSite()` | Site Verification API | Complete verification after DNS propagates (uses `INET_DOMAIN` type) |
| `getRegistrationParams()` | Cloud Domains API | Get domain price/availability |
| `registerDomain()` | Cloud Domains API | Purchase a domain (charges GCP billing) |
| `getDnsZone()` | Cloud DNS API | Find the managed zone for a domain |
| `configureDnsRecords()` | Cloud DNS API | Set A, AAAA, CNAME, TXT records |

### Domain Search (Suggestions)

**Endpoint:** `POST /api/admin/domain-suggestions`

Takes `{ niche, brand_name }`, generates up to 5 search queries, calls Cloud Domains `searchDomains` for each, and returns available domains under $15/yr with full pricing data (needed for purchase).

### DNS Auto-Configuration Flow

When a domain is purchased via Cloud Domains:

```
Cloud Domains registers domain
        ↓
Cloud DNS managed zone auto-created
        ↓
Phase 8: configureDnsRecords() sets:
  - A     @ → Fly IPv4
  - AAAA  @ → Fly IPv6
  - CNAME www → {app}.fly.dev
  - TXT   @ → Search Console verification
        ↓
DNS propagates (5-30 min)
        ↓
Fly.io auto-issues TLS certificate
        ↓
Site live at https://www.{domain}
```

---

## 6. Domain Lifecycle

### Purchased via Cloud Domains (fully automated)

1. User selects domain from suggestions in the admin UI
2. Domain purchased in Phase 4
3. DNS records auto-configured in Phase 8
4. DNS propagates (5-30 min)
5. Fly.io auto-issues TLS certificate
6. Site live — no manual steps needed

### User-provided domain (manual DNS)

1. User enters their own domain in the admin UI
2. Fly.io certificates requested in Phase 6
3. DNS records emailed to user in Phase 9
4. User adds DNS records at their registrar
5. DNS propagates → certificate issues → site live

---

## 7. Domain Verification

**Endpoint:** `GET /api/provision/verify-domain?username={username}&domain={domain}`
**Auth:** None (public — linked from email)

After DNS records are configured (automatically or manually):

1. User clicks the verification link from the email
2. This endpoint checks the TLS certificate status via Fly API
3. **If certificate is issued (DNS propagated):**
   - Updates `brand_guidelines.website_url` to `https://www.{domain}`
   - Updates `company_information.client_website` to `https://www.{domain}`
   - Sends "Your site is live!" confirmation email via Resend
   - Returns `{ status: 'live', live_url: 'https://www.{domain}' }`
4. **If certificate not yet issued:**
   - Returns `{ status: 'pending' }` with DNS records for reference
   - User can retry in a few minutes

---

## 8. Site Networks — Constellation Model

A site network is a "constellation" of related-but-distinct niche sites that cross-reference each other to build collective authority. This is **not** a PBN — each site has genuine, deep content on its own niche. The interlinking is editorial and contextual.

### Concept

Given a single seed niche (e.g., "natural skincare"), AI expands it into 4-6 related niches that share an overlapping audience:

```
Seed: "natural skincare"
        ↓ AI expansion
┌──────────────────────────────────────────────────────────┐
│  naturalskincare.com     — skincare (seed site)          │
│  mindfulnutrition.com    — holistic nutrition             │
│  homefitnesshub.com      — home fitness                   │
│  sleepwelldaily.com      — sleep optimization             │
│  calmandclear.com        — mindful living / stress        │
└──────────────────────────────────────────────────────────┘
```

Each site covers a different niche, targets different keywords, promotes different affiliate products — but the audiences overlap. Cross-links between sites are editorially justified because the topics are genuinely related.

### Architecture (parallel, not overloaded)

The key design principle: **don't overload one Doubleclicker call with 5 niches**. Each site is fully independent and goes deep on its own niche. The only shared context is awareness of partner sites for cross-linking during article writing.

```
Blog Cloner Admin UI
        │
        │ 1. User enters seed niche
        │ 2. AI expands to 4-6 related niches
        │ 3. User reviews, toggles, picks domains
        │ 4. "Launch Network" button
        ▼
┌─── Parallel Provisioning ───────────────────────────┐
│                                                       │
│  Site A ──▶ Full 9-phase provision ──▶ DC onboard    │
│  Site B ──▶ Full 9-phase provision ──▶ DC onboard    │
│  Site C ──▶ Full 9-phase provision ──▶ DC onboard    │
│  Site D ──▶ Full 9-phase provision ──▶ DC onboard    │
│                                                       │
│  Each DC onboard receives network_partners payload    │
│  so the article writer knows about sibling sites      │
└───────────────────────────────────────────────────────┘
```

### Network Provisioning Flow

| Step | Where | What happens |
| --- | --- | --- |
| 1. Niche Expansion | Blog Cloner | Light AI call expands seed niche to 4-6 related niches with names + descriptions |
| 2. User Review | Blog Cloner Admin UI | User toggles sites on/off, edits brand names, selects domains per site |
| 3. Parallel Provision | Blog Cloner | Calls existing `POST /api/provision` for each site in parallel |
| 4. Parallel DC Onboard | Doubleclicker | Each site gets its own auto-onboard call with `network_partners` context |

### The `network_partners` Payload

Each Doubleclicker auto-onboard call includes a list of the other sites in the network:

```json
{
  "username": "mindful-nutrition",
  "niche": "holistic nutrition",
  "network_partners": [
    { "domain": "naturalskincare.com", "niche": "natural skincare" },
    { "domain": "homefitnesshub.com", "niche": "home fitness" },
    { "domain": "sleepwelldaily.com", "niche": "sleep optimization" },
    { "domain": "calmandclear.com", "niche": "mindful living" }
  ]
}
```

This payload is stored in the `app_settings` table (as `network_partners:{username}`) and read by the article writer during content generation. The research phase (keywords, products, topical map) is completely independent — only the writing phase uses network context.

### Database Tables

| Table | Fields | Purpose |
| --- | --- | --- |
| `site_networks` | `id`, `name`, `seed_niche`, `created_date` | Network metadata (e.g., "Wellness Circle") |
| `site_network_members` | `id`, `network_id`, `username`, `niche`, `domain`, `role` | Sites in the network (`role`: "seed" or "satellite") |
| `app_settings` | `setting_name`, `setting_value` | Stores `network_partners:{username}` as JSON for DC article writer |

### Admin UI Flow (planned)

1. Tab: "Create Network" (alongside existing "Create Site")
2. Enter seed niche → "Expand Network" button
3. AI returns 4-6 suggested niches with reasoning
4. User reviews: toggle on/off, edit brand names, select domains per site
5. Google services toggles (apply to all sites)
6. "Launch Network" button → provisions all sites in parallel
7. Network dashboard: view all sites, combined status, pipeline progress

### Not In Scope (future)

- Network-level analytics dashboard (combined GA4 view)
- Adding a site to an existing network after creation
- Removing a site from a network
- Cross-network linking (networks linking to other networks)

---

## 9. Cross-Site Linking — How It Works

Cross-site linking is the mechanism by which articles on one network site naturally reference and link to partner sites. This happens at the **writing** stage, not the strategy stage.

### How Doubleclicker Handles It

```
Article writing begins
        ↓
buildLinkingContext() fetches:
  1. Internal links (same site — required)
  2. Cross-hub links (same site, different hubs — required)
  3. Network partner sites (from app_settings — optional)
        ↓
buildSectionLinkingContext() distributes links:
  - Required links: internal + cross-hub (must be included)
  - Optional links: partner sites (max 1 per section, only if natural)
        ↓
sectionWriter prompt includes:
  - REQUIRED LINKS block (internal)
  - PARTNER SITE LINKS — OPTIONAL block (cross-site)
        ↓
Writer includes partner links only when editorially relevant
```

### Key Design Decisions

| Decision | Rationale |
| --- | --- |
| Partner links are **optional**, not required | Prevents forced/spammy links. The writer only uses them when the content naturally touches on the partner's topic |
| Max **1 partner link per section** | Keeps link density natural. A 5-section article might have 1-2 partner links total |
| Links are distributed across sections | `buildSectionLinkingContext()` spreads partner links evenly so they don't cluster |
| Natural anchor text | The prompt instructs the writer to "use natural anchor text that describes the partner's expertise" — no keyword-stuffed anchors |
| Cross-linking is a **writing** decision | The strategy phase (keywords, topical map, products) runs completely independently per site. Network awareness only matters when producing article content |

### Where the Code Lives (Doubleclicker)

| File | What it does |
| --- | --- |
| `api/strategy/auto-onboard.js` | Accepts `network_partners` param, stores in `app_settings` table |
| `api/openclaw-write-article.js` | Fetches partner sites in `buildLinkingContext()`, distributes in `buildSectionLinkingContext()` |
| `lib/prompts/sectionWriter.js` | Injects `PARTNER SITE LINKS — OPTIONAL` block into the writing prompt |

### Example Prompt Block

When writing an article on the "holistic nutrition" site, the section writer sees:

```
### PARTNER SITE LINKS — OPTIONAL
If the content naturally touches on any of these related topics, include a contextual outbound link.
- Only link when it adds genuine value for the reader — do NOT force these links.
- Use natural anchor text that describes the partner's expertise.
- Maximum 1 partner link per section. Skip if none fit naturally.

  - <a href="https://www.naturalskincare.com">natural skincare</a> — Partner site covering natural skincare
  - <a href="https://www.homefitnesshub.com">home fitness</a> — Partner site covering home fitness
```

---

## 10. Multi-Tenancy — How One Codebase Serves Many Sites

Every deployed site runs the **same Next.js codebase** (same Docker image). What makes each site unique is the environment variables set on its Fly.io machine:

```
NEXT_PUBLIC_BRAND_USERNAME  → filters all DB queries to this tenant
NEXT_PUBLIC_SITE_URL        → canonical URL, used in meta tags + sitemap
NEXT_PUBLIC_SITE_NAME       → displayed in header, footer, title tags
NEXT_PUBLIC_CONTACT_EMAIL   → shown on contact page, used for lead emails
NEXT_PUBLIC_GA_ID           → GA4 Measurement ID (auto-created per site)
NEXT_PUBLIC_GTM_ID          → GTM Public ID (auto-created per site)
```

### How it works:

1. `getTenantConfig()` in `lib/tenant.ts` reads these env vars
2. Every Supabase query includes `.eq('user_name', config.username)`
3. Brand guidelines, specifications, and posts are all filtered by tenant
4. The middleware forces canonical host: apex domain → `www.` redirect (308)

### Base app pattern:

The "base app" (`doubledoubleclickclick`) is a pre-built Next.js deployment. When provisioning a new site:
1. The base app's Docker image is read via `fly.getAppImage()`
2. A new Fly app is created with that same image
3. Different env vars make it a different site

This means deploying a code update to the base app automatically makes the new image available to all future provisioned sites. Existing sites keep their current image until manually updated.

---

## 11. Content Display — How Articles Appear

This app doesn't create content — it just displays it. Articles are written by Doubleclicker and published to the shared `blog_posts` table.

### Flow:

```
Doubleclicker writes article
        ↓
Inserts/updates blog_posts table (user_name = tenant username)
        ↓
Blog site renders via SSR (Next.js getPublishedPosts query)
        ↓
User sees article at /blog/{slug}
```

### Queries:

- **Blog listing** (`/blog`): `SELECT * FROM blog_posts WHERE user_name = ? AND status = 'published' ORDER BY published_date DESC`
- **Single post** (`/blog/[slug]`): `SELECT * FROM blog_posts WHERE user_name = ? AND slug = ? AND status = 'published'`
- **Categories** (`/api/blog/categories`): `SELECT DISTINCT category FROM blog_posts WHERE user_name = ?`

### Revalidation:

All blog queries use `revalidate: 0` (force-dynamic) — every page load gets fresh data. This means new articles appear immediately after Doubleclicker publishes them. No cache purging needed.

---

## 12. Lead Capture

**Endpoint:** `POST /api/lead-capture`

Handles contact form submissions from the blog frontend.

### Features:

- IP-based rate limiting (5-minute window per IP/source/email combo)
- Inserts into `leads` table with tenant's brand ID
- Sends HTML notification email to admin via Resend
- Returns success/failure to frontend

### Input:

```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "company": "ACME Corp",
  "website": "https://acme.com",
  "message": "Interested in your products",
  "source": "contact_page",
  "topic": "general"
}
```

---

## 13. Email System

All emails sent via **Resend** (`RESEND_API_KEY`).

| Event | Template | Recipient |
| --- | --- | --- |
| Site provisioned | DNS setup instructions + verification link | `contact_email` |
| Domain verified | "Your site is live!" with live URL | `contact_email` |
| Lead captured | Lead details in HTML table | Admin notification email |

All emails use inline-styled HTML (no template engine).

---

## 14. SEO & Structured Data

### Meta tags (per page):

- Canonical URL
- Open Graph (title, description, image, type)
- Twitter Card (summary_large_image)
- Robots (index, follow)

### JSON-LD schemas (blog posts):

- **Article** schema (author, publisher, datePublished, image)
- **BreadcrumbList** (Home > Blog > Article)
- **FAQPage** (if `generated_llm_schema` contains FAQ data)
- **Organization** schema (site-wide)

### Sitemaps:

| URL | Content |
| --- | --- |
| `/sitemap.xml` | Combined index |
| `/sitemap-pages.xml` | Static pages (home, about, contact, privacy, terms) |
| `/sitemap-blog.xml` | All published blog posts |
| `/robots.txt` | Standard robots.txt |

---

## 15. Fly.io API Integration

The `lib/fly.ts` module wraps two Fly APIs:

### Machines REST API (`https://api.machines.dev/v1`)

| Function | Endpoint | Purpose |
| --- | --- | --- |
| `createApp()` | `POST /apps` | Create new Fly app |
| `getAppImage()` | `GET /apps/{app}/machines` | Get Docker image from base app |
| `createMachine()` | `POST /apps/{app}/machines` | Deploy machine with env vars |
| `addCertificate()` | `POST /apps/{app}/certificates` | Request TLS cert for domain |
| `checkCertificate()` | `GET /apps/{app}/certificates/{hostname}` | Check cert issuance status |

### GraphQL API (`https://api.fly.io/graphql`)

| Function | Mutation | Purpose |
| --- | --- | --- |
| `setSecrets()` | `setSecrets` | Set encrypted secrets on app |
| `allocateIpv4()` | `allocateIpAddress` (v4) | Get dedicated IPv4 address |
| `allocateIpv6()` | `allocateIpAddress` (v6) | Get dedicated IPv6 address |

---

## 16. Frontend Pages & Routes

| Route | Type | Purpose |
| --- | --- | --- |
| `/` | SSR | Homepage — hero, about section, latest posts carousel |
| `/blog` | SSR | Blog listing with category filter and pagination |
| `/blog/[slug]` | SSR | Individual blog post with related posts, comments, JSON-LD |
| `/about` | Page | About page |
| `/contact` | Page | Contact form (lead capture) |
| `/privacy` | Page | Privacy policy |
| `/terms` | Page | Terms of service |
| `/admin/provision` | Page | Admin provisioning wizard (step-by-step) |

### Analytics:

- Google Analytics 4 (via `NEXT_PUBLIC_GA_ID` — auto-created per site)
- Google Tag Manager (via `NEXT_PUBLIC_GTM_ID` — auto-created per site)
- PostHog (optional, via `NEXT_PUBLIC_POSTHOG_KEY`)

Events tracked: `blog_view`, `blog_read_progress`, `blog_time_spent`, `cta_click`, `lead_capture`, `scroll_depth`, `form_submission`

---

## 17. API Endpoint Reference

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/provision` | Bearer token | Main provisioning endpoint (9 phases) |
| `GET` | `/api/provision/verify-domain` | None | Domain verification + TLS check |
| `POST` | `/api/admin/domain-suggestions` | None | Search available domains via Cloud Domains |
| `POST` | `/api/admin/dc-proxy` | None | Proxy to Doubleclicker API (enhance-brand, etc.) |
| `GET` | `/api/admin/pipeline-status` | None | Check Doubleclicker pipeline progress |
| `GET` | `/api/admin/google-test` | Bearer token | Diagnostic: test Google API access (`?action=gtm-accounts\|gtm-containers\|gtm-create`) |
| `GET` | `/api/admin/provision-secret` | None | Verify provision secret |
| `GET` | `/api/blog` | None | Fetch published blog posts (query: limit, category) |
| `GET` | `/api/blog/categories` | None | Get all blog categories |
| `POST` | `/api/lead-capture` | None | Contact form submission |

---

## 18. Database Tables Used

This app reads and writes to the shared Supabase database.

### Written during provisioning (Phase 1):

| Table | Operation | Key fields |
| --- | --- | --- |
| `brand_guidelines` | Select-first insert/update | `user_name`, `name`, `website_url`, `brand_personality`, `default_author`, `author_bio`, `image_style`, `seed_keywords` |
| `brand_specifications` | Select-first insert/update | `guideline_id`, `user_name`, `primary_color`, `accent_color`, `logo_url`, fonts |
| `company_information` | Select-first insert/update | `username`, `client_website`, `email`, `blurb`, `target_market` |
| `authors` | Select-first insert/update | `user_name`, `name`, `bio`, `slug`, `profile_image_url` |
| `analytics_events` | Insert | `event_name`, `properties` (JSON) |

**Note:** No unique constraints on `user_name` in these tables — must use select-first-then-insert/update pattern, NOT upsert. The `brand_specifications` FK column is `guideline_id` (not `brand_guideline_id`).

### Updated during domain verification:

| Table | Operation |
| --- | --- |
| `brand_guidelines` | Update `website_url` to live domain |
| `company_information` | Update `client_website` to live domain |

### Read for blog display:

| Table | Query |
| --- | --- |
| `blog_posts` | Published posts filtered by `user_name` |
| `brand_guidelines` | Brand name, author info |
| `brand_specifications` | Colors, fonts, logo |
| `authors` | Author details for blog posts |

### Written for leads:

| Table | Operation |
| --- | --- |
| `leads` | Insert (name, email, company, message, source, brand_id, ip_address) |

### Site networks

| Table | Operation | Key fields |
| --- | --- | --- |
| `site_networks` | Insert on network creation | `id`, `name`, `seed_niche`, `created_date` |
| `site_network_members` | Insert per site in network | `network_id`, `username`, `niche`, `domain`, `role` |
| `app_settings` | Insert/update by DC auto-onboard | `setting_name` = `network_partners:{username}`, `setting_value` = JSON array |

---

## 19. Environment Variables

### Required — provisioning

```
PROVISION_SECRET=provision-{secret}
DOUBLECLICKER_API_URL=https://doubleclicker.fly.dev
```

### Required — database

```
NEXT_PUBLIC_SUPABASE_URL=https://uscmvlfleccbctuvhhcj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Required — Fly.io deployment

```
FLY_API_TOKEN=FlyV1 fm2_...
FLY_ORG_SLUG=personal
FLY_BASE_APP=doubledoubleclickclick
```

### Required — email

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@doubleclicker.app
```

### Required — Google services

```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
GOOGLE_CLOUD_PROJECT=gen-lang-client-0071841353
GOOGLE_ANALYTICS_ACCOUNT_ID=379034639
GOOGLE_TAG_MANAGER_ACCOUNT_ID=6325445642
```

### Per-site (set on each deployed machine)

```
NEXT_PUBLIC_BRAND_USERNAME=pure-glow-skincare
NEXT_PUBLIC_SITE_URL=https://www.purenaturalskincare.com
NEXT_PUBLIC_SITE_NAME=Pure Glow Skincare
NEXT_PUBLIC_CONTACT_EMAIL=owner@example.com
NEXT_PUBLIC_GA_ID=G-XXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### Optional — analytics

```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 20. Deployment

### Base app (this repo)

```toml
app = 'doubledoubleclickclick'
primary_region = 'syd'

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = '512mb'
  cpu_kind = 'shared'
  cpus = 1
```

### Docker build (multi-stage):

```
Stage 1 (deps):    npm ci
Stage 2 (builder): npm run build (Next.js standalone output)
Stage 3 (runner):  node server.js as nextjs user
```

Base image: `node:20-alpine`

### Provisioned sites:

Each provisioned site gets its own Fly.io app (`{username}-blog`) using the same Docker image as the base app. The only difference is the environment variables.

### Updating all sites:

Currently, provisioned sites keep their Docker image at deploy time. To update:
- Deploy the base app with new code
- New sites automatically get the latest image
- Existing sites need manual image update (future: rolling update script)

---

## 21. Timing & Performance

### Provisioning (total ~60-90s)

| Phase | Duration | Notes |
| --- | --- | --- |
| Phase 1: Seed database | ~2s | 4 inserts/updates |
| Phase 2: Google services | ~3s | GA4 property + GTM container |
| Phase 3: Trigger Doubleclicker | ~1s | Fire-and-forget HTTP call |
| Phase 4: Domain purchase | ~5s | Cloud Domains registration (async completion) |
| Phase 5: Deploy to Fly.io | ~30-60s | App create + secrets + IPs + machine |
| Phase 6: Domain + TLS | ~5s | Certificate request (issuance is async) |
| Phase 7: Search Console | ~3s | Site verification token |
| Phase 8: Auto DNS | ~3s | Cloud DNS record configuration |
| Phase 9: Email + log | ~3s | Resend API + DB insert |

### Content appearance:

- Doubleclicker strategy pipeline: ~20-30 min (runs in background after Phase 3)
- First articles: within 24 hours (daily writer cron runs 21:00-02:00 UTC, 5 articles/day)
- Articles visible immediately on the blog once published (SSR, no cache)

### DNS propagation:

- Auto-configured (purchased domain): 5-30 minutes
- Manual (user's registrar): typically 5-30 minutes, can take up to 48 hours
- User clicks verification link to check
- Certificate auto-issued once DNS resolves

---

## 22. FAQ / Likely Questions

**Q: What happens if I call provision twice for the same username?**
Database operations use select-first-then-insert/update pattern, so re-provisioning is safe for the database. The Fly.io app creation will fail on the second call (app already exists) — handle this gracefully in the caller.

**Q: Can I provision without deploying to Fly.io?**
Yes — pass `skip_deploy: true`. This seeds the database and triggers Doubleclicker but skips Fly.io deployment. Useful for testing the content pipeline.

**Q: Can I provision without triggering the content pipeline?**
Yes — pass `skip_pipeline: true`. This seeds the database and deploys the site but doesn't start content generation. Useful for testing deployment.

**Q: Can I provision with just a niche and no website URL?**
Yes — this is the "niche-first" mode. Doubleclicker will research the niche, discover products, and generate content autonomously. The admin UI supports this workflow with "Generate from Niche" buttons.

**Q: Do I need to manually set up DNS for purchased domains?**
No. When you purchase a domain through the provisioning flow (Cloud Domains), DNS records are auto-configured via Cloud DNS in Phase 8. The entire flow from purchase to live site is automated.

**Q: Do I need to manually set up DNS for my own domains?**
Yes — if you bring your own domain (not purchased through Cloud Domains), you need to add the DNS records at your registrar. The records are emailed to you in Phase 9.

**Q: How do Google Analytics and Tag Manager get installed?**
During provisioning, GA4 properties and GTM containers are auto-created via the Google APIs. The Measurement ID (`G-XXXXXXX`) and GTM Public ID (`GTM-XXXXXXX`) are passed as env vars to the Fly.io machine. The blog layout already renders the GA4/GTM scripts when these env vars are present.

**Q: What if the Google service account isn't configured?**
Google services phases are skipped gracefully. The site still deploys and works — it just won't have GA4, GTM, Search Console, or domain purchase capabilities. The response includes `status: 'skipped'` with the reason.

**Q: How do I update an existing site's code?**
Deploy new code to the base app. For existing sites, you'd need to update the machine's image. Currently this is manual — a rolling update script is a future enhancement.

**Q: Where do blog posts come from?**
Doubleclicker writes them to the `blog_posts` table. This app just reads and displays them via SSR. No caching or polling needed — every page load queries fresh data.

**Q: What if Doubleclicker is down during provisioning?**
The provision endpoint catches the error and includes it in the response as `notifications.doubleclicker.status: 'error'`. The site still gets deployed and the database still gets seeded. You can trigger Doubleclicker manually later.

**Q: How does the site know which brand's content to show?**
The `NEXT_PUBLIC_BRAND_USERNAME` env var is set on each Fly.io machine. Every database query filters by this value. One codebase, many sites, each showing only their own content.

**Q: What's the base app vs provisioned apps?**
The base app (`doubledoubleclickclick`) is the canonical deployment of this repo. It serves as the image source for provisioned sites. Provisioned sites (`{username}-blog`) are clones with different env vars. They all run the same code.

**Q: How do custom domains work?**
During provisioning, Fly.io ACME certificates are requested for both `www.{domain}` and `{domain}`. If the domain was purchased via Cloud Domains, DNS is auto-configured. Otherwise, the user adds DNS records at their registrar. Once DNS propagates, Fly auto-issues the TLS cert. The middleware redirects apex → www for canonical URLs.

**Q: What is a site network?**
A constellation of related-but-distinct niche sites that cross-reference each other. Given a seed niche like "natural skincare", AI expands it to 4-6 related niches (holistic nutrition, home fitness, sleep optimization, etc.). Each site is independently provisioned and runs its own deep content pipeline. The only shared context is awareness of partner sites for cross-linking during article writing.

**Q: How does cross-site linking work?**
When Doubleclicker writes an article, it checks `app_settings` for `network_partners:{username}`. If partner sites exist, they're included as **optional** links in the writing prompt — max 1 per section, only when the content naturally touches on the partner's topic. The writer is explicitly instructed not to force links. This keeps link patterns natural and editorially justified.

**Q: Is this a PBN (Private Blog Network)?**
No. Each site has genuine, deep content on its own niche with its own keyword research, product discovery, and topical map. The cross-linking is contextual and editorial — the same kind of linking any network of related publications would do. Sites don't exist solely to link to each other.

**Q: Can I create a single site without a network?**
Yes — the existing "Create Site" flow is unchanged. Networks are an additional option ("Create Network" tab) for when you want to launch multiple related sites together. A single site can also receive `network_partners` later if it joins a network.

**Q: What if I pass `approved_products` during provisioning?**
Doubleclicker will use the approved products list instead of running its own product discovery. This is useful when you've already vetted products in the admin UI's "Discover Products" step and want to ensure specific products are promoted.
