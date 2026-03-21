# Editorial Redesign — Design Spec

## Overview

Full visual redesign of the multi-tenant blog frontend using a **Classic Broadsheet / Editorial** design direction. The goal is to make every deployed blog site look like a premium online publication — authoritative, readable, and conversion-friendly for SEO + affiliate revenue.

**Design direction:** Classic Broadsheet — dense newspaper grid, serif headings, ruled lines, warm paper tones. Inspired by NYT, The Economist, The Guardian.

**Constraint:** Must work with the existing CSS variable theming system. Brand colors (`--color-primary`, `--color-accent`), fonts (`--font-heading`, `--font-body`), and logos are injected per-tenant via `BrandStyles.tsx`. The redesign defines the structural layout, typography scale, and component patterns — brand theming customizes the color palette.

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Direction | Classic Broadsheet | Premium authority across all niches; ages well; dense content display |
| Primary goal | SEO + Affiliate revenue | Optimize for readability (time-on-site), trust signals, and natural affiliate integration |
| Image aspect ratio | 3:2 | Classic editorial/photography ratio; more presence than 16:9 |
| Scope | Full redesign — all pages | Home, blog listing, article, about, contact, mobile |
| Email capture | 3 placements | Home banner, article sidebar, end-of-article CTA |
| Content pipeline | No changes | All email CTAs are frontend components injected at render time |

---

## Typography System

### Fonts
- **Headings:** Georgia (serif) — or tenant's `--font-heading` override
- **Body text:** Georgia (serif) for article content, system sans-serif for UI elements
- **UI/Meta:** -apple-system, BlinkMacSystemFont, sans-serif stack

### Scale
| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Masthead | 32px | 700 | 1.1 | -1px |
| H1 (article) | 32px | 700 | 1.15 | -0.5px |
| H1 (pages) | 28px | 700 | 1.15 | -0.5px |
| H2 (sections) | 20px | 700 | 1.2 | -0.3px |
| H3 (cards) | 14-17px | 700 | 1.25 | -0.2px |
| Body (article) | 14px | 400 | 1.75 | normal |
| Body (excerpt) | 12-13px | 400 | 1.5-1.6 | normal |
| Category label | 8-9px | 600 | normal | 1.5-2.5px, uppercase |
| Meta text | 9-10px | 400 | normal | 0.5px |
| Section label | 9px | 600 | normal | 2.5px, uppercase |

### Colors (default palette — overridden by brand)
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#fafaf8` | Warm paper tone — page background |
| Text primary | `#111` / `#1a1a1a` | Headings, strong text |
| Text body | `#333` | Article body copy |
| Text secondary | `#555` / `#666` | Excerpts, descriptions |
| Text muted | `#888` / `#999` | Dates, read times, meta |
| Accent (category) | `#8b7355` | Category labels — maps to `--color-accent` per tenant |
| Border primary | `#e5e0d8` | Section dividers, sidebar border |
| Border light | `#f0ece6` | List item separators |
| Surface warm | `#f3f0ea` | Newsletter CTAs, top bar, info boxes |
| Surface article | `#f8f6f2` | Affiliate product boxes |
| Footer bg | `#1a1a1a` | Dark footer |

---

## Page Designs

### Navigation (Global)

**Desktop:**
- Fixed/sticky header
- Left: Masthead (Georgia serif, 16px, bold)
- Right: Category links (10px, uppercase, 1.5px letter-spacing)
- Bottom border: 2px solid `#1a1a1a`
- Background: page background color with no blur

**Mobile (≤768px):**
- Left: Masthead (15px)
- Right: Hamburger icon (3 lines, 18px wide)
- Below nav: Horizontal scroll category pills (filled active state, outline inactive)

---

### Home Page

**Top bar:**
- Warm surface background (`#f3f0ea`)
- Left: Current date
- Right: "Subscribe to our newsletter →" link
- Font: 9px, muted color

**Masthead (centered):**
- Site name: Georgia, 32px, bold, -1px letter-spacing
- Tagline: 10px, uppercase, 3px letter-spacing, muted
- Bottom border: 3px double `#1a1a1a`

**Category nav bar:**
- Centered, 10px uppercase links
- Active state: bold, dark color
- Below masthead, 1px bottom border

**Hero section (lead story + sidebar):**
- Two columns: 1.3fr (lead) | 1fr (sidebar), separated by 1px vertical rule
- Lead story: 3:2 image + category label + title (26px serif) + excerpt + author/date
- Sidebar: 3 stacked stories, each with 90x60px thumbnail on right, category + title + excerpt
- Bottom border: 1px solid

**Latest section:**
- Section label: "Latest" — 9px, uppercase, 2.5px letter-spacing, bottom rule
- 3-column grid separated by 1px vertical rules
- Each card: 3:2 image + category + title (14px serif) + excerpt + read time

**Newsletter banner:**
- Full-width warm surface background
- Left: Title (Georgia 16px bold) + description
- Right: Email input + Subscribe button (dark bg)

**More Stories section:**
- Section label: "More Stories"
- 2-column grid
- Each row: 64x43px thumbnail (3:2) + category + title (13px serif) + date + read time
- Separated by light horizontal rules and vertical rule between columns

**Footer:**
- Dark background (`#1a1a1a`)
- 4-column grid: Brand info (1.5fr) | Topics | Company | Connect
- Column headers: 9px, uppercase, 1.5px letter-spacing, muted
- Body: 10px, muted color, 2x line-height

**Mobile adaptation:**
- Masthead + hamburger
- Category pills (horizontal scroll)
- Lead story: full-width stacked (image → title → excerpt)
- Story list: thumbnail (90x60) + text rows
- Newsletter: stacked input + button
- Footer: single column stacked

---

### Blog Listing Page (`/blog`, `/blog?category=X`)

**Page header:**
- Title: "All Articles" (28px serif) — changes to category name when filtered
- Description below title
- Category filter tabs: underline-style, 10px uppercase, active = 2px bottom border + bold

**Featured post (first item):**
- Two columns: 1.4fr image (3:2) | 1fr text
- Category + "Featured" label, title (22px serif), excerpt, author avatar + date

**Article list (remaining posts):**
- Rows with: 140x93px thumbnail (3:2) + category + title (17px serif) + excerpt + author avatar + date
- Separated by light horizontal rules

**Pagination:**
- Centered numbered squares (28x28px), active = dark fill
- "Next →" link

**Mobile adaptation:**
- Category tabs → horizontal scroll pills
- Featured post: stacked (image → text)
- Article rows: same layout works at smaller sizes
- Pagination: same

---

### Article Page (`/blog/[slug]`)

**Breadcrumb:**
- Category (accent color) › Subcategory
- 10px, below nav

**Article header (centered, max-width 680px):**
- Label: "Featured Report" or category — 9px uppercase, accent color
- Title: 32px Georgia serif, bold
- Subtitle/dek: 14px Georgia italic, secondary color
- Author bar: Avatar (36px circle) + name (12px bold) + date/read time (10px muted)
- Top and bottom 1px borders on author bar

**Two-column layout (max-width 960px):**
- Main content (fluid) | Sidebar (260px), separated by 1px vertical rule

**Main content column:**
- Hero image: 3:2, full content width
- Image caption: 9px italic, muted
- Body text: Georgia 14px, `#333`, line-height 1.75
- H2 sections: preceded by 1px horizontal rule with 16px padding-top, 20px serif bold
- Pull quotes: 3px left border (`#1a1a1a`), 16px Georgia italic, attribution below
- Affiliate "Editor's Pick" boxes:
  - 1px border, warm surface background (`#f8f6f2`)
  - Left: Label + product name (14px serif bold) + description + star rating
  - Right: Product image (70x70) + price + "VIEW DEAL →" dark button
- End-of-article newsletter CTA:
  - Full content width
  - 2px top border (`#1a1a1a`)
  - Warm surface background
  - Title: "Enjoyed this article?" (15px serif bold)
  - Description + email input + subscribe button (stacked)

**Sidebar (sticky):**
- Table of contents:
  - Label: "In This Article" — 9px uppercase
  - List of H2 anchors, active state bold, 1px top border, items separated by light rules
- Newsletter box:
  - Warm surface background
  - Title (13px serif bold) + description + email input + subscribe button
- Related Reading:
  - Label: "Related Reading" — 9px uppercase
  - 3 items: category + title (11px serif), separated by light rules

**Mobile adaptation (≤768px):**
- Single column, no sidebar
- Table of contents → collapsible box (expandable/collapsible with ▼ indicator) above article body
- Affiliate boxes: compact horizontal (60x60 image left, text + CTA right)
- End-of-article CTA: full-width, stacked input/button
- Newsletter sidebar box moves to end-of-article area
- Related posts appear after end-of-article CTA

---

### About Page

**Header:**
- Category label: "About" — accent color
- Title: 24px serif
- Mission statement: 13px serif, secondary color, max-width 520px

**Body content (max-width 560px):**
- Georgia serif, 13px, line-height 1.75
- Writer cards section:
  - Section label: "Our Writers" — 9px uppercase
  - Each writer: 52px circle avatar + name (14px serif bold) + role (10px accent) + bio (11px)
  - Separated by light rules

**Newsletter CTA at bottom** — warm surface background, same pattern as home

**Mobile:** Single column, everything stacks naturally

---

### Contact Page

**Header:** Same pattern as About (label + title + description)

**Two-column layout:**
- Left (1.3fr): Contact form
  - Fields: Name, Email, Subject, Message (textarea)
  - Labels: 10px uppercase, muted
  - Inputs: 1px border, white background, 8px padding
  - Submit: dark background button, 11px, centered text
- Right (1fr): Contact info
  - Sections: Email, Press, Partnerships — each with 9px uppercase label + 12px value
  - Response time info box: warm surface background

**Mobile:** Single column, form on top, contact info below

---

## Component Inventory

Components to build or redesign:

| Component | Status | Notes |
|-----------|--------|-------|
| `SiteHeader` | Redesign | Broadsheet masthead + category nav, hamburger mobile |
| `MobileMenu` | Redesign | Full-screen overlay with category list |
| `Footer` | Redesign | Dark bg, 4-column grid |
| `ArticleCard` | New | Thumbnail + category + title + excerpt (list layout) |
| `FeaturedCard` | New | Large image + text side-by-side (hero treatment) |
| `HomeHero` | New | Lead story + sidebar with thumbnails |
| `LatestGrid` | New | 3-column image cards with vertical rules |
| `MoreStories` | New | 2-column text + thumbnail list |
| `CategoryTabs` | New | Underline-style filter tabs (desktop) + pill scroll (mobile) |
| `CategoryPills` | New | Horizontal scroll mobile category filter |
| `NewsletterBanner` | New | Full-width inline email capture |
| `NewsletterSidebar` | New | Sidebar email capture box |
| `EndOfArticleCTA` | New | Post-content email capture |
| `TableOfContents` | New | Sticky sidebar TOC (desktop), collapsible box (mobile) |
| `AffiliateBox` | New | "Editor's Pick" product recommendation |
| `PullQuote` | New | Left-bordered blockquote with attribution |
| `ArticleBody` | Redesign | Serif typography, section dividers, heading styles |
| `AuthorBar` | New | Avatar + name + date inline |
| `WriterCard` | New | About page writer bio |
| `Breadcrumb` | New | Category › subcategory navigation |
| `Pagination` | New | Numbered page squares |
| `TopBar` | New | Date + newsletter link utility strip |
| `Masthead` | New | Centered site name + tagline + double rule |
| `BrandStyles` | Update | Ensure new CSS variables map correctly |

---

## Image Standards

All featured/hero images use **3:2 aspect ratio** across the site:

| Context | Dimensions | Usage |
|---------|-----------|-------|
| Lead story (home) | fluid width, 3:2 ratio | Home page hero |
| Latest grid (home) | fluid width, 3:2 ratio | 3-column cards |
| Featured post (listing) | fluid width, 3:2 ratio | Blog listing hero |
| Article hero | fluid content width, 3:2 ratio | Article page |
| Sidebar thumbnail | 90×60px | Home sidebar stories |
| More Stories thumbnail | 64×43px | Home "More Stories" section |
| List thumbnail | 140×93px | Blog listing rows |
| Author avatar | 36px circle (article), 52px circle (about), 20-24px circle (meta) | Various |

---

## Email Capture Strategy

Three placements, all frontend-injected (no content pipeline changes):

1. **Home page newsletter banner** — between Latest grid and More Stories. Full-width warm surface background. Title + description left, input + button right.

2. **Article sidebar newsletter box** — in the sticky sidebar below table of contents. Warm surface background. Title + description + stacked input/button.

3. **End-of-article CTA** — after the last paragraph, before Related Reading. 2px top border for emphasis. "Enjoyed this article?" heading. Full-width stacked input/button.

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| > 1024px | Full desktop layout — multi-column grids, sidebar |
| 768-1024px | Tablet — reduce grid columns (3→2), sidebar may collapse |
| < 768px | Mobile — single column, hamburger nav, category pills, collapsible TOC |

---

## Styling Approach

Continue using **CSS custom properties** (no Tailwind migration). The existing `globals.css` design system will be refactored:

- Replace the current 9,463-line `globals.css` with a modular structure organized by component
- Maintain CSS variable theming for multi-tenant brand customization
- No CSS-in-JS — keep current performance characteristics
- Transitions: `all 0.2s ease` for hover states, `transform 0.3s` for movements

---

## Brand Theming Integration

The redesign uses neutral warm tones as the default palette. Per-tenant brand colors override specific tokens:

- `--color-primary` → Masthead text, active nav, footer background accent
- `--color-accent` → Category labels, section labels, active states
- `--font-heading` → Replaces Georgia for headings if set
- `--font-body` → Replaces Georgia for body text if set
- Brand logo replaces text masthead when available

The broadsheet structure (ruled lines, grid layout, typography scale) remains constant — only colors and fonts flex per brand.

---

## Technical Integrations (Preserve)

The following technical integrations are configured during the blog cloning/provision process and must be preserved through the redesign. These are not being redesigned — they must continue to work exactly as they do today.

### Google Analytics 4 (GA4)
- Measurement ID (`GA_ID` / `G-XXXXXXX`) injected as env var during Fly deployment
- `Analytics.tsx` component in root layout — must remain in the redesigned layout
- Tracks page views, scroll depth, and engagement metrics

### Google Tag Manager (GTM)
- Container ID (`GTM_ID` / `GTM-XXXXXXX`) injected as env var during Fly deployment
- GTM script injected in root layout `<head>` and `<noscript>` body
- Must remain in the redesigned layout — handles all third-party tag injection

### Google Search Console (GSC)
- DNS-TXT verified during provisioning — no frontend component needed
- Structured data (Schema.org) is critical for GSC indexing — see below

### Structured Data (Schema.org)
- `StructuredData.tsx` component generates JSON-LD for articles, organization, breadcrumbs
- Must be preserved and updated to match new breadcrumb structure
- Article structured data: headline, author, datePublished, dateModified, image, publisher
- BreadcrumbList structured data: must match the new breadcrumb navigation component

### Cookie Consent
- `CookieConsent.tsx` component — must remain in the redesigned layout
- Required for GDPR/privacy compliance with GA4 and GTM

### Blog Tracker
- `BlogTracker.tsx` — tracks article reads and engagement
- Must remain functional on the redesigned article page

### SEO Meta Tags
- `app_settings` table stores publishing settings (schema.org metadata) per tenant
- Meta tags (title, description, og:image, canonical) generated per page
- The redesign must maintain all existing meta tag generation

### Environment Variables (No Changes)
These env vars are set during provision and read at runtime. The redesign does not change how they are consumed:
- `NEXT_PUBLIC_BRAND_USERNAME` / `BRAND_USERNAME`
- `GA_ID`, `GTM_ID`
- `SITE_URL`, `SITE_NAME`, `CONTACT_EMAIL`
- `LANGUAGES` (multi-language support)
