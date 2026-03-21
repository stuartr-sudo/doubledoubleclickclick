# Site Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CSS-only theme system (Editorial, Boutique, Modern) so each provisioned site can have a distinct visual style without separate component files.

**Architecture:** Theme presets defined in `lib/themes.ts` map theme names to CSS variable values. `BrandStyles` merges the preset with per-site brand overrides. `layout.tsx` sets `data-theme` on `<html>` for layout-level CSS selectors in `globals.css`. Provisioning wizard adds Step 0 for theme selection.

**Tech Stack:** Next.js 14, TypeScript, CSS custom properties, Supabase (shared DB)

**Spec:** `docs/superpowers/specs/2026-03-21-site-themes-design.md`

---

### Task 1: Database Migration

**Files:**
- Migration via Supabase MCP tool

- [ ] **Step 1: Add `theme` column to `brand_specifications`**

Run this migration via Supabase MCP:
```sql
ALTER TABLE brand_specifications
  ADD COLUMN IF NOT EXISTS theme text DEFAULT 'editorial'
  CHECK (theme IN ('editorial', 'boutique', 'modern'));
```

- [ ] **Step 2: Verify the column exists**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'brand_specifications' AND column_name = 'theme';
```

Expected: `theme | text | 'editorial'`

- [ ] **Step 3: Commit note** — no code to commit, migration applied directly to DB.

---

### Task 2: Create `lib/themes.ts`

**Files:**
- Create: `lib/themes.ts`

- [ ] **Step 1: Create the theme presets file**

```typescript
export type ThemeName = 'editorial' | 'boutique' | 'modern'

export interface ThemePreset {
  name: ThemeName
  label: string
  description: string
  fontFamily: 'serif' | 'sans-serif'
  googleFontUrl: string | null
  variables: Record<string, string>
}

export const THEMES: Record<ThemeName, ThemePreset> = {
  editorial: {
    name: 'editorial',
    label: 'Editorial',
    description: 'Classic newspaper feel. Best for authority, finance, and news sites.',
    fontFamily: 'serif',
    googleFontUrl: null,
    variables: {
      '--font-heading': "Georgia, 'Times New Roman', serif",
      '--font-body': "Georgia, 'Times New Roman', serif",
      '--font-sans': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--color-bg': '#fafaf8',
      '--color-bg-warm': '#f3f0ea',
      '--color-bg-article': '#f8f6f2',
      '--color-text': '#111111',
      '--color-text-body': '#333333',
      '--color-text-secondary': '#555555',
      '--color-text-muted': '#888888',
      '--color-text-faint': '#999999',
      '--color-accent': '#8b7355',
      '--color-border': '#e5e0d8',
      '--color-border-light': '#f0ece6',
      '--color-footer-bg': '#1a1a1a',
      '--border-radius': '0px',
      '--card-shadow': 'none',
      '--card-padding': '12px',
    },
  },
  boutique: {
    name: 'boutique',
    label: 'Boutique',
    description: 'Warm & personal for lifestyle, wellness, and education sites.',
    fontFamily: 'sans-serif',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap',
    variables: {
      '--font-heading': "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      '--font-body': "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      '--font-sans': "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      '--color-bg': '#fdf8f4',
      '--color-bg-warm': '#f5ede5',
      '--color-bg-article': '#faf6f1',
      '--color-text': '#2d2d2d',
      '--color-text-body': '#3d3d3d',
      '--color-text-secondary': '#5a5a5a',
      '--color-text-muted': '#8a8a8a',
      '--color-text-faint': '#a0a0a0',
      '--color-accent': '#c97b6b',
      '--color-border': '#e8e0d8',
      '--color-border-light': '#f2ece5',
      '--color-footer-bg': '#2d2420',
      '--border-radius': '12px',
      '--card-shadow': '0 2px 8px rgba(0,0,0,0.06)',
      '--card-padding': '16px',
    },
  },
  modern: {
    name: 'modern',
    label: 'Modern',
    description: 'Clean & minimal for tech, SaaS, and professional brands.',
    fontFamily: 'sans-serif',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    variables: {
      '--font-heading': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      '--font-body': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      '--font-sans': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      '--color-bg': '#ffffff',
      '--color-bg-warm': '#f8f9fa',
      '--color-bg-article': '#ffffff',
      '--color-text': '#0a0a0a',
      '--color-text-body': '#1a1a1a',
      '--color-text-secondary': '#4a4a4a',
      '--color-text-muted': '#6b7280',
      '--color-text-faint': '#9ca3af',
      '--color-accent': '#2563eb',
      '--color-border': '#e5e7eb',
      '--color-border-light': '#f3f4f6',
      '--color-footer-bg': '#111827',
      '--border-radius': '8px',
      '--card-shadow': 'none',
      '--card-padding': '12px',
    },
  },
}

export function getTheme(name: string | null | undefined): ThemePreset {
  return THEMES[(name as ThemeName)] || THEMES.editorial
}

export function getThemeNames(): ThemeName[] {
  return Object.keys(THEMES) as ThemeName[]
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds (new file has no imports that could break)

- [ ] **Step 3: Commit**

```bash
git add lib/themes.ts
git commit -m "feat: add theme preset definitions (editorial, boutique, modern)"
```

---

### Task 3: Update `lib/brand.ts` — add `theme` to interface and query

**Files:**
- Modify: `lib/brand.ts:28-39` (BrandSpecs interface)
- Modify: `lib/brand.ts:109-113` (select query)

- [ ] **Step 1: Add `theme` to `BrandSpecs` interface**

In `lib/brand.ts`, add `theme: string | null` to the `BrandSpecs` interface (after line 38, before the closing `}`):

```typescript
export interface BrandSpecs {
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  logo_url: string | null
  hero_image_url: string | null
  heading_font: string | null
  body_font: string | null
  font_sizes: Record<string, string> | null
  border_radius: string | null
  custom_css: string | null
  theme: string | null          // <-- ADD THIS
}
```

- [ ] **Step 2: Add `theme` to the select query**

In `lib/brand.ts`, find the `brand_specifications` select (around line 109-113) and add `theme`:

```typescript
brand_specifications (
  primary_color, secondary_color, accent_color,
  logo_url, hero_image_url, heading_font, body_font,
  font_sizes, border_radius, custom_css, theme
)
```

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add lib/brand.ts
git commit -m "feat: add theme field to BrandSpecs interface and DB query"
```

---

### Task 4: Update `components/BrandStyles.tsx` — merge theme preset with brand overrides

**Files:**
- Modify: `components/BrandStyles.tsx`

- [ ] **Step 1: Rewrite BrandStyles to load and merge theme preset**

Replace the entire file with:

```typescript
import { getBrandData } from '@/lib/brand'
import { getTheme } from '@/lib/themes'

export default async function BrandStyles() {
  let specs = null

  try {
    const brand = await getBrandData()
    specs = brand.specs
  } catch {
    // Fall back to default CSS variables if DB is unavailable
  }

  if (!specs) return null

  // 1. Load theme preset (fallback to editorial)
  const theme = getTheme(specs.theme)

  // 2. Start with all theme variables
  const mergedVars: Record<string, string> = { ...theme.variables }

  // 3. Layer brand-specific overrides on top
  if (specs.primary_color) mergedVars['--color-primary'] = specs.primary_color
  if (specs.secondary_color) mergedVars['--color-secondary'] = specs.secondary_color
  if (specs.accent_color) mergedVars['--color-accent'] = specs.accent_color
  if (specs.border_radius) mergedVars['--border-radius'] = specs.border_radius
  if (specs.heading_font) {
    const fallback = theme.fontFamily === 'serif' ? 'serif' : 'sans-serif'
    mergedVars['--font-heading'] = `'${specs.heading_font}', ${fallback}`
  }
  if (specs.body_font) {
    const fallback = theme.fontFamily === 'serif' ? 'serif' : 'sans-serif'
    mergedVars['--font-body'] = `'${specs.body_font}', ${fallback}`
  }

  // 4. Build CSS string
  const varEntries = Object.entries(mergedVars)
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ')
  const css = `:root { ${varEntries} }\n${specs.custom_css || ''}`

  // 5. Build Google Fonts link if needed
  const fontLink = theme.googleFontUrl
    ? `<link href="${theme.googleFontUrl}" rel="stylesheet" />`
    : ''

  return (
    <>
      {fontLink && <link href={theme.googleFontUrl!} rel="stylesheet" />}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add components/BrandStyles.tsx
git commit -m "feat: BrandStyles merges theme preset with brand overrides"
```

---

### Task 5: Update `app/layout.tsx` — set `data-theme` on `<html>`

**Files:**
- Modify: `app/layout.tsx:75-84`

- [ ] **Step 1: Make RootLayout async and read theme**

Change `RootLayout` from a sync function to async, fetch brand data, and set `data-theme`:

```typescript
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const config = getTenantConfig()
  const gtmId = config.gtmId

  // Read theme for data-theme attribute
  let themeName = 'editorial'
  try {
    const brand = await getBrandData()
    themeName = brand.specs?.theme || 'editorial'
  } catch {}

  return (
    <html lang="en" className={inter.variable} data-theme={themeName}>
```

Note: Keep the `Inter` font import for now (it's used as a CSS variable fallback). It will be loaded regardless of theme but only applied when `--font-*` references it. This is a minor performance cost that can be optimized later.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: set data-theme attribute on html element from brand specs"
```

---

### Task 6: Add theme-scoped CSS to `app/globals.css`

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add new CSS variables to `:root`**

Find the `:root` block in `globals.css` (around line 7) and add these variables after the existing ones:

```css
  /* Theme-controlled properties */
  --border-radius: 0px;
  --card-shadow: none;
  --card-padding: 12px;
```

- [ ] **Step 2: Add theme-scoped layout CSS**

Add the following at the end of `globals.css` (before any existing `@media` queries at the bottom, or after the last component section):

```css
/* ─── Theme: Boutique ─── */
[data-theme="boutique"] .editorial-topbar {
  display: none;
}
[data-theme="boutique"] .editorial-categorynav a {
  background: var(--color-bg-warm);
  border-radius: 20px;
  padding: 4px 14px;
  margin: 0 2px;
  font-size: var(--text-xs);
  transition: background 0.2s ease;
}
[data-theme="boutique"] .editorial-categorynav a:hover {
  background: var(--color-border);
}
[data-theme="boutique"] .editorial-masthead {
  padding: 20px 0 12px;
}
[data-theme="boutique"] .editorial-mobile-header {
  border-radius: 0;
}

/* ─── Theme: Modern ─── */
[data-theme="modern"] .editorial-topbar {
  display: none;
}
[data-theme="modern"] .editorial-masthead {
  text-align: left;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border);
}
[data-theme="modern"] .editorial-categorynav {
  border-bottom: none;
  padding: 8px 0;
}
[data-theme="modern"] .editorial-categorynav a {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* ─── Theme: Mobile overrides ─── */
@media (max-width: 768px) {
  [data-theme="boutique"] .editorial-mobile-pills a {
    background: var(--color-bg-warm);
    border-radius: 16px;
    padding: 4px 12px;
  }
  [data-theme="modern"] .editorial-mobile-pills a {
    font-family: var(--font-sans);
    text-transform: uppercase;
    font-size: 8px;
    letter-spacing: 0.5px;
  }
}
```

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: add theme-scoped CSS for Boutique and Modern layouts"
```

---

### Task 7: Convert inline `borderRadius` to CSS variable references

**Files:**
- Modify: `components/ArticleCard.tsx` — thumbnail borderRadius (line 39)
- Modify: `components/FeaturedCard.tsx` — thumbnail borderRadius (line 40)
- Modify: `components/ProductSpotlight.tsx` — product image borderRadius (line 83)

**Important:** Only convert `borderRadius` on card/thumbnail containers. Do NOT convert `borderRadius: '50%'` on avatar circles (ArticleCard lines 117, 124) — those must stay as `50%`.

- [ ] **Step 1: Update ArticleCard.tsx**

In `components/ArticleCard.tsx`, find the thumbnail container's `borderRadius: '2px'` (around line 39) and change to:
```typescript
borderRadius: 'var(--border-radius, 2px)'
```

Do NOT touch `borderRadius: '50%'` on author avatar images.

- [ ] **Step 2: Update FeaturedCard.tsx**

In `components/FeaturedCard.tsx`, find the thumbnail container's `borderRadius: '2px'` (around line 40) and change to:
```typescript
borderRadius: 'var(--border-radius, 2px)'
```

- [ ] **Step 3: Update ProductSpotlight.tsx**

In `components/ProductSpotlight.tsx`, find the product image container's `borderRadius: '4px'` (around line 83) and change to:
```typescript
borderRadius: 'var(--border-radius, 4px)'
```

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Verify no visual change on editorial theme**

Load `https://doubledoubleclickclick.fly.dev/` — should look identical to before (editorial `--border-radius: 0px` matches the existing sharp corners).

- [ ] **Step 6: Commit**

```bash
git add components/ArticleCard.tsx components/FeaturedCard.tsx components/ProductSpotlight.tsx
git commit -m "refactor: convert inline borderRadius to CSS variable for theme control"
```

---

### Task 8: Update provision route — accept and store `theme`

**Files:**
- Modify: `app/api/provision/route.ts:122-166` (body destructuring)
- Modify: `app/api/provision/route.ts` (specsPayload, around line 255)

- [ ] **Step 1: Destructure `theme` from request body**

In `app/api/provision/route.ts`, add `theme = 'editorial'` to the body destructuring (after line 161, before `affiliate_link`):

```typescript
    is_affiliate = false,
    theme = 'editorial',     // <-- ADD THIS
    affiliate_link,
```

- [ ] **Step 2: Add `theme` to specsPayload**

Find the `specsPayload` object (around line 255) and add `theme`:

```typescript
    const specsPayload = {
      guideline_id: guidelineId,
      user_name: username,
      primary_color: primary_color || '#000000',
      accent_color: accent_color || '#ffffff',
      secondary_color: accent_color || '#ffffff',
      logo_url: logo_url || null,
      heading_font: heading_font || null,
      body_font: body_font || null,
      theme: theme,           // <-- ADD THIS
    }
```

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add app/api/provision/route.ts
git commit -m "feat: accept and store theme in provision route"
```

---

### Task 9: Update network provision route — pass `theme` through

**Files:**
- Modify: `app/api/admin/provision-network/route.ts`

- [ ] **Step 1: Add `theme` to the network member interface**

Find the member interface (around line 10-25) and add `theme?: string`.

- [ ] **Step 2: Destructure `theme` from the top-level body**

At the top of the route handler, where `body` fields are destructured (around line 30-40), add:

```typescript
const theme = body.theme || 'editorial'
```

- [ ] **Step 3: Pass `theme` in each per-site provision payload**

Find where `provisionPayload` is built for each member (around line 170-190) and add:

```typescript
provisionPayload.theme = theme
```

Note: `theme` is a network-level setting (same for all sites), NOT a per-member field.

- [ ] **Step 4: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/provision-network/route.ts
git commit -m "feat: pass theme through network provision to per-site calls"
```

---

### Task 10: Add theme selection to ProvisionForm (Step 0)

**Files:**
- Modify: `components/ProvisionForm.tsx`

- [ ] **Step 1: Import themes**

Add at top of file:
```typescript
import { THEMES, type ThemeName } from '@/lib/themes'
```

- [ ] **Step 2: Add theme state**

Add with other state variables:
```typescript
const [theme, setTheme] = useState<ThemeName>('editorial')
```

- [ ] **Step 3: Add theme selector UI**

Before the existing mode selection (Product-First / Niche-First / Upload), add a theme chooser section. When mode is `null` (initial state), show theme selection first:

```tsx
{/* Theme Selection */}
<div style={{ marginBottom: '24px' }}>
  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
    Choose a style
  </label>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
    {Object.values(THEMES).map((t) => (
      <button
        key={t.name}
        type="button"
        onClick={() => {
          setTheme(t.name)
          // Pre-fill colors from theme
          setPrimaryColor(t.variables['--color-accent'] || '')
          setAccentColor(t.variables['--color-bg-warm'] || '')
        }}
        style={{
          padding: '16px',
          border: theme === t.name ? '2px solid var(--color-accent)' : '1px solid #e2e8f0',
          borderRadius: '8px',
          background: theme === t.name ? '#f8fafc' : '#fff',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <strong style={{ display: 'block', marginBottom: '4px' }}>{t.label}</strong>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{t.description}</span>
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Include `theme` in the provision payload**

Find where the provision API is called (the `handleLaunch` or form submission function) and add `theme` to the payload:

```typescript
theme,
```

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add components/ProvisionForm.tsx
git commit -m "feat: add theme selection to ProvisionForm Step 0"
```

---

### Task 11: Add theme selection to NetworkForm

**Files:**
- Modify: `components/NetworkForm.tsx`

- [ ] **Step 1: Import themes**

```typescript
import { THEMES, type ThemeName } from '@/lib/themes'
```

- [ ] **Step 2: Add theme state**

```typescript
const [theme, setTheme] = useState<ThemeName>('editorial')
```

- [ ] **Step 3: Add same theme selector UI as ProvisionForm**

Add the same 3-card theme chooser at the top of the network wizard (before niche/upload selection).

- [ ] **Step 4: Include `theme` in the network provision payload**

Find where `/api/admin/provision-network` is called and add `theme` to the payload.

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add components/NetworkForm.tsx
git commit -m "feat: add theme selection to NetworkForm"
```

---

### Task 12: Update demo site and verify all 3 themes

**Files:**
- No code changes — database update + manual verification

- [ ] **Step 1: Set demo site to Boutique theme**

```sql
UPDATE brand_specifications SET theme = 'boutique' WHERE user_name = 'demo-site';
```

- [ ] **Step 2: Deploy and verify Boutique theme**

```bash
fly deploy --app doubledoubleclickclick
```

Load `https://doubledoubleclickclick.fly.dev/` and verify:
- No date bar in header
- Rounded category pills
- DM Sans font loaded
- Warm cream background
- 12px border radius on cards

- [ ] **Step 3: Switch to Modern theme and verify**

```sql
UPDATE brand_specifications SET theme = 'modern' WHERE user_name = 'demo-site';
```

Reload and verify:
- No date bar
- Left-aligned masthead
- Inter font loaded
- Pure white background
- Blue accent color
- 8px border radius

- [ ] **Step 4: Switch back to Editorial and verify no regression**

```sql
UPDATE brand_specifications SET theme = 'editorial' WHERE user_name = 'demo-site';
```

Reload and verify site looks identical to before theming was added.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: site themes complete — Editorial, Boutique, Modern"
git push origin main
```

---

### Task 13: Deploy to production

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Deploy to Fly.io**

```bash
fly deploy --app doubledoubleclickclick
```

- [ ] **Step 3: Verify production**

Load `https://doubledoubleclickclick.fly.dev/` and confirm the current theme renders correctly.
