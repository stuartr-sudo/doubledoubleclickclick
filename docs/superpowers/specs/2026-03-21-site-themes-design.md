# Site Themes Design Spec

**Date:** 2026-03-21
**Status:** Draft
**Scope:** CSS-only theme system for multi-tenant blog sites

## Overview

Add a theme selection system that lets users pick a visual style (Editorial, Boutique, or Modern) when provisioning a new site. Themes are CSS-only — same components, different CSS variable presets plus scoped layout tweaks via a `data-theme` attribute on `<html>`.

Themes are visual only. They do not influence content generation voice or tone in Doubleclicker.

## Requirements

- 3 themes: Editorial (existing default), Boutique (warm/personal), Modern (clean/tech)
- CSS-only implementation — no separate component files per theme
- Theme selected at Step 0 of provisioning wizard (both single-site and network)
- Theme stored per-site in `brand_specifications.theme`
- User's custom color/font overrides layer on top of theme defaults
- For networks: theme passed through to each per-site provision call (all sites in a network get the same theme value in their `brand_specifications`)

## Theme Presets

### Editorial (existing)
- **Fonts:** Georgia serif for headings and body (system font, no external load)
- **Font fallback:** `Georgia, 'Times New Roman', serif`
- **Colors:** warm off-white (#fafaf8), tan borders (#e5e0d8), brown accent (#8b7355), dark footer (#1a1a1a)
- **Spacing:** tight, compact layout
- **Border-radius:** 0 (sharp corners)
- **Header:** 3-row — date bar, centered masthead, horizontal category nav
- **Cards:** no rounding, thin borders, compact padding

### Boutique
- **Fonts:** `'DM Sans'` (rounded, friendly sans-serif)
- **Font fallback:** `'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif`
- **Colors:** soft cream (#fdf8f4), blush/sage accent (#c97b6b or #7b9e87), warm gray text (#3d3d3d), soft borders (#e8e0d8)
- **Spacing:** generous, breathing room
- **Border-radius:** 12px
- **Header:** 2-row — no date bar, centered logo, category pills with rounded backgrounds
- **Cards:** rounded corners, soft box-shadow, more padding

### Modern
- **Fonts:** `'Inter'` (geometric sans-serif)
- **Font fallback:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- **Colors:** pure white (#ffffff), charcoal text (#0a0a0a), blue accent (#2563eb), gray borders (#e5e7eb)
- **Spacing:** medium, balanced
- **Border-radius:** 8px
- **Header:** 1-row — logo left, categories right, compact
- **Cards:** clean borders, no shadow, monospace category labels

## Architecture

### Theme Presets File: `lib/themes.ts`

A plain TypeScript file exporting theme preset objects. Each preset maps to the existing CSS variable names defined in `globals.css`.

```typescript
export type ThemeName = 'editorial' | 'boutique' | 'modern'

export interface ThemePreset {
  name: ThemeName
  label: string
  description: string
  fontFamily: 'serif' | 'sans-serif'  // controls fallback chain
  variables: Record<string, string>
}

export const THEMES: Record<ThemeName, ThemePreset> = {
  editorial: {
    name: 'editorial',
    label: 'Editorial',
    description: 'Classic newspaper feel. Best for authority, finance, and news sites.',
    fontFamily: 'serif',
    variables: {
      '--font-heading': "Georgia, 'Times New Roman', serif",
      '--font-body': "Georgia, 'Times New Roman', serif",
      '--color-bg': '#fafaf8',
      '--color-bg-warm': '#f3f0ea',
      '--color-accent': '#8b7355',
      '--color-border': '#e5e0d8',
      '--border-radius': '0px',
      // ... all ~30 variables
    }
  },
  boutique: { /* ... full variable set ... */ },
  modern: { /* ... full variable set ... */ },
}

// Defensive fallback for unknown theme values
export function getTheme(name: string | null | undefined): ThemePreset {
  return THEMES[(name as ThemeName)] || THEMES.editorial
}
```

### Storage: `brand_specifications.theme`

New column on the existing `brand_specifications` table:

```sql
ALTER TABLE brand_specifications
  ADD COLUMN IF NOT EXISTS theme text DEFAULT 'editorial'
  CHECK (theme IN ('editorial', 'boutique', 'modern'));
```

### Data Flow

Priority order (lowest to highest):
```
globals.css defaults → theme preset → brand_specifications overrides → custom_css
```

1. `globals.css` defines base variables (editorial defaults for backwards compatibility)
2. `BrandStyles` component reads `specs.theme`, loads preset via `getTheme()` from `lib/themes.ts`
3. Brand-specific color/font overrides from `brand_specifications` layer on top
4. `custom_css` from `brand_specifications` is always the final layer

The `data-theme` attribute is set on `<html>` by `layout.tsx` (which renders the `<html>` tag), NOT by `BrandStyles` (which renders inside `<head>` as a `<style>` tag). `layout.tsx` reads the theme from `getBrandData()` and passes it to the `<html>` element.

### lib/brand.ts Changes

The `BrandSpecs` interface must add:
```typescript
theme: string | null
```

The `getBrandData()` select query for `brand_specifications` must include `theme`:
```typescript
brand_specifications (
  primary_color, secondary_color, accent_color,
  logo_url, hero_image_url, heading_font, body_font,
  font_sizes, border_radius, custom_css, theme
)
```

### layout.tsx Changes

1. Read `brand.specs.theme` from `getBrandData()`
2. Set `data-theme={theme}` on the `<html>` tag
3. Conditionally inject a `<link>` tag for Google Fonts based on theme

### BrandStyles Component Changes

Current behavior: injects color/font CSS variable overrides from `brand_specifications`.

New behavior:
1. Read `specs.theme` (default: `'editorial'`)
2. Load the theme preset via `getTheme(specs.theme)` from `lib/themes.ts`
3. Merge: theme preset variables first, then brand-specific overrides on top
4. For font overrides: use the theme's `fontFamily` for the fallback chain (serif vs sans-serif) unless the user explicitly set a font
5. Inject merged CSS variables as `<style>` tag
6. Inject `custom_css` last

### Inline Style Specificity Strategy

**Problem:** Components like `ArticleCard`, `SiteHeader`, and `HomeHero` use inline `style={{}}` objects. Inline styles have higher specificity than CSS class selectors, so `[data-theme="boutique"] .some-class { border-radius: 12px }` would be overridden by `style={{ borderRadius: '2px' }}`.

**Solution:** Convert theme-controlled inline style values to CSS variable references. This is the pattern already used for colors (e.g., `color: 'var(--color-accent)'`). Extend it to:

| Property | Current inline value | Convert to |
|----------|---------------------|------------|
| `borderRadius` | `'2px'` or `0` | `'var(--border-radius, 0px)'` |
| `fontFamily` | `'var(--font-heading)'` | Already correct |
| `boxShadow` | none | `'var(--card-shadow, none)'` |
| `padding` on cards | hardcoded `'12px'` | `'var(--card-padding, 12px)'` |

Then the theme presets set `--border-radius`, `--card-shadow`, `--card-padding` to different values per theme. No `!important` needed.

New CSS variables added to `globals.css` `:root` and theme presets:
- `--border-radius` (0px / 12px / 8px)
- `--card-shadow` (none / `0 2px 8px rgba(0,0,0,0.06)` / none)
- `--card-padding` (12px / 16px / 12px)

### Layout Adjustments via CSS

Added to `globals.css` — approximately 50-80 lines of scoped CSS.

**Note on class names:** The current codebase uses `editorial-topbar`, `editorial-masthead`, `editorial-categorynav` as class names in `SiteHeader.tsx`. The CSS selectors below use the ACTUAL class names from the codebase.

**Header:**
```css
/* Boutique: hide date bar, round category pills */
[data-theme="boutique"] .editorial-topbar { display: none; }
[data-theme="boutique"] .editorial-categorynav a {
  background: var(--color-bg-warm);
  border-radius: 20px;
  padding: 4px 12px;
}

/* Modern: hide date bar, restyle masthead + nav as single flex row */
[data-theme="modern"] .editorial-topbar { display: none; }
[data-theme="modern"] .editorial-masthead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}
[data-theme="modern"] .editorial-categorynav {
  border: none;
  padding: 0;
}
```

**Modern header approach:** Rather than making masthead and categorynav appear on the same row (complex CSS restructuring of sibling divs), the Modern theme:
1. Hides the topbar
2. Keeps the masthead left-aligned instead of centered
3. Keeps the category nav as a separate row but styles it more compactly (no borders, tighter spacing)

This achieves a "clean, minimal" feel without restructuring JSX. A full single-row header would require component changes and is deferred.

## Provisioning Integration

### Wizard UX

Step 0 of both `ProvisionForm` and `NetworkForm` shows 3 theme cards before any other input:

```
Choose a style for your site

[Editorial]              [Boutique]               [Modern]
Classic newspaper feel.  Warm & personal for      Clean & minimal for
Best for authority       lifestyle & wellness.    tech & SaaS brands.
& finance.              Approachable & friendly.  Sharp & professional.
```

On selection:
- Sets `theme` in form state
- Pre-fills default colors and fonts from the theme preset
- User can still customize colors/fonts in later steps

For Upload Brand Guide flow:
- Theme selection happens BEFORE upload
- Parsed brand guide colors/fonts override theme defaults

For network provisioning:
- Theme set once at network level, passed through to each per-site provision call
- Each site gets the same `theme` value in its `brand_specifications`

### Provision Payload

```typescript
// Added to POST /api/provision body destructuring
theme: 'editorial' | 'boutique' | 'modern'  // default: 'editorial'
```

The `theme` field must be:
1. Destructured from the request body in `route.ts`
2. Included in the `specsPayload` object
3. For network provisioning: passed from `provision-network/route.ts` to each per-site provision call

### Google Fonts

Boutique and Modern themes require external fonts. Since themes are per-tenant and determined at runtime (not build time), we cannot use Next.js `next/font/google` (which is build-time).

Instead, `BrandStyles` injects a `<link>` tag into `<head>` for the required font:
- Editorial: no `<link>` needed (Georgia is a system font)
- Boutique: `<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />`
- Modern: `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />`

The `&display=swap` parameter prevents render blocking and minimizes flash of unstyled text (FOUT). Minor FOUT is an acceptable tradeoff for per-tenant runtime flexibility.

The existing `next/font/google` Inter import in `layout.tsx` (if present) should be removed or made conditional to avoid loading Inter for Editorial/Boutique sites.

## Files Changed

| File | Change |
|------|--------|
| `lib/themes.ts` | **NEW** — theme preset definitions + `getTheme()` fallback |
| `lib/brand.ts` | Add `theme` to `BrandSpecs` interface + `getBrandData()` select query |
| `components/BrandStyles.tsx` | Load theme preset, merge with brand overrides, inject font `<link>` |
| `app/layout.tsx` | Set `data-theme` on `<html>`, remove/conditionalize `next/font/google` |
| `app/globals.css` | Add new CSS variables (`--border-radius`, `--card-shadow`, `--card-padding`), add ~50-80 lines of `[data-theme]` scoped CSS |
| `components/ProvisionForm.tsx` | Add theme selection at Step 0, pre-fill defaults |
| `components/NetworkForm.tsx` | Add theme selection at Step 0 |
| `app/api/provision/route.ts` | Destructure `theme` from body, include in `specsPayload` |
| `app/api/admin/provision-network/route.ts` | Pass `theme` through to per-site provision |

Components with inline style updates (convert hardcoded values to CSS variable references):
- `components/ArticleCard.tsx` — borderRadius, boxShadow, padding
- `components/HomeHero.tsx` — card padding
- `components/LatestGrid.tsx` — card padding
- `components/SiteHeader.tsx` — minor class name additions if needed

### Database Migration

```sql
ALTER TABLE brand_specifications
  ADD COLUMN IF NOT EXISTS theme text DEFAULT 'editorial'
  CHECK (theme IN ('editorial', 'boutique', 'modern'));
```

## Defensive Behavior

- Unknown theme values (e.g., someone writes `'cosmic'` to DB): `getTheme()` falls back to `editorial`
- Missing theme column (pre-migration sites): `specs.theme` is `null`, `getTheme(null)` returns `editorial`
- Existing sites with custom font overrides: brand-specific `heading_font` layers on top of theme preset, so a site with `heading_font = 'Inter'` and `theme = 'editorial'` gets Inter (override wins)

## What This Does NOT Change

- Doubleclicker content generation — theme is visual only
- Article HTML structure — same markup, different CSS
- Blog post page layout — same two-column structure
- API contracts with Doubleclicker — no new fields consumed by DC
- Existing sites — default to `'editorial'`, no visual change

## Testing

- Provision a site with each theme, verify visual output
- Verify custom color/font overrides layer correctly on top of theme preset
- Verify network provisioning applies theme to all member sites
- Verify existing sites (no theme set) default to editorial with no visual change
- Verify unknown theme values fall back to editorial gracefully
- Verify Google Fonts load correctly for Boutique and Modern (check no FOUT on fast connections)
