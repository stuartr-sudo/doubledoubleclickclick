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

  return (
    <>
      {theme.googleFontUrl && (
        <link href={theme.googleFontUrl} rel="stylesheet" />
      )}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}
