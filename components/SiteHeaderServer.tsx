import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import { getCategories } from '@/components/CategoryNav'
import SiteHeaderClient from '@/components/SiteHeader'

export default async function SiteHeaderServer() {
  const config = getTenantConfig()
  let siteName = config.siteName
  let logoUrl: string | null = null

  try {
    const brand = await getBrandData()
    siteName = brand.guidelines?.name || config.siteName
    logoUrl = brand.specs?.logo_url || null
  } catch {
    // Fall back to env config
  }

  const categories = await getCategories()

  return (
    <SiteHeaderClient
      siteName={siteName}
      logoUrl={logoUrl}
      categories={categories}
    />
  )
}
