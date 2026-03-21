# Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the multi-tenant blog frontend from wireframe-quality to a premium Classic Broadsheet editorial aesthetic, optimized for SEO + affiliate revenue.

**Architecture:** Refactor the monolithic `globals.css` (9,463 lines) into component-scoped CSS files. Rebuild each page component to match the approved broadsheet mockups. Preserve all existing technical integrations (GA4, GTM, structured data, cookie consent, analytics). No changes to API routes, lib utilities, or admin pages.

**Tech Stack:** Next.js 14 (App Router), CSS custom properties (no Tailwind), Georgia serif typography, framer-motion (existing), Supabase (existing data layer)

**Spec:** `docs/superpowers/specs/2026-03-21-editorial-redesign-design.md`

**Important notes:**
- Tasks 1-9 must be completed as a continuous sequence before the site is deployable. Task 1 strips all component styles, so pages will be unstyled until subsequent tasks add them back.
- The desktop header (Masthead + CategoryNav) should use `position: sticky; top: 0; z-index: 100` for fixed navigation.
- The blog listing page's category filter tabs (underline-style, desktop) are built inline in Task 6 — there is no separate `CategoryTabs` component file.

---

## File Structure

### New Files
- `app/globals-base.css` — Reset, CSS variables, typography scale, utility classes (~150 lines)
- `components/Masthead.tsx` — Centered site name + tagline + double rule
- `components/TopBar.tsx` — Date + newsletter link utility strip
- `components/CategoryNav.tsx` — Desktop category links bar
- `components/CategoryPills.tsx` — Mobile horizontal scroll category filter
- `components/HomeHero.tsx` — Lead story + sidebar with thumbnails
- `components/LatestGrid.tsx` — 3-column image cards with vertical rules
- `components/MoreStories.tsx` — 2-column text + thumbnail list
- `components/ArticleCard.tsx` — Thumbnail + category + title + excerpt (list row)
- `components/FeaturedCard.tsx` — Large image + text side-by-side (hero treatment)
- `components/NewsletterBanner.tsx` — Full-width inline email capture
- `components/NewsletterSidebar.tsx` — Sidebar email capture box
- `components/EndOfArticleCTA.tsx` — Post-content email capture
- `components/TableOfContents.tsx` — Sticky sidebar TOC / collapsible mobile
- `components/AffiliateBox.tsx` — "Editor's Pick" product recommendation
- `components/PullQuote.tsx` — Left-bordered blockquote with attribution
- `components/AuthorBar.tsx` — Avatar + name + date inline
- `components/WriterCard.tsx` — About page writer bio card
- `components/Breadcrumb.tsx` — Category › subcategory navigation
- `components/Pagination.tsx` — Numbered page navigation
- `components/ArticleBody.css` — Article body typography styles
- `components/SiteHeader.css` — Header component styles
- `components/Footer.css` — Footer component styles

### Modified Files
- `app/globals.css` — Strip down to imports of modular CSS files; keep reset + base variables
- `app/layout.tsx` — Add TopBar, swap SiteHeader for new Masthead + CategoryNav
- `app/page.tsx` — Rebuild with HomeHero, LatestGrid, NewsletterBanner, MoreStories
- `app/blog/page.tsx` — Rebuild with CategoryTabs, FeaturedCard, ArticleCard list, Pagination
- `app/blog/[slug]/page.tsx` — Rebuild with two-column layout, sidebar, TOC, AffiliateBox, EndOfArticleCTA
- `app/about/page.tsx` — Rebuild with WriterCard, editorial typography
- `app/contact/page.tsx` — Rebuild with two-column form + info layout
- `components/SiteHeader.tsx` — Redesign: broadsheet masthead + hamburger mobile
- `components/Footer.tsx` — Redesign: dark bg, 4-column grid
- `components/MobileMenu.tsx` — Update to match editorial styling
- `components/BrandStyles.tsx` — Verify new CSS variable tokens map correctly
- `components/StructuredData.tsx` — Update BreadcrumbList to match new Breadcrumb component

### Preserved (No Changes)
- `components/Analytics.tsx` — GA4 + PostHog
- `components/BlogTracker.tsx` — Article engagement tracking
- `components/CookieConsent.tsx` — GDPR compliance
- `components/QuizPlayer.tsx` — Quiz functionality
- `components/ProvisionForm.tsx` — Admin provision (not redesigned)
- `components/NetworkForm.tsx` — Admin network (not redesigned)
- All API routes (`app/api/`)
- All lib files (`lib/`)
- `middleware.ts`
- `next.config.js`
- Admin pages (`app/admin/`)

---

## Tasks

### Task 1: CSS Foundation — Base Variables & Typography

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Back up current globals.css**

```bash
cp app/globals.css app/globals.css.backup
```

- [ ] **Step 2: Rewrite the `:root` CSS variables**

Replace the existing `:root` block in `app/globals.css` with the new editorial design tokens. Keep all existing resets and utility classes (`html`, `body`, `*`, `.container`, `.sr-only`). Replace only the `:root` variables section with:

```css
:root {
  /* Typography */
  --font-serif: Georgia, 'Times New Roman', serif;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-heading: var(--font-serif);
  --font-body: var(--font-serif);

  /* Type Scale */
  --text-xs: 9px;
  --text-sm: 10px;
  --text-base: 12px;
  --text-md: 13px;
  --text-lg: 14px;
  --text-xl: 17px;
  --text-2xl: 20px;
  --text-3xl: 24px;
  --text-4xl: 28px;
  --text-5xl: 32px;

  /* Colors — Editorial Broadsheet */
  --color-bg: #fafaf8;
  --color-bg-warm: #f3f0ea;
  --color-bg-article: #f8f6f2;
  --color-text: #111111;
  --color-text-body: #333333;
  --color-text-secondary: #555555;
  --color-text-muted: #888888;
  --color-text-faint: #999999;
  --color-accent: #8b7355;
  --color-border: #e5e0d8;
  --color-border-light: #f0ece6;
  --color-footer-bg: #1a1a1a;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;
  --space-3xl: 32px;
  --space-4xl: 48px;

  /* Layout */
  --max-width: 960px;
  --max-width-content: 680px;
  --sidebar-width: 260px;

  /* Transitions */
  --transition-fast: all 0.2s ease;
  --transition-med: transform 0.3s ease;
}
```

- [ ] **Step 3: Remove all component-specific styles from globals.css**

Remove all component styles (header, footer, hero, blog cards, forms, etc.) from globals.css. Keep ONLY:
- The `:root` variables (just updated)
- `*`, `html`, `body` resets
- `.container`, `.sr-only` utilities
- `@keyframes` animations (scroll-infinite, fadeIn, fadeInScale, mobileMenuFadeIn)
- Responsive media queries for the `:root` variables only

The file should shrink from ~9,463 lines to ~200 lines. All component styles will be inlined or in component-adjacent CSS files.

- [ ] **Step 4: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds (pages will look unstyled — that's correct at this stage).

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/globals.css.backup
git commit -m "refactor: strip globals.css to base variables and editorial tokens"
```

---

### Task 2: SiteHeader + Masthead + Navigation

**Files:**
- Modify: `components/SiteHeader.tsx`
- Modify: `components/MobileMenu.tsx`
- Create: `components/TopBar.tsx`
- Create: `components/Masthead.tsx`
- Create: `components/CategoryNav.tsx`
- Create: `components/CategoryPills.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create TopBar component**

Create `components/TopBar.tsx` — the utility strip above the masthead showing current date and newsletter link.

```tsx
// components/TopBar.tsx
export default function TopBar() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div style={{
      padding: '6px 32px',
      background: 'var(--color-bg-warm)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-muted)',
      letterSpacing: '0.5px',
    }}>
      <span>{today}</span>
      <a href="#newsletter" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
        Subscribe to our newsletter →
      </a>
    </div>
  )
}
```

- [ ] **Step 2: Create Masthead component**

Create `components/Masthead.tsx` — centered site name with double-rule border.

```tsx
// components/Masthead.tsx
import { getTenantConfig } from '@/lib/tenant'

export default function Masthead() {
  const config = getTenantConfig()
  const siteName = config.siteName || 'Blog'

  return (
    <div style={{
      padding: '20px 32px 16px',
      textAlign: 'center',
      borderBottom: '3px double #1a1a1a',
    }}>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--text-5xl)',
        fontWeight: 700,
        letterSpacing: '-1px',
        color: 'var(--color-text)',
      }}>
        {siteName}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create CategoryNav component**

Create `components/CategoryNav.tsx` — desktop horizontal category links. Fetch categories from the blog_posts table for the current tenant.

```tsx
// components/CategoryNav.tsx
import { createClient } from '@/lib/supabase/server'
import { getTenantConfig } from '@/lib/tenant'

export default async function CategoryNav() {
  const config = getTenantConfig()
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('category')
    .eq('user_name', config.username)
    .eq('status', 'published')

  const categories = [...new Set((posts || []).map(p => p.category).filter(Boolean))]

  return (
    <nav style={{
      padding: '10px 32px',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      justifyContent: 'center',
      gap: '24px',
      fontSize: 'var(--text-sm)',
      letterSpacing: '1.5px',
      textTransform: 'uppercase' as const,
      color: 'var(--color-text-secondary)',
    }}>
      <a href="/blog" style={{ color: 'var(--color-text)', fontWeight: 600, textDecoration: 'none' }}>Home</a>
      {categories.slice(0, 6).map(cat => (
        <a
          key={cat}
          href={`/blog?category=${encodeURIComponent(cat)}`}
          style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
        >
          {cat}
        </a>
      ))}
    </nav>
  )
}
```

- [ ] **Step 4: Create CategoryPills component (mobile)**

Create `components/CategoryPills.tsx` — horizontal scroll pills for mobile category filtering. This is a client component.

```tsx
// components/CategoryPills.tsx
'use client'

interface CategoryPillsProps {
  categories: string[]
  activeCategory?: string
}

export default function CategoryPills({ categories, activeCategory }: CategoryPillsProps) {
  return (
    <div style={{
      padding: '10px 16px',
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      borderBottom: '1px solid var(--color-border)',
      WebkitOverflowScrolling: 'touch',
    }}>
      <a
        href="/blog"
        style={{
          fontSize: 'var(--text-sm)',
          padding: '4px 12px',
          background: !activeCategory ? '#1a1a1a' : 'transparent',
          color: !activeCategory ? 'white' : 'var(--color-text-muted)',
          border: activeCategory ? '1px solid #ddd' : 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          textDecoration: 'none',
        }}
      >
        All
      </a>
      {categories.map(cat => (
        <a
          key={cat}
          href={`/blog?category=${encodeURIComponent(cat)}`}
          style={{
            fontSize: 'var(--text-sm)',
            padding: '4px 12px',
            background: activeCategory === cat ? '#1a1a1a' : 'transparent',
            color: activeCategory === cat ? 'white' : 'var(--color-text-muted)',
            border: activeCategory !== cat ? '1px solid #ddd' : 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            textDecoration: 'none',
          }}
        >
          {cat}
        </a>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Redesign SiteHeader**

Rewrite `components/SiteHeader.tsx` to be the broadsheet nav — masthead text left, hamburger right on mobile, category links on desktop. Import and compose TopBar, Masthead, CategoryNav.

Read the current `components/SiteHeader.tsx` first to understand existing props/logic (logo image, brand data fetch), then rewrite preserving the brand data fetch but with new editorial markup.

Key requirements:
- Desktop: TopBar → Masthead (centered) → CategoryNav (centered links)
- Mobile (≤768px): Compact header with site name left + hamburger right. Category links hidden (move to CategoryPills in page components).
- Preserve existing brand logo logic — if logo URL exists, show image; otherwise show text masthead.

- [ ] **Step 6: Update MobileMenu**

Read and update `components/MobileMenu.tsx` to match editorial styling:
- Full-screen overlay with warm paper background (`var(--color-bg)`)
- Category links listed vertically, serif font, generous spacing
- Close button top-right

- [ ] **Step 7: Update root layout.tsx**

Read `app/layout.tsx` and update:
- Keep ALL existing imports: Analytics, CookieConsent, StructuredData, BrandStyles, GTM script
- Replace the current header rendering with the new SiteHeader (which now composes TopBar + Masthead + CategoryNav internally)
- Keep Footer (will be redesigned in Task 3)
- Ensure the `<body>` structure preserves GTM noscript, Analytics, CookieConsent, StructuredData

- [ ] **Step 8: Verify build**

```bash
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add components/TopBar.tsx components/Masthead.tsx components/CategoryNav.tsx components/CategoryPills.tsx components/SiteHeader.tsx components/MobileMenu.tsx app/layout.tsx
git commit -m "feat: redesign header with broadsheet masthead and category nav"
```

---

### Task 3: Footer Redesign

**Files:**
- Modify: `components/Footer.tsx`

- [ ] **Step 1: Read current Footer.tsx**

Read `components/Footer.tsx` to understand existing brand data fetching and link structure.

- [ ] **Step 2: Redesign Footer**

Rewrite with:
- Dark background (`var(--color-footer-bg)`)
- 4-column grid: Brand info (1.5fr) | Topics (1fr) | Company (1fr) | Connect (1fr)
- Column headers: 9px uppercase, 1.5px letter-spacing, muted color
- Body text: 10px, muted, 2x line-height
- Topics column: dynamically populated from categories (same as CategoryNav)
- Company column: About, Contact, Privacy, Terms links
- Connect column: Newsletter link
- Preserve existing brand data fetch for site name and description
- Mobile: single column, stacked sections

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/Footer.tsx
git commit -m "feat: redesign footer with dark broadsheet style and 4-column grid"
```

---

### Task 4: Shared Components — Cards, Newsletter, Author

**Files:**
- Create: `components/ArticleCard.tsx`
- Create: `components/FeaturedCard.tsx`
- Create: `components/NewsletterBanner.tsx`
- Create: `components/NewsletterSidebar.tsx`
- Create: `components/EndOfArticleCTA.tsx`
- Create: `components/AuthorBar.tsx`
- Create: `components/Breadcrumb.tsx`
- Create: `components/Pagination.tsx`

- [ ] **Step 1: Create ArticleCard**

Blog list row: 140x93px thumbnail (3:2) + category label + title (17px serif) + excerpt + author avatar + date. Props: `post` object with `title`, `slug`, `excerpt`, `category`, `featured_image`, `author_name`, `author_image`, `created_date`, `read_time`.

- [ ] **Step 2: Create FeaturedCard**

Large hero treatment: two columns (1.4fr image | 1fr text). 3:2 image ratio. Category + "Featured" label, title (22px serif), excerpt, AuthorBar.

- [ ] **Step 3: Create NewsletterBanner**

Full-width inline capture: warm background, title + description left, email input + submit button right. Mobile: stacked. Read existing `components/LeadCaptureForm.tsx` and `components/NewsletterForm.tsx` to understand the current form submission logic — reuse the submit handler but with new markup.

- [ ] **Step 4: Create NewsletterSidebar**

Sidebar box: warm background, title (13px serif bold) + description + stacked email input + subscribe button. Same form submission logic as NewsletterBanner.

- [ ] **Step 5: Create EndOfArticleCTA**

Post-content capture: 2px top border, warm background, "Enjoyed this article?" title (15px serif bold), description, stacked input + full-width button. Same form submission logic.

- [ ] **Step 6: Create AuthorBar**

Inline component: avatar circle + name (bold) + date + read time. Props: `name`, `imageUrl`, `date`, `readTime`. Used in FeaturedCard, ArticleCard, and article page header.

- [ ] **Step 7: Create Breadcrumb**

Category (accent color) › subcategory link. Props: `category`, `subcategory?`. Updates `StructuredData.tsx` BreadcrumbList to match.

- [ ] **Step 8: Create Pagination**

Numbered page squares (28x28px). Props: `currentPage`, `totalPages`, `baseUrl`. Active page: dark fill. "Next →" link.

- [ ] **Step 9: Verify build**

```bash
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add components/ArticleCard.tsx components/FeaturedCard.tsx components/NewsletterBanner.tsx components/NewsletterSidebar.tsx components/EndOfArticleCTA.tsx components/AuthorBar.tsx components/Breadcrumb.tsx components/Pagination.tsx
git commit -m "feat: add shared editorial components — cards, newsletter CTAs, author, breadcrumb, pagination"
```

---

### Task 5: Home Page Rebuild

**Files:**
- Modify: `app/page.tsx`
- Create: `components/HomeHero.tsx`
- Create: `components/LatestGrid.tsx`
- Create: `components/MoreStories.tsx`

- [ ] **Step 1: Read current home page**

Read `app/page.tsx` to understand existing data fetching (blog posts query, brand data, etc.).

- [ ] **Step 2: Create HomeHero**

Lead story + sidebar. Two columns: 1.3fr (lead with 3:2 image) | 1fr (3 stacked stories with 90x60 thumbnails). Separated by 1px vertical rule. Bottom border. Data: takes array of posts, first = lead, next 3 = sidebar.

- [ ] **Step 3: Create LatestGrid**

3-column grid with vertical rules between columns. Each card: 3:2 image + category + title (14px serif) + excerpt + read time. Section label "Latest" above. Data: array of posts.

- [ ] **Step 4: Create MoreStories**

2-column grid. Each row: 64x43px thumbnail (3:2) + category + title (13px serif) + date + read time. Section label "More Stories" above. Separated by light horizontal and vertical rules.

- [ ] **Step 5: Rebuild app/page.tsx**

Compose: TopBar is in layout. Page renders:
1. HomeHero (posts 0-3)
2. LatestGrid (posts 4-6)
3. NewsletterBanner
4. MoreStories (posts 7-14)

Preserve existing data fetching logic (Supabase query for published posts by tenant). Keep structured data generation. Remove old hero section, blog carousel, and inline newsletter bar references.

- [ ] **Step 6: Verify with dev server**

```bash
npm run dev
```

Check http://localhost:3002 — home page should render with broadsheet layout.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx components/HomeHero.tsx components/LatestGrid.tsx components/MoreStories.tsx
git commit -m "feat: rebuild home page with broadsheet editorial layout"
```

---

### Task 6: Blog Listing Page Rebuild

**Files:**
- Modify: `app/blog/page.tsx`

- [ ] **Step 1: Read current blog listing page**

Read `app/blog/page.tsx` to understand existing data fetching, category filtering, and pagination logic.

- [ ] **Step 2: Rebuild blog listing**

New structure:
1. Page header: Title (28px serif) + description + category filter tabs (desktop) / pills (mobile)
2. FeaturedCard for first post
3. ArticleCard rows for remaining posts
4. Pagination component

Category filter tabs: underline-style active state (2px bottom border + bold). When a category is selected via `?category=X` query param, filter posts and update page title.

Preserve existing Supabase query but restructure the rendering.

- [ ] **Step 3: Verify with dev server**

```bash
npm run dev
```

Check http://localhost:3002/blog — listing should render with editorial layout and category filtering.

- [ ] **Step 4: Commit**

```bash
git add app/blog/page.tsx
git commit -m "feat: rebuild blog listing with editorial cards, category tabs, and pagination"
```

---

### Task 7: Article Page Rebuild

**Files:**
- Modify: `app/blog/[slug]/page.tsx`
- Create: `components/TableOfContents.tsx`
- Create: `components/AffiliateBox.tsx`
- Create: `components/PullQuote.tsx`

- [ ] **Step 1: Read current article page**

Read `app/blog/[slug]/page.tsx` to understand data fetching, metadata generation, structured data, related posts, and existing component usage (BlogTracker, ArticleReactions, ArticleComments, RelatedPosts).

- [ ] **Step 2: Create TableOfContents**

Extracts H2 headings from article HTML content. Desktop: sticky sidebar list with active state tracking. Mobile (≤768px): collapsible box above article body. Client component for scroll tracking.

- [ ] **Step 3: Create AffiliateBox**

"Editor's Pick" product box. Props: `name`, `description`, `rating`, `reviewCount`, `price`, `imageUrl`, `dealUrl`. Styled with 1px border, warm surface background. Desktop: horizontal (text left, image+price right). Mobile: compact horizontal (60x60 image left, text + CTA right).

Note: Affiliate data comes from the article content itself (injected by Doubleclicker during content generation). For now, this component can be rendered when specific markup patterns are detected in the HTML, or as a standalone component placed by the article template.

- [ ] **Step 4: Create PullQuote**

Blockquote with 3px left border, 16px Georgia italic text, attribution below. Props: `quote`, `attribution`.

- [ ] **Step 5: Rebuild article page**

New structure:
1. Breadcrumb
2. Article header (centered, max-width 680px): label + title (32px) + subtitle (italic) + AuthorBar
3. Two-column layout (max-width 960px): Main content | Sidebar (260px)
4. Main: Hero image (3:2) + caption + article body (serif 14px/1.75) + EndOfArticleCTA
5. Sidebar: TableOfContents + NewsletterSidebar + RelatedPosts (restyled)
6. Mobile: single column, collapsible TOC above body, sidebar sections after article

Preserve:
- `generateMetadata()` for SEO
- BlogTracker component
- ArticleReactions and ArticleComments (restyle to match)
- StructuredData generation
- Related posts data fetching

Article body styling: Apply serif typography, section dividers (1px rule above H2s), link styling with accent color underlines.

- [ ] **Step 6: Update StructuredData for breadcrumbs**

Read `components/StructuredData.tsx` and update the BreadcrumbList generation to match the new Breadcrumb component structure (Home → Category → Article).

- [ ] **Step 7: Verify with dev server**

```bash
npm run dev
```

Check a blog post page — should render with two-column editorial layout, sidebar TOC, and end-of-article CTA.

- [ ] **Step 8: Commit**

```bash
git add app/blog/[slug]/page.tsx components/TableOfContents.tsx components/AffiliateBox.tsx components/PullQuote.tsx components/StructuredData.tsx
git commit -m "feat: rebuild article page with editorial layout, sidebar TOC, and affiliate boxes"
```

---

### Task 8: About Page Rebuild

**Files:**
- Modify: `app/about/page.tsx`
- Create: `components/WriterCard.tsx`

- [ ] **Step 1: Read current about page**

Read `app/about/page.tsx` to understand data fetching (author data from Supabase).

- [ ] **Step 2: Create WriterCard**

Author bio card: 52px circle avatar + name (14px serif bold) + role (10px accent) + bio (11px). Props: `name`, `role`, `bio`, `imageUrl`. Separated by light rules.

- [ ] **Step 3: Rebuild about page**

New structure:
1. Header: "About" label (accent) + title (24px serif) + mission statement (13px serif, max-width 520px)
2. Body content: mission paragraphs (Georgia 13px/1.75, max-width 560px)
3. "Our Writers" section: WriterCard for each author from database
4. Newsletter CTA at bottom (warm background)

- [ ] **Step 4: Verify with dev server**

- [ ] **Step 5: Commit**

```bash
git add app/about/page.tsx components/WriterCard.tsx
git commit -m "feat: rebuild about page with editorial writer cards"
```

---

### Task 9: Contact Page Rebuild

**Files:**
- Modify: `app/contact/page.tsx`
- Read: `app/contact/ContactForm.tsx` (preserve form logic)

- [ ] **Step 1: Read current contact page and form**

Read `app/contact/page.tsx` and `app/contact/ContactForm.tsx` to understand form submission logic.

- [ ] **Step 2: Rebuild contact page**

New structure:
1. Header: "Contact" label (accent) + title (24px serif) + description
2. Two-column layout: Form (1.3fr) | Contact info (1fr), separated by 1px vertical rule
3. Form: Name, Email, Subject, Message fields with uppercase labels (10px) + dark submit button
4. Info column: Email, Press, Partnerships sections + Response time info box (warm bg)
5. Mobile: single column, form on top, info below

Preserve existing `ContactForm.tsx` submission logic — restyle the form inputs and labels.

- [ ] **Step 3: Verify with dev server**

- [ ] **Step 4: Commit**

```bash
git add app/contact/page.tsx
git commit -m "feat: rebuild contact page with two-column editorial layout"
```

---

### Task 10: Responsive Polish & Mobile Menu

**Files:**
- Multiple files modified in previous tasks

- [ ] **Step 1: Add responsive media queries**

Go through each component and ensure proper breakpoint handling:
- `> 1024px`: Full desktop (multi-column, sidebar)
- `768-1024px`: Tablet (reduce columns 3→2, collapse article sidebar)
- `< 768px`: Mobile (single column, hamburger, category pills, collapsible TOC)

Key responsive rules:
- HomeHero: 2-col → stacked on mobile
- LatestGrid: 3-col → 2-col tablet → 1-col mobile
- MoreStories: 2-col → 1-col mobile
- Article: 2-col + sidebar → single column mobile
- Footer: 4-col → 2-col tablet → 1-col mobile
- TopBar: hidden on mobile (< 768px)
- CategoryNav: hidden on mobile, CategoryPills shown instead
- Padding: 32px desktop → 16px mobile

- [ ] **Step 2: Test at each breakpoint**

```bash
npm run dev
```

Test at 1280px, 1024px, 768px, 375px viewports.

- [ ] **Step 3: Commit**

```bash
git commit -am "fix: responsive polish across all editorial components"
```

---

### Task 11: BrandStyles Verification & Theme Mapping

**Files:**
- Modify: `components/BrandStyles.tsx`

- [ ] **Step 1: Read BrandStyles.tsx**

Read `components/BrandStyles.tsx` to understand how brand CSS variables are injected.

- [ ] **Step 2: Verify variable mapping**

Ensure the BrandStyles component maps brand data to the new CSS variable names:
- `brand_specifications.primary_color` → `--color-primary` (used for masthead, active nav)
- `brand_specifications.accent_color` → `--color-accent` (used for category labels, section labels)
- `brand_specifications.heading_font` → `--font-heading` (replaces Georgia for headings)
- `brand_specifications.body_font` → `--font-body` (replaces Georgia for body)
- Brand logo → used in Masthead component (image vs text)

If new variable names don't match what BrandStyles injects, update either BrandStyles or the components to align.

- [ ] **Step 3: Test with a tenant that has custom brand colors**

Set `NEXT_PUBLIC_BRAND_USERNAME` to a known tenant with custom colors and verify the editorial layout adapts correctly.

- [ ] **Step 4: Commit if changes needed**

```bash
git add components/BrandStyles.tsx
git commit -m "fix: align BrandStyles variable injection with editorial design tokens"
```

---

### Task 12: Final Cleanup & Verification

**Files:**
- Remove: `app/globals.css.backup` (if build succeeds)
- Remove: any unused old components (BlogCarousel, InlineNewsletterBar if fully replaced)

- [ ] **Step 1: Remove backup and unused components**

Check if these components are still imported anywhere:
- `components/BlogCarousel.tsx` — likely replaced by HomeHero + LatestGrid
- `components/InlineNewsletterBar.tsx` — likely replaced by NewsletterBanner

If no longer imported, delete them. Remove `globals.css.backup`.

- [ ] **Step 2: Full build verification**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Lint check**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 4: Verify all technical integrations**

Check in the browser at `http://localhost:3002`:
- [ ] GA4 script loads (check network tab for google-analytics.com requests)
- [ ] GTM container loads (check for googletagmanager.com requests)
- [ ] Cookie consent banner appears on first visit
- [ ] Structured data (JSON-LD) is present in page source
- [ ] Blog tracker fires on article page
- [ ] SEO meta tags (title, description, og:image) render correctly
- [ ] Breadcrumb structured data matches visible breadcrumbs

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: cleanup unused components and verify editorial redesign"
```
