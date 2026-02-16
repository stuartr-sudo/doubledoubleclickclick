# Doubleclicker — Full System Guide (Go-Live Reference)

**Version:** 1.0  
**Generated:** 2026-02-15  
**Template repo:** `doubleclicker-1`  
**Live clone example:** Modern Longevity (`modernlongevity.io`)

> This is the single-source-of-truth document for running, cloning, and operating this system. Nothing is assumed. Every route, table, env var, and integration is listed.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Environment Variables (Complete)](#4-environment-variables-complete)
5. [Database Schema (All Tables)](#5-database-schema-all-tables)
6. [Supabase Clients (How DB Access Works)](#6-supabase-clients-how-db-access-works)
7. [Frontend Pages (Every Route)](#7-frontend-pages-every-route)
8. [API Endpoints (Every Route)](#8-api-endpoints-every-route)
9. [Admin Panel](#9-admin-panel)
10. [Authentication System](#10-authentication-system)
11. [Blog System (Full Lifecycle)](#11-blog-system-full-lifecycle)
12. [Lead Capture & Contact System](#12-lead-capture--contact-system)
13. [Newsletter Subscription](#13-newsletter-subscription)
14. [Email Notifications (Resend)](#14-email-notifications-resend)
15. [Analytics & Tracking](#15-analytics--tracking)
16. [SEO System](#16-seo-system)
17. [Middleware & Redirects](#17-middleware--redirects)
18. [Security](#18-security)
19. [Image Handling](#19-image-handling)
20. [Homepage CMS](#20-homepage-cms)
21. [Components Reference](#21-components-reference)
22. [Scripts & Tooling](#22-scripts--tooling)
23. [Deployment (Vercel)](#23-deployment-vercel)
24. [Cloning to a New Site](#24-cloning-to-a-new-site)
25. [Go-Live Checklist](#25-go-live-checklist)
26. [Known Hardcoded Values to Update Per Clone](#26-known-hardcoded-values-to-update-per-clone)
27. [Troubleshooting](#27-troubleshooting)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     VERCEL (Hosting)                     │
│                                                         │
│  Next.js 14 App Router (SSR + Client Components)        │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │  Pages     │  │  API      │  │  Middleware           │ │
│  │  (SSR)     │  │  Routes   │  │  (Canonical redirect, │ │
│  │            │  │  /api/*   │  │   legacy 301/410)     │ │
│  └─────┬─────┘  └─────┬────┘  └──────────────────────┘ │
│        │              │                                  │
└────────┼──────────────┼──────────────────────────────────┘
         │              │
         ▼              ▼
┌─────────────────────────────────────────┐
│           SUPABASE (Database + Storage)  │
│                                         │
│  PostgreSQL                              │
│  ├── homepage_content (CMS)              │
│  ├── site_posts (blog)                   │
│  ├── blog_categories                     │
│  ├── authors                             │
│  ├── lead_captures                       │
│  ├── newsletter_subscribers              │
│  ├── apply_to_work_with_us               │
│  ├── cta_conversions                     │
│  ├── admin_users                         │
│  ├── admin_sessions                      │
│  └── landing_pages                       │
│                                         │
│  Storage                                 │
│  └── images bucket (blog-images/*)       │
└─────────────────────────────────────────┘

┌────────────────────┐  ┌──────────────────┐
│  RESEND (Email)    │  │  GOOGLE (GA/GTM)  │
│  Lead notify,      │  │  Analytics,        │
│  Apply notify      │  │  Consent mode      │
└────────────────────┘  └──────────────────┘

┌────────────────────┐  ┌──────────────────┐
│  POSTHOG (optional)│  │  GEMINI AI        │
│  Product analytics │  │  Brand name gen,  │
│                    │  │  text enhance     │
└────────────────────┘  └──────────────────┘
```

**Data flow for blog publishing:**
External pipeline → `POST /api/blog` (with `postId`) → Upsert into `site_posts` → SSR reads from `site_posts` → User sees post.

**Data flow for leads:**
User fills form → `POST /api/lead-capture` → Insert into `lead_captures` + Email via Resend → Admin sees lead in `/admin/leads`.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 14.2.x |
| **Language** | TypeScript | 5.3.x |
| **React** | React + React DOM | 18.3.x |
| **Database** | Supabase (PostgreSQL) | Hosted |
| **ORM/Client** | @supabase/supabase-js + @supabase/ssr | 2.39.x / 0.7.x |
| **Email** | Resend | 6.5.x |
| **AI** | @google/generative-ai (Gemini) | 0.24.x |
| **Animation** | Framer Motion | 12.23.x |
| **Analytics** | PostHog (optional) | 1.290.x |
| **Auth** | Custom (bcryptjs sessions) | - |
| **Hosting** | Vercel | - |
| **CSS** | Vanilla CSS (globals.css, ~6800 lines) | - |
| **Font** | Inter (Google Fonts, next/font) | - |

---

## 3. Repository Structure

```
doubleclicker-1/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Inter font, GTM, Analytics, Footer)
│   ├── page.tsx                  # Homepage (SSR, fetches homepage_content + posts)
│   ├── HomePageClient.tsx        # Client-side homepage (1300 lines, full CMS-driven)
│   ├── globals.css               # ALL styles (~6800 lines, no Tailwind)
│   ├── not-found.tsx             # 404 page
│   ├── robots.ts                 # robots.txt generation
│   ├── about/page.tsx            # About page (fetches author + posts)
│   ├── blog/
│   │   ├── page.tsx              # Blog listing (all published posts)
│   │   └── [slug]/page.tsx       # Individual blog post (SEO metadata, JSON-LD)
│   ├── contact/
│   │   ├── page.tsx              # Contact form
│   │   └── layout.tsx            # Contact layout
│   ├── admin/
│   │   ├── page.tsx              # Admin dashboard (protected)
│   │   ├── layout.tsx            # Admin layout
│   │   ├── login/page.tsx        # Admin login page
│   │   ├── AdminPageWrapper.tsx  # Admin dashboard UI
│   │   ├── homepage/page.tsx     # Homepage CMS editor
│   │   ├── leads/page.tsx        # Leads viewer
│   │   ├── authors/              # Authors CRUD
│   │   ├── new/                  # New post editor
│   │   └── edit/[id]/            # Edit post editor
│   ├── privacy/page.tsx          # Privacy policy
│   ├── terms/page.tsx            # Terms of service
│   ├── shipping/page.tsx         # Service delivery & returns
│   ├── setup/                    # Site setup wizard (clone tooling)
│   ├── sitemap.xml/route.ts      # Sitemap index
│   ├── sitemap-pages.xml/route.ts
│   ├── sitemap-services.xml/route.ts
│   ├── sitemap-blog.xml/route.ts # Dynamic blog sitemap
│   └── api/                      # API routes (see section 8)
│
├── components/                   # Shared React components
│   ├── SiteHeader.tsx            # Header (logo, nav, CTA)
│   ├── Footer.tsx                # Footer (links, legal, contact)
│   ├── MobileMenu.tsx            # Mobile hamburger menu
│   ├── Analytics.tsx             # GA4 + PostHog init
│   ├── CookieConsent.tsx         # GDPR cookie banner
│   ├── StructuredData.tsx        # Global JSON-LD schema
│   ├── ContactForm.tsx           # Reusable contact form component
│   ├── BlogCarousel.tsx          # Blog post carousel
│   ├── BlogTracker.tsx           # Blog view analytics tracker
│   ├── BlogQuizCTA.tsx           # Quiz CTA in blog posts
│   ├── ArticleReactions.tsx      # Article reaction UI
│   ├── ArticleComments.tsx       # Article comments UI
│   ├── RelatedPosts.tsx          # Related posts component
│   ├── SubscribeHero.tsx         # Newsletter subscribe section
│   ├── HowItWorks.tsx            # How it works section
│   ├── ParticleAnimation.tsx     # Background particle animation
│   ├── QuestionsDiscovery.tsx    # Questions discovery feature
│   ├── ImageUpload.tsx           # Admin image upload component
│   ├── TextEnhancer.tsx          # AI text enhancement component
│   ├── AdminAuthCheck.tsx        # Auth check wrapper
│   └── AdminProtected.tsx        # Route protection wrapper
│
├── lib/                          # Shared utilities
│   ├── auth.ts                   # Admin auth (bcrypt, sessions, cookies)
│   ├── analytics.ts              # GA4 event tracking helpers
│   ├── spam-protection.ts        # Rate limiting + email dedup
│   └── supabase/
│       ├── server.ts             # SSR Supabase client (anon key, cookie-based)
│       ├── service.ts            # Service role client (bypasses RLS)
│       ├── admin.ts              # Service role client (admin auth tables)
│       ├── browser.ts            # Browser Supabase client
│       └── client.ts             # Generic client helper
│
├── scripts/                      # CLI tooling
│   ├── setup-new-site.js         # Interactive site setup wizard
│   ├── validate-clone.js         # Post-clone validation
│   ├── clone-blog-auto.js        # Automated clone creation
│   ├── seed-modernlongevity-homepage.js  # Seed homepage for ML clone
│   ├── generate-admin-hash.js    # Generate bcrypt password hash
│   ├── run-all-migrations.sh     # Run all SQL migrations
│   ├── run-migration.js          # Run a single migration
│   └── fix-duplicate-faq-schema.js
│
├── supabase/
│   ├── COMPLETE_SETUP.sql        # Full DB setup in one file
│   └── migrations/               # 43 incremental SQL migrations
│
├── docs/                         # Documentation
│   ├── FULL_SYSTEM_GUIDE.md      # THIS FILE
│   ├── CLONE_CHECKLIST.md        # Step-by-step clone guide
│   ├── CLONE_PROFILE_TEMPLATE.json
│   ├── MODERNLONGEVITY_*.md      # Clone-specific docs
│   ├── STITCH_INTEGRATION.md
│   ├── PLAN_LEAD_MAGNET_PER_SITE.md
│   └── INVESTMENT_PITCH_PIPELINE.md
│
├── public/                       # Static assets
│   ├── favicon.svg
│   └── apple-touch-icon.png
│
├── middleware.ts                  # Canonical host redirect + legacy URL handling
├── next.config.js                # Next.js config (images, optimization)
├── vercel.json                   # Vercel config (region, security headers)
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
└── .env.local                    # Environment variables (NOT committed)
```

---

## 4. Environment Variables (Complete)

### Required for site to function

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, bypasses RLS) | `eyJhbG...` |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL | `https://www.modernlongevity.io` |
| `RESEND_API_KEY` | Resend email API key | `re_XXXXXXX` |

### Required for clone branding

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_BLOG_TITLE` | Blog page heading | `Blog` |
| `NEXT_PUBLIC_SITE_NAME` | Site name in metadata | `Modern Longevity` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact page email | `contact@modernlongevity.io` |
| `NEXT_PUBLIC_CONTACT_PHONE` | Contact page phone (optional) | `+1 555-123-4567` |

### Optional integrations

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics key | `phc_XXXXX` |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host | `https://app.posthog.com` |
| `GEMINI_API_KEY` | Google Gemini AI key (brand name gen, text enhance) | `AIzaSy...` |
| `DATAFORSEO_USERNAME` | DataForSEO API (Questions Discovery) | `user@example.com` |
| `DATAFORSEO_PASSWORD` | DataForSEO API password | `xxxxx` |
| `GITHUB_TOKEN` | GitHub API (clone automation) | `ghp_XXXXX` |
| `VERCEL_TOKEN` | Vercel API (clone automation) | `xxxxx` |
| `VERCEL_TEAM_ID` | Vercel team (optional) | `team_xxxxx` |

### Analytics (hardcoded in source — update per clone)

| Location | What | Current Value |
|----------|------|---------------|
| `components/Analytics.tsx` line 7 | GA4 Measurement ID | `G-TT58X7D8RV` |
| `app/layout.tsx` line 73 | GTM Container ID | `GTM-M4RMX5TG` |

**Action:** For a new clone, update these hardcoded IDs or make them env-var driven.

---

## 5. Database Schema (All Tables)

### Core tables

#### `homepage_content` — CMS-driven homepage
Single row. Drives the entire homepage layout.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid PK | - |
| `logo_text` | text | Header logo text |
| `logo_image` | text | Header logo image URL |
| `hero_title` | text | Hero section title |
| `hero_description` | text | Hero section description |
| `hero_image` | text | Hero image URL |
| `hero_background_image` | text | Hero background image |
| `hero_cta_text` | text | Hero CTA button text |
| `hero_cta_link` | text | Hero CTA button link |
| `hero_cta_bg_color` | text | CTA background color |
| `hero_cta_text_color` | text | CTA text color |
| `about_title` | text | About section title |
| `about_description` | text | About section description |
| `about_image` | text | About section image |
| `blog_grid_title` | text | Blog section heading |
| `blog_section_visible` | boolean | Show/hide blog section |
| `quiz_*` | various | Quiz CTA styling fields |
| `services` | jsonb | Services section data |
| `programs` | jsonb | Programs section data |
| `pricing_tiers` | jsonb | Pricing section data |
| `outcomes` | jsonb | Outcomes section data |
| `faq_items` | jsonb | FAQ section data |
| `why_work_with_us` | jsonb | Why work with us section |
| `proof_results` | jsonb | Proof/results section |
| `testimonials` | jsonb | Testimonials section |
| `how_it_works` | jsonb | How it works section |
| `tech_carousel_items` | jsonb | Tech carousel items |
| `created_at` | timestamptz | - |
| `updated_at` | timestamptz | - |

#### `site_posts` — Blog posts (THE authoritative table)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid PK | Internal ID |
| `external_id` | text UNIQUE | External pipeline ID (postId in API) |
| `title` | text NOT NULL | Post title (displayed on page) |
| `slug` | text NOT NULL UNIQUE | URL slug |
| `content` | text NOT NULL | HTML body content |
| `excerpt` | text | Short summary |
| `featured_image` | text | Featured image URL |
| `category` | text | Post category |
| `tags` | jsonb | Array of tag strings |
| `author` | text | Author name |
| `status` | text | `published` or `draft` |
| `meta_title` | text | SEO title (for `<title>` tag) |
| `meta_description` | text | SEO description |
| `focus_keyword` | text | Primary keyword |
| `generated_llm_schema` | text | JSON-LD structured data |
| `export_seo_as_tags` | boolean | - |
| `is_popular` | boolean | Sticky/popular flag |
| `user_name` | text | Site identifier |
| `created_date` | timestamptz | - |
| `updated_date` | timestamptz | - |
| `published_date` | timestamptz | - |

**CRITICAL:** The system uses `site_posts` exclusively. Never use `blog_posts` (legacy).

#### `blog_categories`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid PK | - |
| `name` | text | Category name |
| `slug` | text | URL slug |
| `username` | text | Site identifier |
| `fields` | jsonb | Custom fields |

#### `authors`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid PK | - |
| `slug` | text UNIQUE | URL slug |
| `name` | text | Display name |
| `bio` | text | Author bio |
| `avatar_url` | text | Avatar image URL |
| `linkedin_url` | text | LinkedIn profile |
| `created_at` | timestamptz | - |
| `updated_at` | timestamptz | - |

#### `lead_captures`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid PK | - |
| `name` | text | Contact name |
| `email` | text | Contact email |
| `company` | text | Company name |
| `website` | text | Website URL |
| `message` | text | Message body |
| `plan_type` | text | Selected plan |
| `source` | text | Form source identifier |
| `topic` | text | Contact topic |
| `ip_address` | text | Submitter IP |
| `created_at` | timestamptz | - |

#### `newsletter_subscribers`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid PK | - |
| `email` | text UNIQUE | Subscriber email |
| `source` | text | Signup source |
| `created_at` | timestamptz | - |

#### `apply_to_work_with_us`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid PK | - |
| `company_name` | text | Company |
| `contact_name` | text | Contact person |
| `email_address` | text | Email |
| `website_url` | text | Website |
| `company_description` | text | Description |
| `current_challenges` | text | Challenges |
| `goals` | text | Goals |
| `ip_address` | text | IP |
| `created_at` | timestamptz | - |

#### `admin_users` — Admin authentication

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid PK | - |
| `username` | text UNIQUE | Login username |
| `password_hash` | text | bcrypt hash |
| `last_login` | timestamptz | - |
| `created_at` | timestamptz | - |

#### `admin_sessions` — Session tokens

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid PK | - |
| `admin_id` | uuid FK | References admin_users |
| `session_token` | text UNIQUE | UUID session token |
| `expires_at` | timestamptz | Expiry (30 days) |
| `created_at` | timestamptz | - |

#### Other tables

| Table | Purpose |
|-------|---------|
| `cta_conversions` | CTA click tracking |
| `landing_pages` | Dynamic landing page content |

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

| Table | Public | Service Role |
|-------|--------|-------------|
| `homepage_content` | SELECT (read) | ALL (full access) |
| `site_posts` | SELECT where status='published' | ALL |
| `newsletter_subscribers` | INSERT only | SELECT |
| `lead_captures` | INSERT only | SELECT |
| `cta_conversions` | INSERT only | - |
| `authors` | SELECT | ALL |
| `admin_users` | None | ALL |
| `admin_sessions` | None | ALL |

---

## 6. Supabase Clients (How DB Access Works)

| Client | File | Key Used | Purpose |
|--------|------|----------|---------|
| **Server (SSR)** | `lib/supabase/server.ts` | Anon key + cookies | Page-level data fetching (respects RLS) |
| **Service** | `lib/supabase/service.ts` | Service role key | API routes that write data (bypasses RLS) |
| **Admin** | `lib/supabase/admin.ts` | Service role key | Admin auth operations only |
| **Browser** | `lib/supabase/browser.ts` | Anon key | Client-side operations |

**Rule:** Public read operations use the anon key (SSR client). Write operations (blog API, lead capture, admin) use the service role key.

---

## 7. Frontend Pages (Every Route)

| Route | File | Rendering | Purpose |
|-------|------|-----------|---------|
| `/` | `app/page.tsx` + `HomePageClient.tsx` | SSR + Client | Homepage (Hero, About, Blog grid) |
| `/blog` | `app/blog/page.tsx` | SSR | Blog listing (all published posts, category filter) |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` | SSR | Individual blog post (full content, JSON-LD, reactions, comments, related) |
| `/about` | `app/about/page.tsx` | SSR | About page (mission, founder bio from `authors` table) |
| `/contact` | `app/contact/page.tsx` | Client | Contact form (name, email, message → `lead_captures`) |
| `/admin` | `app/admin/page.tsx` | Client | Admin dashboard (protected) |
| `/admin/login` | `app/admin/login/page.tsx` | Client | Admin login form |
| `/admin/homepage` | `app/admin/homepage/page.tsx` | Client | Homepage CMS editor (protected) |
| `/admin/leads` | `app/admin/leads/page.tsx` | Client | Lead captures viewer (protected) |
| `/admin/new` | `app/admin/new/page.tsx` | Client | New blog post editor (protected) |
| `/admin/edit/[id]` | `app/admin/edit/[id]/page.tsx` | Client | Edit blog post (protected) |
| `/admin/authors` | `app/admin/authors/page.tsx` | Client | Author management (protected) |
| `/admin/authors/[slug]` | `app/admin/authors/[slug]/page.tsx` | Client | Edit author (protected) |
| `/privacy` | `app/privacy/page.tsx` | Static | Privacy policy |
| `/terms` | `app/terms/page.tsx` | Static | Terms of service |
| `/shipping` | `app/shipping/page.tsx` | Static | Service delivery & returns |
| `/setup` | `app/setup/page.tsx` | Client | Site setup wizard |
| `/setup/auto` | `app/setup/auto/page.tsx` | Client | Automated setup |
| `/sitemap.xml` | `app/sitemap.xml/route.ts` | Dynamic | Sitemap index |
| `/sitemap-pages.xml` | Route handler | Dynamic | Pages sitemap |
| `/sitemap-services.xml` | Route handler | Dynamic | Services sitemap |
| `/sitemap-blog.xml` | Route handler | Dynamic | Blog posts sitemap (from DB) |
| `/robots.txt` | `app/robots.ts` | Dynamic | robots.txt |

---

## 8. API Endpoints (Every Route)

### Blog

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `GET` | `/api/blog` | List all published posts (from `site_posts`) | None |
| `GET` | `/api/blog?category=X&limit=N` | Filter by category, limit results | None |
| `POST` | `/api/blog` | Create/update/unpublish post (upsert on `external_id`) | None (service role key in server) |
| `GET` | `/api/blog/[id]` | Get single post by UUID | None |
| `PUT` | `/api/blog/[id]` | Update post by UUID | None |
| `DELETE` | `/api/blog/[id]` | Delete post by UUID | None |
| `GET` | `/api/blog/debug` | Debug endpoint | None |

**Blog POST payload:**

```json
{
  "postId": "unique-id (REQUIRED)",
  "title": "Post Title (REQUIRED for publish)",
  "content": "<h2>HTML</h2> (REQUIRED for publish)",
  "slug": "auto-generated-if-omitted",
  "status": "published (default) or draft (deletes post)",
  "category": "Category Name",
  "tags": ["tag1", "tag2"],
  "author": "Author Name",
  "featured_image": "https://...",
  "excerpt": "Short summary",
  "meta_title": "SEO title",
  "meta_description": "SEO description",
  "focus_keyword": "primary keyword",
  "generated_llm_schema": "{JSON-LD string}",
  "user_name": "Site identifier"
}
```

**Upsert logic:** Uses `external_id` (from `postId`) as the conflict key. Same `postId` = update; new `postId` = insert.

**Unpublish:** Send `{ "postId": "xxx", "status": "draft" }` — this **deletes** the row from `site_posts`.

### Categories

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `GET` | `/api/blog/categories` | List all category names | None |
| `POST` | `/api/blog/categories` | Create category `{"name": "X"}` | None |

### Homepage

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `GET` | `/api/homepage` | Get homepage CMS content | None |
| `POST` | `/api/homepage` | Create/update homepage content | None |

### Lead Capture

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `POST` | `/api/lead-capture` | Submit lead (contact form, etc.) | None |

**Payload:** `name`, `email` (required), `company`, `website`, `message`, `plan_type`, `source`, `topic`

**Features:**
- Rate limiting (5-minute window per IP+email combo)
- Email deduplication (global, across all sources)
- Email notification via Resend on success
- IP address tracking

### Apply to Work With Us

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `POST` | `/api/apply-to-work-with-us` | Business application form | None |

**Payload:** `company_name`, `contact_name`, `email_address` (all required), `website_url`, `company_description`, `current_challenges`, `goals`

### Newsletter

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `POST` | `/api/subscribe` | Subscribe to newsletter | None |

**Payload:** `email` (required), `source`

### Authors

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `GET` | `/api/authors` | List all authors | None |
| `POST` | `/api/authors` | Create author | Admin session required |
| `GET` | `/api/authors/[slug]` | Get author by slug | None |
| `PUT` | `/api/authors/[slug]` | Update author | Admin session required |

### Admin Auth

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `POST` | `/api/admin/login` | Login (returns session cookie) | None |
| `POST` | `/api/admin/logout` | Logout (destroys session) | Session |
| `GET` | `/api/admin/verify` | Check if session is valid | Session |

### Other Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/upload` | Image upload to Supabase Storage (5MB max, images only) |
| `POST` | `/api/enhance-text` | AI text enhancement via Gemini |
| `POST` | `/api/generate-image` | AI image generation |
| `POST` | `/api/convert` | Content conversion utility |
| `POST` | `/api/send-questions` | Send questions via email |
| `POST` | `/api/questions-discovery` | DataForSEO questions lookup |
| `POST` | `/api/setup/*` | Clone setup wizard endpoints |

---

## 9. Admin Panel

**URL:** `/admin` (redirects to `/admin/login` if not authenticated)

### Features

| Page | Route | Function |
|------|-------|----------|
| Dashboard | `/admin` | Post list with edit/delete, stats |
| New Post | `/admin/new` | Rich post editor with image upload, SEO fields |
| Edit Post | `/admin/edit/[id]` | Edit existing post |
| Homepage Editor | `/admin/homepage` | Edit all homepage CMS fields |
| Leads | `/admin/leads` | View all lead captures |
| Authors | `/admin/authors` | CRUD for author profiles |
| Author Edit | `/admin/authors/[slug]` | Edit individual author |

### Creating an admin user

1. Generate a password hash:
   ```bash
   node scripts/generate-admin-hash.js
   ```
2. Insert into Supabase SQL editor:
   ```sql
   INSERT INTO admin_users (username, password_hash)
   VALUES ('admin', '$2a$10$YOUR_HASH_HERE');
   ```

---

## 10. Authentication System

**Type:** Custom session-based auth (NOT Supabase Auth)

**Flow:**
1. User POSTs username + password to `/api/admin/login`
2. Server looks up `admin_users` table, verifies bcrypt hash
3. On success: generates UUID session token, stores in `admin_sessions` table
4. Sets `admin_session` HTTP-only cookie (30-day expiry, secure in production)
5. Protected pages check cookie via `verifySession()` → looks up `admin_sessions` table
6. Logout: deletes session from DB + clears cookie

**Security:**
- Passwords hashed with bcrypt (10 rounds)
- Session tokens are UUID v4
- Cookies: `httpOnly`, `secure` (production), `sameSite: lax`
- Expired sessions cleaned on login
- No session token exposed to client JavaScript

---

## 11. Blog System (Full Lifecycle)

### Publishing via API (external pipeline)

```bash
curl -X POST https://www.yoursite.com/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "unique-article-id",
    "title": "Article Title",
    "content": "<h2>Intro</h2><p>HTML content...</p>",
    "slug": "article-slug",
    "status": "published",
    "category": "Category",
    "tags": ["tag1", "tag2"],
    "author": "Author Name",
    "featured_image": "https://...",
    "meta_title": "SEO Title | Site Name",
    "meta_description": "SEO description.",
    "focus_keyword": "primary keyword"
  }'
```

### Publishing via Admin

1. Go to `/admin/new`
2. Fill in title, content (rich editor), SEO fields
3. Upload featured image
4. Click Publish

### How posts appear on site

- **Homepage:** Top 6 posts (popular first, then newest) in a grid
- **Blog page (`/blog`):** All published posts, category filter, 3-column grid
- **Blog post (`/blog/[slug]`):** Full article with featured image, tags, date, reactions, comments, related posts, quiz CTA, carousel, contact form
- **Sitemap:** Auto-generated at `/sitemap-blog.xml`

### SEO per post

- `meta_title` → `<title>` tag and OG title
- `meta_description` → description meta tag and OG description
- `generated_llm_schema` → JSON-LD structured data (Article, FAQ, Breadcrumb)
- Canonical URL: `{baseUrl}/blog/{slug}`
- OG image: `featured_image`

---

## 12. Lead Capture & Contact System

### Sources that feed `lead_captures`

| Source | Form | Fields |
|--------|------|--------|
| `contact-page` | `/contact` form | name, email, message |
| `contact_form` | ContactForm component (in blog footer) | name, email, company, website, message, topic |
| Various | Any form that POSTs to `/api/lead-capture` | flexible |

### Spam protection

- **Rate limiting:** In-memory cache, 5-minute window per IP+email+source combo
- **Email dedup:** Checks `lead_captures` table globally — same email can only submit once ever
- **IP tracking:** Stores `ip_address` (from `x-forwarded-for` or `x-real-ip` headers)
- **Fail-open:** If rate limit or dedup check fails (DB error), form still processes

### Email notification

On successful lead capture, sends formatted HTML email via Resend to the configured recipient (`stuartr@sewo.io` — **update per clone**).

---

## 13. Newsletter Subscription

- **Endpoint:** `POST /api/subscribe`
- **Table:** `newsletter_subscribers`
- **UI:** `SubscribeHero` component (email input + submit)
- **Dedup:** Unique constraint on email; duplicates silently ignored
- **Analytics:** PostHog `subscribe_submitted` event (if configured)

---

## 14. Email Notifications (Resend)

| Trigger | From | To | Subject Pattern |
|---------|------|----|-----------------|
| Lead capture | `SEWO <stuartr@sewo.io>` | `stuartr@sewo.io` | `New Lead: {source} - {company/name/email}` |
| Apply form | `SEWO <stuartr@sewo.io>` | `stuartr@sewo.io` | `New Application: {company} - {contact}` |

**Setup required:**
1. Resend account with verified sending domain
2. `RESEND_API_KEY` env var set
3. Update `from` and `to` addresses in API route files for each clone

**Files to update per clone:**
- `app/api/lead-capture/route.ts` — lines ~309-312 (from/to)
- `app/api/apply-to-work-with-us/route.ts` — lines ~206-209 (from/to)

---

## 15. Analytics & Tracking

### Google Analytics 4

- **Measurement ID:** `G-TT58X7D8RV` (hardcoded in `components/Analytics.tsx`)
- **GDPR:** Consent mode defaults to `denied`; cookie consent banner updates it
- **IP anonymization:** Enabled

### Google Tag Manager

- **Container ID:** `GTM-M4RMX5TG` (hardcoded in `app/layout.tsx`)

### PostHog (optional)

- Initialized if `NEXT_PUBLIC_POSTHOG_KEY` is set
- Captures pageviews and custom events

### Custom event tracking (`lib/analytics.ts`)

All events fire via `window.gtag()`:

| Event | Trigger |
|-------|---------|
| `quiz_start` | Quiz CTA click |
| `quiz_view` | Quiz section in viewport |
| `form_submission` | Any form submit (success/error) |
| `form_start` | First field interaction |
| `blog_view` | Blog post page load |
| `blog_read_progress` | 25/50/75/100% scroll |
| `blog_time_spent` | Time on article |
| `cta_click` | CTA button click |
| `navigation_click` | Nav menu click |
| `scroll_depth` | Page scroll milestones |
| `lead_capture` | Successful lead form |
| `wizard_step_progress` | Multi-step form progress |

---

## 16. SEO System

### Per-page metadata

Every page exports `metadata` (or `generateMetadata` for dynamic routes) with:
- Title (with template: `%s | SEWO`)
- Description
- Open Graph (title, description, type, url, images)
- Twitter card
- Canonical URL
- robots directives

### Sitemaps

| URL | Content | Cache |
|-----|---------|-------|
| `/sitemap.xml` | Index pointing to 3 sub-sitemaps | 1 hour |
| `/sitemap-pages.xml` | Static pages | 1 hour |
| `/sitemap-services.xml` | Service pages | 1 hour |
| `/sitemap-blog.xml` | All published blog posts (dynamic from DB) | 1 hour |

### robots.txt

- Allow: `/`
- Disallow: `/admin/`, `/api/`
- Lists all 4 sitemaps

### Structured data (JSON-LD)

- **Global:** `StructuredData` component in root layout
- **Blog posts:** Article schema (auto-generated or from `generated_llm_schema` field)
- **Blog posts:** BreadcrumbList schema (Home → Blog → Post)
- **Blog posts:** FAQPage schema (if valid FAQ data in `generated_llm_schema`)

### Blog post SEO fields

| Field | Maps to |
|-------|---------|
| `meta_title` | `<title>` tag, OG title, Twitter title |
| `meta_description` | Description meta, OG description |
| `featured_image` | OG image, Twitter image |
| `focus_keyword` | Internal reference |
| `generated_llm_schema` | JSON-LD `<script>` in page |
| `tags` | OG article tags |
| `author` | OG article author |
| `published_date` | OG article publishedTime |

---

## 17. Middleware & Redirects

**File:** `middleware.ts`

| Rule | What happens |
|------|-------------|
| `sewo.io` → `www.sewo.io` | 308 redirect (permanent, preserve method) |
| `/pages/contact` → `/contact` | 301 redirect |
| `/blogs/news.atom` → `/blog` | 301 redirect |
| `/collections/frontpage` → `/` | 301 redirect |
| `/agencies`, `/enterprise` → `/consulting` | 301 redirect |
| `/dashboard`, `/cart`, `/adminseo`, etc. | 410 Gone (cached 24h) |

**Matcher:** Runs on all routes except `_next/static`, `_next/image`, `favicon.ico`.

**For clones:** Update the canonical host check (`sewo.io` → your domain) in `middleware.ts`.

---

## 18. Security

### Vercel headers (`vercel.json`)

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `origin-when-cross-origin` |

### Next.js config

- `poweredByHeader: false` — Hides `X-Powered-By: Next.js`
- SVG content security: `sandbox` policy for SVG images

### Database

- RLS on all tables
- Service role key never exposed to browser
- Admin auth tables only accessible via service role

### Forms

- Rate limiting on lead capture
- Email deduplication
- HTML sanitization in email templates
- Input validation on all API routes

### Cookies

- Admin session cookie: `httpOnly`, `secure` (production), `sameSite: lax`

---

## 19. Image Handling

### Upload

- **Endpoint:** `POST /api/upload`
- **Storage:** Supabase Storage `images` bucket, path: `blog-images/{timestamp}-{random}.{ext}`
- **Limits:** Images only, 5MB max
- **Returns:** Public URL

### Remote images (`next.config.js`)

Allowed remote image domains:

| Domain | Purpose |
|--------|---------|
| `**.supabase.co` | Supabase Storage |
| `images.unsplash.com`, `**.unsplash.com` | Stock images |
| `**.media-amazon.com` | Product images |
| `**.fal.media` | AI-generated images |
| `**.framerusercontent.com` | Framer assets |
| `**.cloudfront.net` | CDN assets |
| `raw.githubusercontent.com` | GitHub-hosted images |
| Various others | Logos, icons |

### Image optimization

- Formats: AVIF, WebP
- Device sizes: 640–3840px
- Cache TTL: 60s minimum

---

## 20. Homepage CMS

The homepage is fully CMS-driven from a single `homepage_content` row.

### How it works

1. `app/page.tsx` (SSR) fetches `homepage_content` + latest 6 posts
2. Passes data to `HomePageClient.tsx` (client component, ~1300 lines)
3. `HomePageClient` renders sections based on what data exists:
   - **Header:** Logo (text or image), nav links, CTA button
   - **Hero:** Title, description, image, CTA
   - **About:** Title, description, image (if `about_*` fields set)
   - **Blog Grid:** Latest posts (if posts exist)
   - (Extended sections available: services, programs, pricing, FAQ, testimonials, etc.)
4. Admin edits at `/admin/homepage` → POSTs to `/api/homepage`

### Minimal blog layout (for clones)

For a simple blog site, only these fields matter:
- `logo_text` / `logo_image`
- `hero_title`, `hero_description`, `hero_image`, `hero_cta_text`, `hero_cta_link`
- `about_title`, `about_description`, `about_image` (optional)
- `blog_grid_title`

---

## 21. Components Reference

| Component | Purpose | Used in |
|-----------|---------|---------|
| `SiteHeader` | Header with logo, nav, CTA, mobile menu | All pages |
| `Footer` | Footer with links, legal, contact info | Root layout (all pages) |
| `MobileMenu` | Slide-out mobile navigation | SiteHeader |
| `Analytics` | GA4 + PostHog initialization | Root layout |
| `CookieConsent` | GDPR cookie consent banner | Root layout |
| `StructuredData` | Global JSON-LD schema | Root layout |
| `ContactForm` | Reusable lead capture form | Blog post page, blog listing |
| `BlogCarousel` | Horizontal post carousel | Blog listing, blog post page |
| `BlogTracker` | Tracks blog views, read progress, time | Blog post page |
| `BlogQuizCTA` | Quiz CTA section | Blog post page |
| `ArticleReactions` | Like/reaction buttons | Blog post page |
| `ArticleComments` | Comment section | Blog post page |
| `RelatedPosts` | Related posts by category | Blog post page |
| `SubscribeHero` | Email newsletter subscribe section | Homepage |
| `HowItWorks` | How it works steps section | Homepage |
| `ParticleAnimation` | Canvas background animation | Homepage |
| `QuestionsDiscovery` | DataForSEO questions lookup | Various |
| `ImageUpload` | Drag-drop image upload | Admin pages |
| `TextEnhancer` | AI text enhancement | Admin editor |
| `AdminAuthCheck` | Session verification wrapper | Admin pages |
| `AdminProtected` | Route protection HOC | Admin pages |

---

## 22. Scripts & Tooling

### npm scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (port 3003) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run setup` | Interactive new site setup wizard |
| `npm run clone:validate` | Validate clone has no leftover template references |
| `npm run clone:auto` | Automated clone from profile JSON |

### Utility scripts

| Script | Purpose |
|--------|---------|
| `scripts/generate-admin-hash.js` | Generate bcrypt hash for admin password |
| `scripts/seed-modernlongevity-homepage.js` | Seed homepage content for ML clone |
| `scripts/setup-new-site.js` | Interactive branding + setup |
| `scripts/validate-clone.js` | Check for legacy template strings |
| `scripts/clone-blog-auto.js` | Fully automated clone creation |
| `scripts/run-all-migrations.sh` | Run all SQL migrations in order |
| `scripts/run-migration.js` | Run a single migration file |

---

## 23. Deployment (Vercel)

### Configuration (`vercel.json`)

- **Framework:** Next.js
- **Region:** `iad1` (US East)
- **Build command:** `npm run build`
- **Install command:** `npm install`
- Security headers applied to all routes

### Deployment steps

1. Push to GitHub (auto-deploy if connected)
2. Or: `vercel --prod` from CLI

### Environment variables (set in Vercel dashboard)

All variables from [Section 4](#4-environment-variables-complete) must be set in:
**Vercel → Project → Settings → Environment Variables**

Set for: Production, Preview (and Development if using `vercel dev`).

### Domain setup

1. Add custom domain in Vercel → Project → Settings → Domains
2. Add both `yourdomain.com` and `www.yourdomain.com`
3. Set `www` as primary (matches middleware canonical redirect)
4. Update `NEXT_PUBLIC_SITE_URL` to `https://www.yourdomain.com`

---

## 24. Cloning to a New Site

### Quick overview

1. **Create new repo** from template (or copy files)
2. **Create new Supabase project** and run `all-migrations-combined.sql` (or `supabase/COMPLETE_SETUP.sql`)
3. **Set environment variables** (Supabase keys, Resend, branding)
4. **Create admin user** (generate hash, insert into `admin_users`)
5. **Seed homepage** (POST to `/api/homepage` or use seed script)
6. **Update hardcoded values** (see Section 26)
7. **Deploy to Vercel**
8. **Run validation:** `npm run clone:validate`

### Full detailed checklist

See `docs/CLONE_CHECKLIST.md` for the step-by-step guide.

---

## 25. Go-Live Checklist

Run through every item before going live. Check each box.

### Database

- [ ] Supabase project created and healthy
- [ ] All migrations applied (43 migrations or `all-migrations-combined.sql`)
- [ ] RLS enabled on all tables
- [ ] Admin user created in `admin_users` table
- [ ] Homepage content seeded (at minimum: `logo_text`, `hero_title`, `hero_description`, `hero_cta_text`, `hero_cta_link`)
- [ ] At least one blog category created (optional)
- [ ] Storage bucket `images` exists and is public

### Environment Variables (Vercel)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — correct project
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — correct key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — correct key (NEVER expose publicly)
- [ ] `NEXT_PUBLIC_SITE_URL` — `https://www.yourdomain.com` (with www)
- [ ] `RESEND_API_KEY` — valid key
- [ ] `NEXT_PUBLIC_BLOG_TITLE` — your blog title
- [ ] `NEXT_PUBLIC_SITE_NAME` — your site name
- [ ] `NEXT_PUBLIC_CONTACT_EMAIL` — your contact email
- [ ] `NEXT_PUBLIC_CONTACT_PHONE` — your phone (or leave empty)

### Code Updates (per clone)

- [ ] `app/layout.tsx` — metadata title, description, OG, Twitter, metadataBase updated
- [ ] `app/layout.tsx` — GTM container ID updated (or removed)
- [ ] `app/page.tsx` — metadata updated for homepage
- [ ] `components/Analytics.tsx` — GA4 measurement ID updated (or removed)
- [ ] `components/Footer.tsx` — brand name, tagline, email, phone, address updated
- [ ] `components/SiteHeader.tsx` — default logo text, CTA text updated
- [ ] `middleware.ts` — canonical host redirect updated to your domain
- [ ] `app/robots.ts` — fallback URL updated
- [ ] `app/api/lead-capture/route.ts` — Resend from/to emails updated
- [ ] `app/api/apply-to-work-with-us/route.ts` — Resend from/to emails updated
- [ ] `app/contact/page.tsx` — contact email/phone from env (check defaults)
- [ ] `app/blog/[slug]/page.tsx` — fallback publisher/author names updated

### Domain & DNS

- [ ] Domain purchased and DNS configured
- [ ] Domain added to Vercel
- [ ] SSL certificate active (Vercel auto-provisions)
- [ ] `www` redirect working (middleware)
- [ ] Resend domain verified for sending

### Functionality Verification

- [ ] Homepage loads with correct hero, about, blog grid
- [ ] `/blog` lists published posts (or shows "No posts yet")
- [ ] `/blog/[slug]` renders a post correctly
- [ ] `/contact` form submits successfully
- [ ] Lead capture email notification received
- [ ] `/admin/login` works with your admin credentials
- [ ] Admin dashboard shows posts
- [ ] Admin can create/edit/delete posts
- [ ] Admin homepage editor saves correctly
- [ ] `/sitemap.xml` returns valid XML
- [ ] `/robots.txt` returns correct content
- [ ] Blog API (`GET /api/blog`) returns posts
- [ ] Blog API (`POST /api/blog`) creates a post
- [ ] Image upload works from admin
- [ ] Mobile responsive (header, menu, blog grid)

### SEO Verification

- [ ] Each page has unique `<title>` and `<meta description>`
- [ ] OG tags present on all pages
- [ ] Canonical URLs correct (with www)
- [ ] Sitemaps list all published posts
- [ ] JSON-LD structured data on blog posts
- [ ] No `noindex` on pages that should be indexed
- [ ] `/admin/` and `/api/` disallowed in robots.txt

### Legal

- [ ] Privacy policy updated for your brand/entity
- [ ] Terms of service updated for your brand/entity
- [ ] Service delivery & returns page updated
- [ ] Cookie consent banner present and functional
- [ ] GDPR consent mode defaults to `denied`

---

## 26. Known Hardcoded Values to Update Per Clone

These values are hardcoded in source and MUST be updated for each clone:

| File | Line(s) | What | Current Value |
|------|---------|------|---------------|
| `app/layout.tsx` | 17-56 | Metadata (title, description, OG, base URL) | SEWO branding |
| `app/layout.tsx` | 73 | GTM Container ID | `GTM-M4RMX5TG` |
| `app/page.tsx` | 10-26 | Homepage metadata | SEWO branding |
| `components/Analytics.tsx` | 7 | GA4 Measurement ID | `G-TT58X7D8RV` |
| `components/Footer.tsx` | 9 | Footer logo text | `SEWO` |
| `components/Footer.tsx` | 11 | Footer tagline | LLM ranking text |
| `components/Footer.tsx` | 38 | Contact email | `contact@sewo.io` |
| `components/Footer.tsx` | 47 | Contact phone | `+1 342223434` |
| `components/Footer.tsx` | 57-59 | Physical address | Wilmington, DE |
| `components/Footer.tsx` | 69 | Copyright text | `SEWO - Get Found Everywhere` |
| `components/SiteHeader.tsx` | 20 | Default logo text | `SEWO` |
| `components/SiteHeader.tsx` | 21 | Default CTA text | `Apply to Work With Us` |
| `components/SiteHeader.tsx` | 22 | Default CTA link | `/#apply-form` |
| `middleware.ts` | 16-19 | Canonical host redirect | `sewo.io` → `www.sewo.io` |
| `app/robots.ts` | 8 | Fallback URL | `https://www.sewo.io` |
| `app/api/lead-capture/route.ts` | ~309-312 | Resend from/to | `stuartr@sewo.io` |
| `app/api/apply-to-work-with-us/route.ts` | ~206-209 | Resend from/to | `stuartr@sewo.io` |
| `app/blog/[slug]/page.tsx` | 109, 177, 254-260 | Fallback base URL, publisher name | `sewo.io`, `SEWO` |
| `lib/spam-protection.ts` | — | Error contact email | `stuartr@sewo.io` |
| `app/contact/page.tsx` | 8-9 | Default contact email/phone | From env (check fallbacks) |

**Automated check:** Run `npm run clone:validate` or:
```bash
grep -RniE "SEWO|sewo\.io|stuartr@" app components lib --include="*.ts" --include="*.tsx"
```

---

## 27. Troubleshooting

### "Column does not exist" on homepage save
Run the missing migration. Most likely: `supabase/migrations/20250120_add_all_missing_homepage_columns.sql`

### Blog posts not showing
1. Check `site_posts` table has rows with `status = 'published'`
2. Check RLS policy: `"Public can read published posts"` exists
3. Check Supabase URL and anon key are correct

### Lead capture failing
1. Check `SUPABASE_SERVICE_ROLE_KEY` is set (needed to bypass RLS for inserts)
2. Check `lead_captures` table exists
3. Check RLS: `"Anyone can submit lead"` INSERT policy exists

### Admin login not working
1. Verify `admin_users` table has your user with correct bcrypt hash
2. Verify `admin_sessions` table exists
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct (admin auth uses it)
4. Check browser cookies are not blocked

### Duplicate posts
The system uses upsert on `external_id`. Ensure each `postId` is unique. Same `postId` = update, not duplicate.

### Images not loading
1. Check the image domain is in `next.config.js` `remotePatterns`
2. For Supabase Storage: ensure bucket is public
3. Check Storage bucket name is `images`

### Email notifications not sending
1. Check `RESEND_API_KEY` is set and valid
2. Check sending domain is verified in Resend
3. Check the `from` email matches a verified domain
4. Email failures are non-blocking (lead still saves)

### 410 Gone on valid pages
Check `middleware.ts` `gonePaths` set — remove any paths that should be accessible.

### Wrong canonical/redirect domain
Update `middleware.ts` host check to your domain.

---

## Appendix: Migration Count & Order

The system has **43 migrations** in `supabase/migrations/`. They can be applied:

1. **All at once:** Run `all-migrations-combined.sql` in Supabase SQL Editor
2. **Incrementally:** Files are numbered chronologically (e.g. `00000000_base_schema.sql` first, then `20250111_...`, etc.)
3. **Via script:** `bash scripts/run-all-migrations.sh`

**Base schema creates:** `homepage_content`, `site_posts`, `newsletter_subscribers`, `lead_captures`, `cta_conversions`, `authors`, `landing_pages` + all RLS policies.

Subsequent migrations add columns, tables (`admin_users`, `admin_sessions`, `apply_to_work_with_us`, `blog_categories`), and schema refinements.

---

**End of document.**  
**If something is not in this guide, it's not in the system.**
