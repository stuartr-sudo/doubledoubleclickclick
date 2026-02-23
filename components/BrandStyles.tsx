import { getBrandData } from '@/lib/brand'

export default async function BrandStyles() {
  let specs = null

  try {
    const brand = await getBrandData()
    specs = brand.specs
  } catch {
    // Fall back to default CSS variables if DB is unavailable
  }

  if (!specs) return null

  const vars: string[] = []
  if (specs.primary_color) vars.push(`--color-primary: ${specs.primary_color};`)
  if (specs.secondary_color) vars.push(`--color-secondary: ${specs.secondary_color};`)
  if (specs.accent_color) vars.push(`--color-accent: ${specs.accent_color};`)
  if (specs.border_radius) vars.push(`--border-radius: ${specs.border_radius};`)
  if (specs.heading_font) vars.push(`--font-heading: '${specs.heading_font}', sans-serif;`)
  if (specs.body_font) vars.push(`--font-body: '${specs.body_font}', sans-serif;`)

  const css = `:root { ${vars.join(' ')} }\n${specs.custom_css || ''}`

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
