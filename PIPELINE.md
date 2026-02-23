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
8. [Multi-Tenancy — How One Codebase Serves Many Sites](#8-multi-tenancy--how-one-codebase-serves-many-sites)
9. [Content Display — How Articles Appear](#9-content-display--how-articles-appear)
10. [Lead Capture](#10-lead-capture)
11. [Email System](#11-email-system)
12. [SEO & Structured Data](#12-seo--structured-data)
13. [Fly.io API Integration](#13-flyio-api-integration)
14. [Frontend Pages & Routes](#14-frontend-pages--routes)
15. [API Endpoint Reference](#15-api-endpoint-reference)
16. [Database Tables Used](#16-database-tables-used)
17. [Environment Variables](#17-environment-variables)
18. [Deployment](#18-deployment)
19. [Timing & Performance](#19-timing--performance)
20. [FAQ / Likely Questions](#20-faq--likely-questions)

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
- Provisions new branded blog sites on Fly.io
- Seeds brand/author data into the shared Supabase database
- Creates Google Analytics, Tag Manager, and Search Console for each site
- Searches for and purchases domains via Google Cloud Domains
- Auto-configures DNS records (A, AAAA, CNAME, TXT) when domain is purchased
- Triggers Doubleclicker's content pipeline
- Handles custom domains, TLS certificates, and DNS verification
- Serves the blog frontend (shared Next.js codebase, tenant-specific env vars)

**What this app does NOT do:**
- Write content (Doubleclicker does that)
- Generate videos (Stitch does that)
- Manage keywords, topical maps, or content schedules (Doubleclicker does that)

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
  "niche": "natural skincare"
}
```

Doubleclicker then orchestrates the full chain:
1. Create workspace
2. Auto-generate brand profile from URL (or research niche if no URL)
3. Discover affiliate products
4. Discover keywords (DataForSEO)
5. Build topical map + content clusters
6. Create content schedule
7. Daily writer cron starts producing articles (5/day)
8. If `stitch_enabled=true`, queue Stitch video jobs

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
| GTM | Edit Containers | tagmanager.google.com → Admin → User Management |
| Search Console | (automatic) | SA becomes verified owner via API |
| Cloud Domains | `roles/domains.admin` | GCP IAM console |
| Cloud DNS | (included in Cloud Domains) | Managed zones auto-created on domain registration |

### Functions

| Function | API | Purpose |
| --- | --- | --- |
| `createGA4Property()` | Analytics Admin API | Create GA4 property + web data stream → returns Measurement ID |
| `createGTMContainer()` | Tag Manager API | Create GTM web container → returns Public ID |
| `addSearchConsoleSite()` | Site Verification + Webmasters API | Add site + get DNS TXT verification token |
| `verifySearchConsoleSite()` | Site Verification API | Complete verification after DNS propagates |
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

## 8. Multi-Tenancy — How One Codebase Serves Many Sites

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

## 9. Content Display — How Articles Appear

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

## 10. Lead Capture

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

## 11. Email System

All emails sent via **Resend** (`RESEND_API_KEY`).

| Event | Template | Recipient |
| --- | --- | --- |
| Site provisioned | DNS setup instructions + verification link | `contact_email` |
| Domain verified | "Your site is live!" with live URL | `contact_email` |
| Lead captured | Lead details in HTML table | Admin notification email |

All emails use inline-styled HTML (no template engine).

---

## 12. SEO & Structured Data

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

## 13. Fly.io API Integration

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

## 14. Frontend Pages & Routes

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

## 15. API Endpoint Reference

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/provision` | Bearer token | Main provisioning endpoint (9 phases) |
| `GET` | `/api/provision/verify-domain` | None | Domain verification + TLS check |
| `POST` | `/api/admin/domain-suggestions` | None | Search available domains via Cloud Domains |
| `POST` | `/api/admin/dc-proxy` | None | Proxy to Doubleclicker API (enhance-brand, etc.) |
| `GET` | `/api/admin/pipeline-status` | None | Check Doubleclicker pipeline progress |
| `GET` | `/api/admin/provision-secret` | None | Verify provision secret |
| `GET` | `/api/blog` | None | Fetch published blog posts (query: limit, category) |
| `GET` | `/api/blog/categories` | None | Get all blog categories |
| `POST` | `/api/lead-capture` | None | Contact form submission |

---

## 16. Database Tables Used

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

---

## 17. Environment Variables

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

## 18. Deployment

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

## 19. Timing & Performance

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

## 20. FAQ / Likely Questions

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
