# Theme Component Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create full page component variants (Header, HomePage, BlogPost) for Editorial, Boutique, and Modern themes so each theme produces a visually distinct site.

**Architecture:** Theme components live in `components/themes/{theme}/`. App pages fetch data and pass to `ThemeRenderer` which selects the correct component. All themes share the same data layer, CSS variable system, and shared components (newsletter, reactions, comments, products).

**Tech Stack:** Next.js 14 App Router, TypeScript, CSS custom properties, inline styles

**Spec:** `docs/superpowers/specs/2026-03-22-theme-component-variants-design.md`

---

### Task 1: Create shared types and ThemeRenderer

**Files:**
- Create: `components/themes/types.ts`
- Create: `components/themes/ThemeRenderer.tsx`

- [ ] **Step 1: Create types file**

Create `components/themes/types.ts`:

```typescript
import type { BlogPost } from '@/lib/posts'
import type { BrandData } from '@/lib/brand'

export interface TenantConfig {
  username: string
  siteName: string
  siteUrl: string
}

export interface HomePageProps {
  brand: BrandData
  posts: BlogPost[]
  config: TenantConfig
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
  config: TenantConfig
}
```

- [ ] **Step 2: Create ThemeRenderer**

Create `components/themes/ThemeRenderer.tsx` — starts with just editorial placeholder exports. Boutique and Modern will be added as they're built:

```typescript
import type { HomePageProps, HeaderProps, BlogPostPageProps } from './types'
import type { ThemeName } from '@/lib/themes'

// Editorial (extracted from existing components)
import EditorialHeader from './editorial/Header'
import EditorialHomePage from './editorial/HomePage'
import EditorialBlogPost from './editorial/BlogPost'

// Theme component maps — Boutique and Modern added as they're built
const HEADERS: Record<string, React.ComponentType<HeaderProps>> = {
  editorial: EditorialHeader,
}

const HOME_PAGES: Record<string, React.ComponentType<HomePageProps>> = {
  editorial: EditorialHomePage,
}

const BLOG_POSTS: Record<string, React.ComponentType<BlogPostPageProps>> = {
  editorial: EditorialBlogPost,
}

export function ThemeHeader({ theme, ...props }: HeaderProps & { theme: string }) {
  const Component = HEADERS[theme] || HEADERS.editorial
  return <Component {...props} />
}

export function ThemeHomePage({ theme, ...props }: HomePageProps & { theme: string }) {
  const Component = HOME_PAGES[theme] || HOME_PAGES.editorial
  return <Component {...props} />
}

export function ThemeBlogPost({ theme, ...props }: BlogPostPageProps & { theme: string }) {
  const Component = BLOG_POSTS[theme] || BLOG_POSTS.editorial
  return <Component {...props} />
}
```

Note: This will NOT build until Task 2 creates the editorial components. That's expected.

- [ ] **Step 3: Commit**

```bash
git add components/themes/types.ts components/themes/ThemeRenderer.tsx
git commit -m "feat: add theme types and ThemeRenderer scaffold"
```

---

### Task 2: Extract Editorial Header

**Files:**
- Create: `components/themes/editorial/Header.tsx`
- Reference: `components/SiteHeader.tsx` (read-only — do NOT modify)

- [ ] **Step 1: Create Editorial Header**

Create `components/themes/editorial/Header.tsx`. This is a SERVER component that accepts `HeaderProps` and renders the editorial header layout. Extract the visual structure from the existing `SiteHeader.tsx` but as a server component receiving props (no data fetching inside).

Read `/Users/stuarta/Documents/GitHub/doubleclicker-1/components/SiteHeader.tsx` for the full current implementation. The editorial header must include:

1. **Desktop layout:**
   - Top bar with date + "Subscribe to our newsletter →" link
   - Centered masthead with brand name (or logo image)
   - Horizontal category nav with links

2. **Mobile layout:**
   - Compact header with brand name + hamburger icon
   - Category pills (horizontal scroll)

The component receives `{ brandName, logoUrl, tagline, categories }` from `HeaderProps`. It must use CSS variables for all colors/fonts (e.g., `var(--font-serif)`, `var(--color-text)`, `var(--color-border)`).

Important: The editorial header needs client-side interactivity for the mobile menu toggle. Use a small client component for just the mobile menu state, keeping the rest server-rendered.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Note: May not build yet if ThemeRenderer imports are unresolved. That's OK — we're building incrementally.

- [ ] **Step 3: Commit**

```bash
git add components/themes/editorial/Header.tsx
git commit -m "feat: extract Editorial Header component"
```

---

### Task 3: Extract Editorial HomePage

**Files:**
- Create: `components/themes/editorial/HomePage.tsx`
- Reference: `components/HomeHero.tsx`, `components/LatestGrid.tsx`, `components/MoreStories.tsx` (read-only)

- [ ] **Step 1: Create Editorial HomePage**

Create `components/themes/editorial/HomePage.tsx`. This receives `HomePageProps` and renders the current homepage layout:

1. Read these files for reference:
   - `/Users/stuarta/Documents/GitHub/doubleclicker-1/components/HomeHero.tsx`
   - `/Users/stuarta/Documents/GitHub/doubleclicker-1/components/LatestGrid.tsx`
   - `/Users/stuarta/Documents/GitHub/doubleclicker-1/components/MoreStories.tsx`

2. Compose them into a single Editorial HomePage component:
   - HomeHero (posts 0-3): lead story + sidebar stories + ProductSpotlight
   - LatestGrid (posts 4-6): 3-column grid
   - ProductSpotlight (offset=1): between Latest and Newsletter
   - NewsletterBanner: newsletter signup
   - MoreStories (posts 7+): compact two-column list

The component can import and use the existing sub-components (`HomeHero`, `LatestGrid`, `MoreStories`, `ProductSpotlight`, `NewsletterBanner`) directly — no need to duplicate their code. Just compose them with the correct props.

```typescript
import type { HomePageProps } from '../types'
import HomeHero from '@/components/HomeHero'
import LatestGrid from '@/components/LatestGrid'
import NewsletterBanner from '@/components/NewsletterBanner'
import MoreStories from '@/components/MoreStories'
import ProductSpotlight from '@/components/ProductSpotlight'

export default function EditorialHomePage({ brand, posts, config }: HomePageProps) {
  return (
    <div className="container" style={{ paddingTop: '24px' }}>
      <HomeHero posts={posts.slice(0, 4)} />
      <LatestGrid posts={posts.slice(4, 7)} />
      <div style={{ marginBottom: '24px' }}>
        <ProductSpotlight limit={1} offset={1} />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <NewsletterBanner username={config.username} />
      </div>
      <MoreStories posts={posts.slice(7)} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/themes/editorial/HomePage.tsx
git commit -m "feat: extract Editorial HomePage component"
```

---

### Task 4: Extract Editorial BlogPost

**Files:**
- Create: `components/themes/editorial/BlogPost.tsx`
- Reference: `app/blog/[slug]/page.tsx` (read-only)

- [ ] **Step 1: Create Editorial BlogPost**

Create `components/themes/editorial/BlogPost.tsx`. Read the current `app/blog/[slug]/page.tsx` for the full layout. This component receives `BlogPostPageProps` and renders the editorial article layout:

1. Read `/Users/stuarta/Documents/GitHub/doubleclicker-1/app/blog/[slug]/page.tsx` for the complete current implementation.

2. Extract ONLY the JSX rendering (everything inside `<main>...</main>`) into this component. Do NOT include `generateMetadata`, JSON-LD schema generation, or data fetching — those stay in the app page.

3. The component receives `{ brand, post, config }` from `BlogPostPageProps`.

4. It must include:
   - Breadcrumb
   - Centered article header (category, title, meta description, AuthorBar)
   - Two-column layout: article body (left) + sidebar with TOC + NewsletterSidebar (right)
   - Featured image
   - EndOfArticleCTA
   - ArticleReactions + ArticleComments
   - RelatedPosts
   - Embedded `<style>` block for `.article-body-content` and responsive overrides

5. Import shared components: `Breadcrumb`, `AuthorBar`, `TableOfContents`, `NewsletterSidebar`, `EndOfArticleCTA`, `ArticleReactions`, `ArticleComments`, `RelatedPosts`, `Image` from next/image.

- [ ] **Step 2: Commit**

```bash
git add components/themes/editorial/BlogPost.tsx
git commit -m "feat: extract Editorial BlogPost component"
```

---

### Task 5: Wire app pages to ThemeRenderer + verify editorial works

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/blog/[slug]/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update app/page.tsx**

Read the current `/Users/stuarta/Documents/GitHub/doubleclicker-1/app/page.tsx`. Replace the direct component imports with `ThemeHomePage`:

```typescript
import { getBrandData } from '@/lib/brand'
import { getPublishedPosts } from '@/lib/posts'
import { getTenantConfig } from '@/lib/tenant'
import { ThemeHomePage } from '@/components/themes/ThemeRenderer'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  // ... keep existing metadata logic unchanged
}

export default async function HomePage() {
  const config = getTenantConfig()
  const [brand, posts] = await Promise.all([
    getBrandData(),
    getPublishedPosts(20),
  ])
  const theme = brand.specs?.theme || 'editorial'

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <ThemeHomePage theme={theme} brand={brand} posts={posts} config={config} />
    </main>
  )
}
```

- [ ] **Step 2: Update app/blog/[slug]/page.tsx**

Read the current file. Keep `generateMetadata` and JSON-LD schema generation in the app page. Replace the JSX rendering with `ThemeBlogPost`:

Keep all the existing logic for:
- `generateMetadata`
- JSON-LD `articleJsonLd` and `breadcrumbJsonLd` generation
- `BlogTracker`

Replace the main content rendering with:
```tsx
<ThemeBlogPost theme={theme} brand={brand} post={post} config={config} />
```

The page should look like:
```typescript
import { ThemeBlogPost } from '@/components/themes/ThemeRenderer'
// ... other imports for metadata, schema, tracker

export default async function BlogPostPage({ params }) {
  const config = getTenantConfig()
  const brand = await getBrandData()
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()
  const theme = brand.specs?.theme || 'editorial'

  // ... JSON-LD schema generation stays here ...

  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <BlogTracker slug={post.slug} title={post.title} category={post.category || undefined} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ThemeBlogPost theme={theme} brand={brand} post={post} config={config} />
    </main>
  )
}
```

- [ ] **Step 3: Update app/layout.tsx**

Read the current file. Replace `SiteHeaderServer` with `ThemeHeader`. The layout needs to fetch categories and pass them to the header.

Find the `SiteHeaderServer` usage and replace with:
```tsx
import { ThemeHeader } from '@/components/themes/ThemeRenderer'
import { getCategories } from '@/lib/posts'

// Inside RootLayout, after getBrandData():
const categories = await getCategories().catch(() => [] as string[])
const brandName = brand?.guidelines?.name || config.siteName
const logoUrl = brand?.specs?.logo_url || undefined
const tagline = brand?.company?.blurb || ''

// In the JSX, replace <SiteHeaderServer /> with:
<ThemeHeader
  theme={themeName}
  brandName={brandName}
  logoUrl={logoUrl}
  tagline={tagline}
  categories={categories}
/>
```

Remove the `SiteHeaderServer` import.

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | tail -10`
Expected: Build succeeds, site looks identical to before (editorial theme only)

- [ ] **Step 5: Verify on live site**

Deploy and check `https://doubledoubleclickclick.fly.dev/` looks exactly the same as before. No visual changes — we've just refactored the component structure.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/blog/\[slug\]/page.tsx app/layout.tsx
git commit -m "refactor: wire app pages to ThemeRenderer (editorial only, no visual change)"
```

---

### Task 6: Build Boutique Header

**Files:**
- Create: `components/themes/boutique/Header.tsx`
- Modify: `components/themes/ThemeRenderer.tsx` (add boutique import)

- [ ] **Step 1: Create Boutique Header**

Create `components/themes/boutique/Header.tsx` implementing `HeaderProps`:

**Desktop layout:**
- No date bar
- Centered brand name in friendly sans-serif (uses `var(--font-heading)`)
- Optional tagline underneath in smaller text
- Category nav as rounded pill buttons with warm background (`var(--color-bg-warm)`)
- Generous padding, warm feel

**Mobile layout:**
- Centered brand name
- Hamburger menu icon
- Category pills on scroll

Use CSS variables throughout. All inline styles. Include a `<style>` tag for responsive breakpoints.

- [ ] **Step 2: Register in ThemeRenderer**

Add import and entry to `HEADERS` map in ThemeRenderer.tsx:
```typescript
import BoutiqueHeader from './boutique/Header'
// In HEADERS:
boutique: BoutiqueHeader,
```

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add components/themes/boutique/Header.tsx components/themes/ThemeRenderer.tsx
git commit -m "feat: add Boutique Header (centered logo, pill nav)"
```

---

### Task 7: Build Boutique HomePage

**Files:**
- Create: `components/themes/boutique/HomePage.tsx`
- Modify: `components/themes/ThemeRenderer.tsx` (add boutique import)

- [ ] **Step 1: Create Boutique HomePage**

Create `components/themes/boutique/HomePage.tsx` implementing `HomePageProps`:

**Structure (Pinterest/lifestyle magazine):**

1. **Hero**: Full-width featured post card with large rounded image, warm gradient overlay at bottom, category badge, title + excerpt over the image
2. **Card Grid**: CSS Grid with `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` for masonry-like responsive layout. Each card:
   - Large image with 12px border-radius
   - Soft box-shadow: `0 2px 12px rgba(0,0,0,0.08)`
   - Category badge with rounded background
   - Title + 2-line excerpt
   - Author name + reading time
   - Generous padding (16-20px)
3. **Newsletter card**: Mixed into the grid, same card styling but with email input
4. **ProductSpotlight**: In the grid flow
5. **Bottom CTA**: Warm newsletter banner

Use posts[0] for hero, posts[1:] for card grid. Import `ProductSpotlight`, `NewsletterBanner` from shared components. Import `Image` from next/image, `Link` from next/link. Import `getPostDate`, `estimateReadTime` from `@/lib/posts`.

- [ ] **Step 2: Register in ThemeRenderer**

Add import and entry to `HOME_PAGES` map.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add components/themes/boutique/HomePage.tsx components/themes/ThemeRenderer.tsx
git commit -m "feat: add Boutique HomePage (Pinterest-style masonry cards)"
```

---

### Task 8: Build Boutique BlogPost

**Files:**
- Create: `components/themes/boutique/BlogPost.tsx`
- Modify: `components/themes/ThemeRenderer.tsx` (add boutique import)

- [ ] **Step 1: Create Boutique BlogPost**

Create `components/themes/boutique/BlogPost.tsx` implementing `BlogPostPageProps`:

**Structure (warm single-column):**

1. **Header** (centered):
   - Category as rounded pill badge with warm background
   - Large title in `var(--font-heading)` (DM Sans via theme)
   - Subtitle/excerpt in italic
   - Author bar centered: avatar placeholder circle + name + date + read time

2. **Body** (single column, centered, max-width: 720px):
   - No sidebar — TOC as collapsible section at top of article
   - Article content via `dangerouslySetInnerHTML`
   - Generous line-height (1.8), paragraph spacing
   - All images get `border-radius: var(--border-radius)`

3. **Footer**:
   - EndOfArticleCTA
   - ArticleReactions + ArticleComments
   - RelatedPosts

Import shared components: `ArticleReactions`, `ArticleComments`, `RelatedPosts`, `EndOfArticleCTA`, `TableOfContents`, `Image` from next/image. Import `getPostDate`, `estimateReadTime` from `@/lib/posts`.

Include embedded `<style>` for `.boutique-article-body` with warm styling.

- [ ] **Step 2: Register in ThemeRenderer**

Add import and entry to `BLOG_POSTS` map.

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add components/themes/boutique/BlogPost.tsx components/themes/ThemeRenderer.tsx
git commit -m "feat: add Boutique BlogPost (warm single-column)"
```

---

### Task 9: Build Modern Header

**Files:**
- Create: `components/themes/modern/Header.tsx`
- Modify: `components/themes/ThemeRenderer.tsx` (add modern import)

- [ ] **Step 1: Create Modern Header**

Create `components/themes/modern/Header.tsx` implementing `HeaderProps`:

**Desktop layout:**
- Single row: logo/brand name left-aligned, category nav right-aligned
- `display: flex; justify-content: space-between; align-items: center`
- Thin bottom border (`1px solid var(--color-border)`)
- Nav items: uppercase, monospace-style (`var(--font-sans)`), small font, letterspaced
- No decorative elements, no date bar, no background color
- Compact padding (12-16px vertical)

**Mobile layout:**
- Logo left, compact menu icon right
- Categories in dropdown/slidedown

- [ ] **Step 2: Register in ThemeRenderer**

Add import and entry to `HEADERS` map.

- [ ] **Step 3: Verify build + Commit**

```bash
git add components/themes/modern/Header.tsx components/themes/ThemeRenderer.tsx
git commit -m "feat: add Modern Header (compact logo-left, nav-right)"
```

---

### Task 10: Build Modern HomePage

**Files:**
- Create: `components/themes/modern/HomePage.tsx`
- Modify: `components/themes/ThemeRenderer.tsx` (add modern import)

- [ ] **Step 1: Create Modern HomePage**

Create `components/themes/modern/HomePage.tsx` implementing `HomePageProps`:

**Structure (Vercel/Linear tech blog):**

1. **Hero**: Featured post with bold large headline (24-32px), image above text (no overlay), accent-colored category label in uppercase monospace, clean date + reading time
2. **Card Grid**: Clean 3-column CSS Grid. Each card:
   - Image with slight radius (4-8px) or sharp corners
   - Category in monospace uppercase with accent color
   - Bold title
   - 2-line excerpt in secondary color
   - Reading time
   - Thin bottom border separators, no shadows
3. **Interstitial**: ProductSpotlight as clean bordered card (thin border, no background)
4. **Newsletter**: Minimal inline form (NewsletterBanner)
5. **More Posts**: Compact list with minimal decoration

- [ ] **Step 2: Register in ThemeRenderer**

Add import and entry to `HOME_PAGES` map.

- [ ] **Step 3: Verify build + Commit**

```bash
git add components/themes/modern/HomePage.tsx components/themes/ThemeRenderer.tsx
git commit -m "feat: add Modern HomePage (clean grid, bold typography)"
```

---

### Task 11: Build Modern BlogPost

**Files:**
- Create: `components/themes/modern/BlogPost.tsx`
- Modify: `components/themes/ThemeRenderer.tsx` (add modern import)

- [ ] **Step 1: Create Modern BlogPost**

Create `components/themes/modern/BlogPost.tsx` implementing `BlogPostPageProps`:

**Structure (sleek two-column):**

1. **Header** (left-aligned):
   - Category in monospace uppercase with accent color
   - Large bold title in `var(--font-heading)` (Inter via theme)
   - Compact author bar: name + date + read time, no avatar
   - Thin separator line

2. **Body** (two-column like editorial but sans-serif):
   - Left: article content + EndOfArticleCTA + reactions/comments
   - Right sidebar: TOC + NewsletterSidebar
   - Sans-serif body text (Inter)
   - Clean images with 4-8px radius
   - Code-style tip boxes (light gray bg, monospace font)

3. **Footer**:
   - RelatedPosts as minimal text list
   - ArticleReactions + ArticleComments

Include embedded `<style>` for `.modern-article-body` with clean styling, zebra-striped tables, code-style blockquotes.

- [ ] **Step 2: Register in ThemeRenderer**

Add import and entry to `BLOG_POSTS` map.

- [ ] **Step 3: Verify build + Commit**

```bash
git add components/themes/modern/BlogPost.tsx components/themes/ThemeRenderer.tsx
git commit -m "feat: add Modern BlogPost (sleek two-column, monospace tags)"
```

---

### Task 12: Full build + deploy + verify all themes

**Files:**
- No code changes — verification only

- [ ] **Step 1: Full build**

```bash
npx next build 2>&1 | tail -15
```
Expected: Clean build, no errors.

- [ ] **Step 2: Push + deploy**

```bash
git push origin main
fly deploy --app doubledoubleclickclick --depot=false
```

- [ ] **Step 3: Test Editorial theme**

```sql
UPDATE brand_specifications SET theme = 'editorial' WHERE user_name = 'demo-site';
```
Hard refresh site. Verify: newspaper masthead, date bar, serif fonts, sidebar layout.

- [ ] **Step 4: Test Boutique theme**

```sql
UPDATE brand_specifications SET theme = 'boutique' WHERE user_name = 'demo-site';
```
Hard refresh. Verify: centered logo, pill nav, masonry cards, DM Sans font, rounded corners.

- [ ] **Step 5: Test Modern theme**

```sql
UPDATE brand_specifications SET theme = 'modern' WHERE user_name = 'demo-site';
```
Hard refresh. Verify: compact header, clean grid, Inter font, blue accent, monospace categories.

- [ ] **Step 6: Test a blog post in each theme**

Click into an article for each theme and verify the blog post layout matches the theme.

- [ ] **Step 7: Test mobile responsive**

Resize browser to mobile width for each theme. Verify headers collapse correctly.
