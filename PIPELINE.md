# Blog Cloner — Full Pipeline Rundown

> Everything from "provision a new blog site" to "content appearing on a custom domain".
> Read top to bottom the first time, then use the section headers to jump around.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [The Three-App System](#2-the-three-app-system)
3. [Provisioning — The 6-Phase Flow](#3-provisioning--the-6-phase-flow)
4. [Domain Verification](#4-domain-verification)
5. [Multi-Tenancy — How One Codebase Serves Many Sites](#5-multi-tenancy--how-one-codebase-serves-many-sites)
6. [Content Display — How Articles Appear](#6-content-display--how-articles-appear)
7. [Lead Capture](#7-lead-capture)
8. [Email System](#8-email-system)
9. [SEO & Structured Data](#9-seo--structured-data)
10. [Fly.io API Integration](#10-flyio-api-integration)
11. [Frontend Pages & Routes](#11-frontend-pages--routes)
12. [API Endpoint Reference](#12-api-endpoint-reference)
13. [Database Tables Used](#13-database-tables-used)
14. [Environment Variables](#14-environment-variables)
15. [Deployment](#15-deployment)
16. [Timing & Performance](#16-timing--performance)
17. [FAQ / Likely Questions](#17-faq--likely-questions)

---

## 1. Architecture Overview

```
Caller (admin dashboard, script, etc.)
        │
        │  POST /api/provision
        │  Bearer: PROVISION_SECRET
        │  { username, display_name, domain, niche, product_url, ... }
        ▼
Blog Cloner (this app — Next.js 14)
        │
        ├─ Phase 1: Seed brand data into shared Supabase
        ├─ Phase 2: Call Doubleclicker auto-onboard (content pipeline)
        ├─ Phase 3: Deploy new Fly.io app (Docker)
        ├─ Phase 4: Add custom domain + TLS certificate
        ├─ Phase 5: Email user DNS records via Resend
        └─ Phase 6: Log provisioning event
        │
        ▼
New site live at: https://{username}-blog.fly.dev
Custom domain:    https://www.{domain} (after DNS setup)
```

**What this app does:**
- Provisions new branded blog sites on Fly.io
- Seeds brand/author data into the shared Supabase database
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

**This app only needs two values to talk to Doubleclicker:**

| Variable | Value |
| --- | --- |
| `DOUBLECLICKER_API_URL` | `https://doubleclicker.fly.dev` |
| `PROVISION_SECRET` | `provision-41e10c5215230ab1eae10acf3b42b836bc321b618e78fd9e` |

---

## 3. Provisioning — The 6-Phase Flow

**Endpoint:** `POST /api/provision`
**Auth:** `Bearer {PROVISION_SECRET}`

One API call provisions an entire site — brand data, content pipeline, Fly.io deployment, custom domain, and notification email.

### Input:

```json
{
  "username": "airfryer-reviews",
  "display_name": "Air Fryer Reviews",
  "website_url": "https://airfryer-reviews.com",
  "contact_email": "owner@example.com",
  "domain": "airfryer-reviews.com",
  "blurb": "Expert air fryer reviews and buying guides",
  "target_market": "Home cooks looking for healthier cooking",
  "brand_voice_tone": "Friendly, expert, conversational",
  "primary_color": "#ff6b35",
  "accent_color": "#004e89",
  "logo_url": "https://example.com/logo.png",
  "heading_font": "Inter",
  "body_font": "Open Sans",
  "author_name": "Sarah Kitchen",
  "author_bio": "Air fryer enthusiast and recipe developer",
  "author_image_url": "https://example.com/sarah.jpg",
  "product_url": "https://amazon.com/ninja-foodi",
  "niche": "kitchen appliances",
  "fly_region": "syd",
  "skip_pipeline": false,
  "skip_deploy": false
}
```

### Phase 1: Seed the shared database (~2s)

Upserts four tables with brand identity:

| Table | What gets seeded |
| --- | --- |
| `brand_guidelines` | Brand name, website URL, voice/tone, default author, author bio/image |
| `brand_specifications` | Primary/accent colors, logo URL, heading/body fonts |
| `company_information` | Website, email, blurb, target market |
| `authors` | Default author with name, bio, slug, profile image |

All upserts use `onConflict` to handle re-provisioning safely.

### Phase 2: Trigger Doubleclicker content pipeline (~1s to trigger, ~20–30 min to complete)

Calls `POST {DOUBLECLICKER_API_URL}/api/strategy/auto-onboard`:

```json
{
  "username": "airfryer-reviews",
  "displayName": "Air Fryer Reviews",
  "websiteUrl": "https://airfryer-reviews.com",
  "assignToEmail": "owner@example.com",
  "productUrl": "https://amazon.com/ninja-foodi",
  "niche": "kitchen appliances"
}
```

Doubleclicker then orchestrates the full chain:
1. Create workspace
2. Auto-generate brand profile from URL
3. Discover affiliate products
4. Discover keywords (DataForSEO)
5. Build topical map + content clusters
6. Create content schedule
7. Daily writer cron starts producing articles (5/day)
8. If `stitch_enabled=true`, queue Stitch video jobs

**This call returns immediately.** The content pipeline runs asynchronously in Doubleclicker.

Skipped if `skip_pipeline=true` or `DOUBLECLICKER_API_URL` not set.

### Phase 3: Deploy to Fly.io (~30–60s)

Creates a new Fly.io app and deploys the blog:

| Step | What happens |
| --- | --- |
| 1 | Get Docker image reference from base app (`FLY_BASE_APP`) |
| 2 | Create new app: `{username}-blog` |
| 3 | Set secrets via GraphQL: Supabase URL/keys, Resend API key |
| 4 | Allocate IPv4 + IPv6 addresses (required for custom domains) |
| 5 | Create machine with tenant-specific env vars |

**Machine env vars (what makes each site unique):**

```
NEXT_PUBLIC_BRAND_USERNAME=airfryer-reviews
NEXT_PUBLIC_SITE_URL=https://www.airfryer-reviews.com
NEXT_PUBLIC_SITE_NAME=Air Fryer Reviews
NEXT_PUBLIC_CONTACT_EMAIL=owner@example.com
```

**Machine specs:**
- Region: `syd` (configurable via `fly_region`)
- Memory: 512MB
- CPU: 1 shared vCPU
- Auto-stop: stops when idle, auto-starts on traffic

Skipped if `skip_deploy=true` or `FLY_API_TOKEN` not set.

### Phase 4: Custom domain + TLS certificate (~5s)

If a `domain` was provided and Phase 3 succeeded:

1. Request ACME certificate for `www.{domain}`
2. Request ACME certificate for `{domain}` (apex)
3. Build DNS records for the user:

```
Type   | Name | Value
-------|------|------
CNAME  | www  | {username}-blog.fly.dev
A      | @    | {allocated IPv4}
AAAA   | @    | {allocated IPv6}
```

### Phase 5: Email DNS setup instructions (~2s)

Sends an HTML email via Resend to the contact email containing:
- Link to the live Fly.io URL (`{username}-blog.fly.dev`)
- DNS records table (Type, Name, Value)
- "Verify Domain" button linking to `/api/provision/verify-domain`

### Phase 6: Log provisioning event (~1s)

Inserts into `analytics_events` table with full provisioning details.

### Response:

```json
{
  "success": true,
  "message": "Site provisioned for airfryer-reviews",
  "data": {
    "brand_guidelines": [...],
    "brand_specifications": [...],
    "company_information": [...],
    "author": [...]
  },
  "notifications": {
    "doubleclicker": { "status": "triggered" },
    "fly": { "status": "deployed", "app": "airfryer-reviews-blog", "url": "https://airfryer-reviews-blog.fly.dev" },
    "domain": { "status": "certificates_requested" },
    "email": { "status": "sent", "to": "owner@example.com" }
  },
  "fly": {
    "app": "airfryer-reviews-blog",
    "url": "https://airfryer-reviews-blog.fly.dev",
    "ipv4": "149.248.xxx.xxx",
    "ipv6": "2a09:xxx::xxx"
  },
  "dns_records": [
    { "type": "CNAME", "name": "www", "value": "airfryer-reviews-blog.fly.dev" },
    { "type": "A", "name": "@", "value": "149.248.xxx.xxx" },
    { "type": "AAAA", "name": "@", "value": "2a09:xxx::xxx" }
  ]
}
```

---

## 4. Domain Verification

**Endpoint:** `GET /api/provision/verify-domain?username={username}&domain={domain}`
**Auth:** None (public — linked from email)

After the user adds DNS records at their registrar:

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

## 5. Multi-Tenancy — How One Codebase Serves Many Sites

Every deployed site runs the **same Next.js codebase** (same Docker image). What makes each site unique is the environment variables set on its Fly.io machine:

```
NEXT_PUBLIC_BRAND_USERNAME  → filters all DB queries to this tenant
NEXT_PUBLIC_SITE_URL        → canonical URL, used in meta tags + sitemap
NEXT_PUBLIC_SITE_NAME       → displayed in header, footer, title tags
NEXT_PUBLIC_CONTACT_EMAIL   → shown on contact page, used for lead emails
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

## 6. Content Display — How Articles Appear

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

## 7. Lead Capture

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

## 8. Email System

All emails sent via **Resend** (`RESEND_API_KEY`).

| Event | Template | Recipient |
| --- | --- | --- |
| Site provisioned | DNS setup instructions + verification link | `contact_email` |
| Domain verified | "Your site is live!" with live URL | `contact_email` |
| Lead captured | Lead details in HTML table | Admin notification email |

All emails use inline-styled HTML (no template engine).

---

## 9. SEO & Structured Data

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

## 10. Fly.io API Integration

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

## 11. Frontend Pages & Routes

| Route | Type | Purpose |
| --- | --- | --- |
| `/` | SSR | Homepage — hero, about section, latest posts carousel |
| `/blog` | SSR | Blog listing with category filter and pagination |
| `/blog/[slug]` | SSR | Individual blog post with related posts, comments, JSON-LD |
| `/about` | Page | About page |
| `/contact` | Page | Contact form (lead capture) |
| `/privacy` | Page | Privacy policy |
| `/terms` | Page | Terms of service |

### Analytics:

- Google Analytics 4 (via `NEXT_PUBLIC_GA_ID`)
- Google Tag Manager (via `NEXT_PUBLIC_GTM_ID`)
- PostHog (optional, via `NEXT_PUBLIC_POSTHOG_KEY`)

Events tracked: `blog_view`, `blog_read_progress`, `blog_time_spent`, `cta_click`, `lead_capture`, `scroll_depth`, `form_submission`

---

## 12. API Endpoint Reference

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/provision` | Bearer token | Main provisioning endpoint (6 phases) |
| `GET` | `/api/provision/verify-domain` | None | Domain verification + TLS check |
| `GET` | `/api/blog` | None | Fetch published blog posts (query: limit, category) |
| `GET` | `/api/blog/categories` | None | Get all blog categories |
| `POST` | `/api/lead-capture` | None | Contact form submission |

---

## 13. Database Tables Used

This app reads and writes to the shared Supabase database.

### Written during provisioning (Phase 1):

| Table | Operation | Key fields |
| --- | --- | --- |
| `brand_guidelines` | Upsert | `user_name`, `name`, `website_url`, `brand_personality`, `default_author`, `author_bio` |
| `brand_specifications` | Upsert | `brand_guideline_id`, `user_name`, `primary_color`, `accent_color`, `logo_url`, fonts |
| `company_information` | Upsert | `username`, `client_website`, `email`, `blurb`, `target_market` |
| `authors` | Upsert | `user_name`, `name`, `bio`, `slug`, `profile_image_url` |
| `analytics_events` | Insert | `event_name`, `properties` (JSON) |

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

## 14. Environment Variables

### Required — provisioning

```
PROVISION_SECRET=provision-41e10c5215230ab1eae10acf3b42b836bc321b618e78fd9e
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
FLY_API_TOKEN=FlyV1 fm2_lJPE...
FLY_ORG_SLUG=personal
FLY_BASE_APP=doubledoubleclickclick
```

### Required — email

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@doubleclicker.app
```

### Per-site (set on each deployed machine)

```
NEXT_PUBLIC_BRAND_USERNAME=airfryer-reviews
NEXT_PUBLIC_SITE_URL=https://www.airfryer-reviews.com
NEXT_PUBLIC_SITE_NAME=Air Fryer Reviews
NEXT_PUBLIC_CONTACT_EMAIL=owner@example.com
```

### Optional — analytics

```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 15. Deployment

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

## 16. Timing & Performance

### Provisioning (total ~60–90s)

| Phase | Duration | Notes |
| --- | --- | --- |
| Phase 1: Seed database | ~2s | 4 upserts |
| Phase 2: Trigger Doubleclicker | ~1s | Fire-and-forget HTTP call |
| Phase 3: Deploy to Fly.io | ~30–60s | App create + secrets + IPs + machine |
| Phase 4: Add domain + TLS | ~5s | Certificate request (issuance is async) |
| Phase 5: Send email | ~2s | Resend API call |
| Phase 6: Log event | ~1s | DB insert |

### Content appearance:

- Doubleclicker strategy pipeline: ~20–30 min (runs in background after Phase 2)
- First articles: within 24 hours (daily writer cron runs 21:00–02:00 UTC, 5 articles/day)
- Articles visible immediately on the blog once published (SSR, no cache)

### DNS propagation:

- Typically 5–30 minutes
- User clicks verification link to check
- Certificate auto-issued once DNS resolves

---

## 17. FAQ / Likely Questions

**Q: What happens if I call provision twice for the same username?**
All database operations are upserts (`onConflict`), so re-provisioning is safe. The Fly.io app creation will fail on the second call (app already exists) — handle this gracefully in the caller.

**Q: Can I provision without deploying to Fly.io?**
Yes — pass `skip_deploy: true`. This seeds the database and triggers Doubleclicker but skips Fly.io deployment. Useful for testing the content pipeline.

**Q: Can I provision without triggering the content pipeline?**
Yes — pass `skip_pipeline: true`. This seeds the database and deploys the site but doesn't start content generation. Useful for testing deployment.

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
During provisioning, Fly.io ACME certificates are requested for both `www.{domain}` and `{domain}`. The user adds DNS records (CNAME for www, A/AAAA for apex). Once DNS propagates, Fly auto-issues the TLS cert. The middleware redirects apex → www for canonical URLs.
