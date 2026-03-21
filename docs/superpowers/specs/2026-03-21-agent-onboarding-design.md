# Agent-Driven Onboarding — Design Spec

## Overview

Replace the fragile PDF brand guide upload flow with a structured API that any AI agent can call directly. Clients install an MCP server, their AI guides them through defining a site concept conversationally, then submits the structured data via API call. Drafts land in the admin UI for review, domain selection, and provisioning.

**Problem:** The current PDF pipeline (LlamaParse → GPT-4o extraction) is fragile — parsing errors, layout issues, extraction hallucinations. If the data is already structured in a conversation with an AI, there's no reason to round-trip it through a PDF.

**Solution:** A thin MCP server with one tool (`submit_site_concept`) that POSTs structured site concept data to a new `/api/drafts` endpoint. Drafts are stored in a `site_drafts` Supabase table. Admin reviews and provisions from a new `/admin/drafts` page.

---

## Architecture

```
Client's AI (Claude Code + MCP)
  → submit_site_concept tool
    → POST /api/drafts (Bearer auth with dc_live_ key)
      → Validate schema
      → Store in site_drafts table (status: "pending")
      → Return draft_id

Admin (/admin/drafts)
  → Review draft
  → Select domains
  → Edit fields if needed
  → Hit "Provision"
    → Calls existing POST /api/provision (single site)
    → Or POST /api/admin/provision-network (network)
```

**Key principle:** The MCP server is a thin HTTP wrapper (~100 lines). All validation, storage, and business logic lives in the blog cloner API. The client never sees database credentials.

---

## 1. Data Schema

The `submit_site_concept` tool accepts this payload:

```typescript
interface SiteConceptPayload {
  // Site Type
  type: "single" | "network"

  // Network only
  network_name?: string  // e.g. "Health & Wellness Network"

  // Sites (1 for single, N for network)
  sites: SiteConcept[]

  // Client Info
  contact_email: string
  contact_name?: string
  notes?: string  // free-form notes for the admin
}

interface SiteConcept {
  role: "main" | "hub" | "sub"  // "main" for single sites, "hub"/"sub" for networks
  niche: string                  // REQUIRED — e.g. "longevity science"
  placeholder_name?: string      // e.g. "The Longevity Post" (admin finalizes)

  // Brand Voice (brand_voice REQUIRED)
  brand_voice: string            // e.g. "Authoritative yet approachable"
  tone?: string                  // e.g. "Educational, evidence-based"
  tagline?: string

  // ICA Profile
  ica_profile?: {
    persona_name?: string
    age_range?: string
    income?: string
    pain_points?: string[]
    goals?: string[]
    motivations?: string[]
    buying_behavior?: string
    search_behaviour?: string[]
  }

  // Visual Direction
  style_guide?: {
    primary_color?: string       // hex e.g. "#1a5632"
    accent_color?: string        // hex e.g. "#c4a35a"
    heading_font?: string
    body_font?: string
    visual_mood?: string         // e.g. "Clean, clinical, trustworthy"
    imagery_style?: string
    dark_light?: "dark" | "light"
  }

  // Products (affiliate)
  affiliate_products?: {
    name: string
    category?: string
    commission?: string
    product_type?: "saas" | "physical" | "course"
    url?: string
  }[]

  // Content
  content_types?: string[]       // e.g. ["how-to guides", "product reviews"]
  seed_keywords?: string[]
  articles_per_day?: number
  languages?: string[]           // e.g. ["en", "es"]

  // Author
  author_name?: string
  author_bio?: string
}
```

### Validation Rules
- `type` is required, must be "single" or "network"
- `sites` must have at least one entry
- Each site must have `niche` (non-empty string) and `brand_voice` (non-empty string)
- `contact_email` is required, must be valid email format
- For `type: "single"`: exactly 1 site with `role: "main"`
- For `type: "network"`: exactly 1 site with `role: "hub"`, at least 1 with `role: "sub"`
- `style_guide.primary_color` and `accent_color`: if provided, must be valid hex (e.g. `#1a5632`)
- No domain fields — domain selection happens during admin review

---

## 2. Authentication

### API Keys

**Format:** `dc_live_` prefix + 32 random alphanumeric characters. Example: `dc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

**Storage:** `client_api_keys` Supabase table:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, auto-generated |
| `client_name` | text | NOT NULL — who this key belongs to |
| `contact_email` | text | NOT NULL — client's email |
| `api_key_hash` | text | NOT NULL — bcrypt hash of the full key |
| `key_prefix` | text | NOT NULL — first 12 chars (e.g. `dc_live_a1b2`) for identification |
| `created_at` | timestamptz | NOT NULL, default now() |
| `revoked_at` | timestamptz | NULL = active, set = revoked |

**Validation flow:**
1. Extract Bearer token from `Authorization` header
2. Check prefix starts with `dc_live_`
3. Hash the key, compare against `api_key_hash` in table
4. Check `revoked_at` is NULL
5. If valid, proceed; if not, return 401

**Key lifecycle:**
- Generated via admin UI (`/admin/api-keys`)
- Shown to admin ONCE at generation time (plain text)
- Stored as bcrypt hash — cannot be recovered
- Revoked by setting `revoked_at` — immediate effect
- No edit — revoke and regenerate if compromised

---

## 3. API Endpoint

### `POST /api/drafts`

**Authentication:** Bearer token (`dc_live_` API key)

**Request body:** `SiteConceptPayload` (see schema above)

**Response (success — 201):**
```json
{
  "draft_id": "uuid",
  "status": "pending",
  "type": "single",
  "site_count": 1,
  "message": "Draft submitted successfully. It will be reviewed shortly."
}
```

**Response (validation error — 400):**
```json
{
  "error": "validation_error",
  "message": "Each site must have a niche and brand_voice",
  "details": ["sites[0].brand_voice is required"]
}
```

**Response (auth error — 401):**
```json
{
  "error": "unauthorized",
  "message": "Invalid or revoked API key"
}
```

### `site_drafts` Supabase table:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, auto-generated |
| `client_api_key_id` | uuid | FK → client_api_keys.id |
| `client_name` | text | Denormalized from API key for convenience |
| `contact_email` | text | From payload |
| `contact_name` | text | Nullable, from payload |
| `type` | text | "single" or "network" |
| `network_name` | text | Nullable, for networks |
| `sites` | jsonb | Full sites array from payload |
| `notes` | text | Nullable, client's free-form notes |
| `status` | text | "pending", "reviewed", "provisioning", "provisioned", "rejected" |
| `admin_notes` | text | Nullable, admin's notes during review |
| `domain_selections` | jsonb | Nullable, admin fills during review. Format: `[{site_index: 0, domain: "longevitypost.com", username: "longevity-post"}]` |
| `provision_results` | jsonb | Nullable, stored after provisioning completes |
| `created_at` | timestamptz | NOT NULL, default now() |
| `updated_at` | timestamptz | NOT NULL, default now() |

---

## 4. Admin UI

### `/admin/api-keys` — Client API Key Management

**Layout:** Table + action buttons. Follows existing admin page patterns.

**Table columns:** Client Name | Email | Key Prefix | Status | Created | Actions

**Actions:**
- **Generate Key** button (top of page):
  - Modal/form: Client Name (required) + Email (required)
  - On submit: generates `dc_live_` key, hashes it, stores in `client_api_keys`
  - Shows the full key ONCE in a copyable box with warning: "Copy this key now — it cannot be shown again"
  - After dismissing, only the `key_prefix` is visible in the table
- **Revoke** button (per row):
  - Confirmation dialog: "Revoke key for {client_name}? This is immediate and cannot be undone."
  - Sets `revoked_at` on the record
  - Row shows "Revoked" status badge

### `/admin/drafts` — Draft Review Dashboard

**Layout:** Table + expandable detail view. Follows existing admin page patterns.

**Table columns:** Client | Type | Sites | Niche(s) | Status | Submitted | Actions

**Status badges:**
- `pending` — yellow, new submission awaiting review
- `reviewed` — blue, admin has looked at it
- `provisioning` — orange, provision in progress
- `provisioned` — green, done
- `rejected` — red, declined

**Expandable detail view (click a row):**
For each site in the draft:
- Niche, placeholder name, role (hub/sub/main)
- Brand voice + tone
- ICA profile summary (persona, pain points, goals)
- Style guide (color swatches, fonts, mood)
- Affiliate products list
- Content types, keywords, languages

**Action buttons:**
- **Select Domains** — for each site, shows:
  - Username input (auto-generated from niche, editable)
  - Domain search (reuse existing `/api/admin/domain-suggestions` flow)
  - Domain input (manual entry if not purchasing)
  - Purchase toggle + price (if buying via Cloud Domains)
  - Saves to `domain_selections` jsonb field
- **Edit** — inline edit any field in the draft before provisioning
- **Provision** — builds the provision payload from draft data + domain selections, calls:
  - `POST /api/provision` for single sites
  - `POST /api/admin/provision-network` for networks
  - Updates draft status to "provisioning" → "provisioned" on success
  - Stores provision results in `provision_results` field
- **Reject** — sets status to "rejected", optional admin note

---

## 5. MCP Server

### Repository: `doubleclicker-onboard` (GitHub)

**Structure:**
```
doubleclicker-onboard/
├── README.md          # Setup instructions for clients
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts       # MCP server (~100 lines)
└── .env.example       # DOUBLECLICKER_API_KEY=dc_live_...
```

**Transport:** stdio (standard for Claude Code)

**Tools:** One tool — `submit_site_concept`

**Tool definition:**
```typescript
{
  name: "submit_site_concept",
  description: `Submit a site concept for blog provisioning. Before calling this tool, you MUST guide the user through defining their site concept by collecting the following information through natural conversation:

1. SITE TYPE: Ask if they want a single blog site or a network of related sites. If network, ask how many sub-sites plus one hub site.

2. FOR EACH SITE, collect:
   - Niche (REQUIRED): What topic/industry is this site about?
   - Brand Voice (REQUIRED): How should the content sound? (e.g. "Authoritative yet approachable", "Casual and friendly")
   - Tone: More specific emotional quality (e.g. "Educational", "Inspirational")
   - Placeholder Name: A suggested name for the site
   - Tagline: A short tagline or slogan

3. TARGET AUDIENCE (ICA Profile):
   - Who is the ideal reader? (persona name, age range, income level)
   - What are their pain points?
   - What are their goals?
   - What motivates them?
   - How do they search for information?

4. VISUAL DIRECTION:
   - Primary and accent colors (hex codes if they have them, or describe and suggest)
   - Visual mood (e.g. "Clean and clinical", "Warm and earthy")
   - Font preferences (or let the system choose)
   - Light or dark theme preference

5. AFFILIATE PRODUCTS (if any):
   - Product names, categories, types (SaaS, physical, course)
   - URLs if available

6. CONTENT PREFERENCES:
   - What types of content? (how-to guides, product reviews, listicles, etc.)
   - Seed keywords they want to rank for
   - How many articles per day?
   - Additional languages beyond English?

7. AUTHOR INFO:
   - Author name for the blog
   - Short author bio

8. CONTACT INFO:
   - Their email address (REQUIRED)
   - Their name

Ask these questions conversationally — don't dump them all at once. Adapt based on what the user knows. If they're unsure about something optional, skip it. The minimum required is: type, niche, brand_voice, and contact_email.

When you have enough information, call this tool with the collected data.`,
  inputSchema: { /* JSON Schema matching SiteConceptPayload */ }
}
```

**Implementation (`src/index.ts`):**
- Reads `DOUBLECLICKER_API_KEY` from environment
- Reads `DOUBLECLICKER_API_URL` from environment (default: `https://doubledoubleclickclick.fly.dev`)
- On tool call: POST to `${DOUBLECLICKER_API_URL}/api/drafts` with Bearer auth
- Returns the API response to the AI

**Client setup instructions (README.md):**
1. Clone the repo
2. `npm install`
3. Add to Claude Code settings:
```json
{
  "mcpServers": {
    "doubleclicker": {
      "command": "node",
      "args": ["/path/to/doubleclicker-onboard/dist/index.js"],
      "env": {
        "DOUBLECLICKER_API_KEY": "dc_live_your_key_here"
      }
    }
  }
}
```
4. Start a conversation: "I want to set up a new blog site"
5. The AI will guide you through defining your site concept and submit it automatically

---

## 6. Draft → Provision Data Mapping

When the admin clicks "Provision" on a draft, the system maps draft data to the existing provision payload:

### Single Site (`type: "single"`)

```
Draft site[0]                    → Provision payload
─────────────────────────────────────────────────
niche                            → niche (passed to DC auto-onboard)
placeholder_name                 → display_name
brand_voice                      → brand_voice
tone                             → (stored in brand_guidelines.voice_and_tone)
ica_profile                      → target_market fields
style_guide.primary_color        → primary_color
style_guide.accent_color         → accent_color
style_guide.heading_font         → heading_font
style_guide.body_font            → body_font
affiliate_products               → approved_products
content_types                    → (passed to DC auto-onboard)
seed_keywords                    → seed_keywords
articles_per_day                 → articles_per_day
languages                        → languages
author_name                      → author_name
author_bio                       → author_bio
contact_email                    → contact_email
domain_selections[0].domain      → domain
domain_selections[0].username    → username
```

### Network (`type: "network"`)

Maps to `POST /api/admin/provision-network` payload:
- `network_name` → `network_name`
- `sites` → `members` array (each site becomes a member)
- Hub site gets `role: "seed"`, sub-sites get `role: "satellite"`
- Domain selections applied per member

---

## Scope Boundaries

**In scope:**
- `POST /api/drafts` endpoint with validation and storage
- `client_api_keys` and `site_drafts` Supabase tables
- `/admin/api-keys` page (generate, list, revoke)
- `/admin/drafts` page (list, review, edit, select domains, provision, reject)
- `doubleclicker-onboard` MCP server repo (one tool, stdio transport)

**Out of scope:**
- Client-facing portal (clients interact only through their AI)
- Email notifications when drafts are submitted (can be added later)
- Draft editing by clients (submit-only, admin edits)
- Rate limiting (trusted clients with issued keys)
- Billing/payment for provisioning
