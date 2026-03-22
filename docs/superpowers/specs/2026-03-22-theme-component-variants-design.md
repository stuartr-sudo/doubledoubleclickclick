# Theme Component Variants Design Spec

**Date:** 2026-03-22
**Status:** Draft
**Scope:** Full page component variants for Editorial, Boutique, and Modern themes
**Builds on:** `2026-03-21-site-themes-design.md` (CSS variables, DB column, BrandStyles)

## Overview

The CSS-only approach from the initial themes spec provides color/font theming but doesn't create enough visual distinction between themes. This spec adds **component variants** — each theme gets its own Header, HomePage, and BlogPost components with distinct layouts, while sharing the same data layer and CSS variable system.

## Architecture

### Folder Structure

```
components/themes/
  ThemeRenderer.tsx       ← Server component: picks correct theme components
  editorial/
    Header.tsx            ← Newspaper masthead (current SiteHeader)
    HomePage.tsx          ← Newspaper grid (current HomeHero + LatestGrid + MoreStories)
    BlogPost.tsx          ← Two-column sidebar (current blog/[slug] layout)
  boutique/
    Header.tsx            ← Centered logo, pill nav, no date bar
    HomePage.tsx          ← Pinterest-style masonry card grid
    BlogPost.tsx          ← Warm single-column, soft CTAs
  modern/
    Header.tsx            ← Compact logo-left, nav-right, single row
    HomePage.tsx          ← Clean grid, bold typography, minimal
    BlogPost.tsx          ← Sleek two-column, monospace tags
```

### Data Flow

Data fetching stays in `app/` pages. Theme components receive data as props. No theme component fetches its own data.

```tsx
// app/page.tsx
export default async function HomePage() {
  const config = getTenantConfig()
  const [brand, posts] = await Promise.all([
    getBrandData(),
    getPublishedPosts(20),
  ])
  const theme = brand.specs?.theme || 'editorial'

  return (
    <main>
      <ThemeHomePage theme={theme} brand={brand} posts={posts} config={config} />
    </main>
  )
}
```

### ThemeRenderer Pattern

```tsx
// components/themes/ThemeRenderer.tsx
import EditorialHomePage from './editorial/HomePage'
import BoutiqueHomePage from './boutique/HomePage'
import ModernHomePage from './modern/HomePage'
// ... same for Header, BlogPost

const HOME_PAGES = {
  editorial: EditorialHomePage,
  boutique: BoutiqueHomePage,
  modern: ModernHomePage,
}

export function ThemeHomePage({ theme, ...props }) {
  const Component = HOME_PAGES[theme] || HOME_PAGES.editorial
  return <Component {...props} />
}

// Same pattern for ThemeHeader, ThemeBlogPost
```

### Shared Props Interfaces

```typescript
// components/themes/types.ts
import type { BlogPost } from '@/lib/posts'
import type { BrandData } from '@/lib/brand'

export interface HomePageProps {
  brand: BrandData
  posts: BlogPost[]
  config: { username: string; siteName: string; siteUrl: string }
}

export interface HeaderProps {
  brandName: string
  logoUrl?: string
  tagline?: string
  categories: string[]
}

export interface BlogPostPageProps {
  brand: BrandData
  post: BlogPost
  relatedPosts: BlogPost[]
  config: { username: string; siteName: string; siteUrl: string }
}
```

## Editorial Theme (Current — Extract & Refactor)

Move existing components into `components/themes/editorial/`. No visual changes.

### Editorial Header
- 3-row: date bar, centered masthead, horizontal category nav
- Dark top accent bar
- Current `SiteHeader.tsx` component logic

### Editorial HomePage
- Lead story (large image + headline) with 3 sidebar story cards
- "LATEST" 3-column grid section
- Newsletter banner
- Product spotlight
- "MORE STORIES" compact list
- Current `HomeHero`, `LatestGrid`, `MoreStories` component logic

### Editorial BlogPost
- Two-column: article body (left) + sidebar with TOC + newsletter (right)
- Serif body text (Georgia)
- Article reactions + comments at bottom
- Current `blog/[slug]/page.tsx` layout

## Boutique Theme — Pinterest/Lifestyle Magazine

### Boutique Header
- No date bar
- Centered logo/brand name with optional tagline underneath
- Category navigation as rounded pill buttons with warm background
- Softer, more inviting feel
- Mobile: simplified centered logo + hamburger with pill categories

### Boutique HomePage

**Hero Section:**
- Full-width featured post card
- Large rounded image (12px radius)
- Warm gradient overlay at bottom with title + excerpt
- Category badge with rounded background
- Author avatar + name + date

**Card Grid:**
- Masonry-style 2-3 column responsive grid
- Each card: large image, rounded corners, soft box-shadow
- Warm category badges with colored backgrounds
- Author name + reading time below each card
- Generous spacing between cards (24px gap)
- Newsletter signup card mixed into the grid (same card styling)
- Product spotlight card in the grid flow (matching card style)

**Bottom Section:**
- Warm full-width CTA banner with newsletter signup
- Soft background color, rounded input + button

### Boutique BlogPost

**Header:**
- Centered category badge (rounded pill)
- Large title in sans-serif (DM Sans)
- Subtitle/excerpt in italic
- Author bar: avatar, name, date, read time — centered

**Body:**
- Single wider column (max-width: 720px, centered)
- No sidebar (TOC as a collapsible mobile-style dropdown at top)
- Generous paragraph spacing
- Rounded image corners throughout
- Pull quotes with warm accent border
- Soft CTA card mid-article (newsletter)

**Footer:**
- Warm "End of Article" CTA with newsletter signup
- Related posts as horizontal scrollable cards
- Article reactions + comments

## Modern Theme — Vercel/Linear Tech Blog

### Modern Header
- Single row: logo left-aligned, horizontal nav right-aligned
- Thin bottom border, no background color
- Nav items: uppercase monospace, small, letterspaced
- Clean, minimal, no decorative elements
- Mobile: logo + compact menu icon

### Modern HomePage

**Hero Section:**
- Featured post: bold large headline (24-32px Inter), minimal image
- Accent color underline on category
- Clean reading time + date display
- No overlay — image sits above, text below

**Card Grid:**
- Clean 3-column grid with thin borders between columns
- Each card: image (sharp corners or very slight 4px radius), category in monospace uppercase, bold title, 2-line excerpt
- No shadows, thin bottom borders as separators
- Reading time prominently displayed
- Very clean separator lines between sections ("LATEST", "MORE")

**Interstitial:**
- Product spotlight as a clean bordered card (no background, thin border)
- Newsletter as minimal inline form

### Modern BlogPost

**Header:**
- Category in monospace uppercase with accent color
- Large bold title (Inter 700)
- Author bar: compact, left-aligned, no avatar (just name + date + read time)
- Thin separator line

**Body:**
- Two-column: article body (left) + sidebar (right) — same structure as Editorial but sans-serif
- Clean sans-serif body text (Inter)
- Code-style callout boxes (light gray background, monospace font for tips)
- Sharp images (4-8px radius max)
- Clean tables with subtle zebra striping

**Footer:**
- Sharp CTA button (accent color, no rounded corners)
- Related posts as minimal text-only list
- Article reactions + comments

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `components/themes/types.ts` | Shared prop interfaces |
| `components/themes/ThemeRenderer.tsx` | Theme component selector |
| `components/themes/editorial/Header.tsx` | Extracted from SiteHeader |
| `components/themes/editorial/HomePage.tsx` | Extracted from current homepage components |
| `components/themes/editorial/BlogPost.tsx` | Extracted from current blog/[slug] layout |
| `components/themes/boutique/Header.tsx` | New: centered logo, pill nav |
| `components/themes/boutique/HomePage.tsx` | New: Pinterest masonry layout |
| `components/themes/boutique/BlogPost.tsx` | New: warm single-column |
| `components/themes/modern/Header.tsx` | New: compact logo-left nav-right |
| `components/themes/modern/HomePage.tsx` | New: clean grid, bold type |
| `components/themes/modern/BlogPost.tsx` | New: sleek two-column |

### Modified Files
| File | Change |
|------|--------|
| `app/page.tsx` | Use `ThemeHomePage` instead of direct components |
| `app/blog/[slug]/page.tsx` | Use `ThemeBlogPost` instead of direct layout |
| `app/layout.tsx` | Use `ThemeHeader` instead of `SiteHeaderServer` |

### Unchanged
- `lib/themes.ts` — CSS variable presets (already done)
- `lib/brand.ts` — data fetching (already done)
- `components/BrandStyles.tsx` — CSS injection (already done)
- `app/globals.css` — base styles + theme overrides (already done)
- `app/api/provision/route.ts` — theme storage (already done)

## Shared Components (Used by All Themes)

These components are theme-agnostic and used by all three themes:
- `ProductSpotlight` — product cards (styling adapts via CSS variables)
- `NewsletterBanner` / `NewsletterSidebar` — newsletter forms
- `ArticleReactions` — thumbs up/down
- `ArticleComments` — comments section
- `RelatedPosts` — related articles
- `Footer` — site footer (styled via CSS variables)
- `BlogTracker` — analytics tracking
- `TableOfContents` — TOC component

## Testing

- Provision a site with each theme, verify visual output
- Toggle demo site between all 3 themes via DB, verify each renders correctly
- Verify mobile responsive layout for all 3 themes
- Verify shared components (newsletter, reactions, comments, product spotlight) render correctly in all themes
- Verify existing editorial sites are not affected (backwards compatible)
