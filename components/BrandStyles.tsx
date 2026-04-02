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

  // 3. Layer brand-specific overrides on top (these win over theme defaults)
  //    primary_color  → heading/brand text colour (--color-text, --color-primary)
  //    secondary_color → body text colour (--color-text-body, --color-secondary)
  //    accent_color    → accent/CTA colour (--color-accent)
  if (specs.primary_color) {
    mergedVars['--color-primary'] = specs.primary_color
    mergedVars['--color-text'] = specs.primary_color
  }
  if (specs.secondary_color) {
    mergedVars['--color-secondary'] = specs.secondary_color
    mergedVars['--color-text-body'] = specs.secondary_color
  }
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

  // 4. Load additional Google Fonts when brand specs override the theme default.
  //    The theme preset only loads its own fonts (e.g. boutique loads DM Sans).
  //    If heading_font or body_font is set to something else (e.g. EB Garamond),
  //    we need an extra <link> tag so the browser actually has the font.
  const extraFonts: string[] = []
  const themeFonts = (theme.googleFontUrl || '').toLowerCase()
  if (specs.heading_font) {
    const slug = specs.heading_font.replace(/\s+/g, '+')
    if (!themeFonts.includes(slug.toLowerCase())) {
      extraFonts.push(`family=${slug}:wght@400;700`)
    }
  }
  if (specs.body_font) {
    const slug = specs.body_font.replace(/\s+/g, '+')
    if (!themeFonts.includes(slug.toLowerCase())) {
      extraFonts.push(`family=${slug}:wght@400;500;700`)
    }
  }
  const extraFontUrl = extraFonts.length > 0
    ? `https://fonts.googleapis.com/css2?${extraFonts.join('&')}&display=swap`
    : null

  // 5. Build CSS string
  const varEntries = Object.entries(mergedVars)
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ')
  // Use html[data-theme] selector for higher specificity than globals.css :root
  const themeSel = specs.theme && specs.theme !== 'editorial'
    ? `html[data-theme="${specs.theme}"]`
    : ':root'
  const css = `${themeSel} { ${varEntries} }\n${specs.custom_css || ''}`

  return (
    <>
      {theme.googleFontUrl && (
        <link href={theme.googleFontUrl} rel="stylesheet" />
      )}
      {extraFontUrl && (
        <link href={extraFontUrl} rel="stylesheet" />
      )}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}
