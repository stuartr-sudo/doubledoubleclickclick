import type { Metadata } from 'next'
import { getTenantConfig } from '@/lib/tenant'
import { getBrandData } from '@/lib/brand'
import SiteHeader from '@/components/SiteHeader'
import ContactForm from './ContactForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const config = getTenantConfig()
  return {
    title: `Contact | ${config.siteName}`,
    description: `Get in touch with ${config.siteName}.`,
  }
}

export default async function ContactPage() {
  const config = getTenantConfig()
  let brandName = config.siteName
  let logoImage: string | undefined

  try {
    const brand = await getBrandData()
    brandName = brand.guidelines?.name || config.siteName
    logoImage = brand.specs?.logo_url || undefined
  } catch {}

  const contactEmail = config.contactEmail || 'contact@example.com'
  const contactPhone = config.contactPhone || ''

  return (
    <>
      <SiteHeader logoText={brandName} logoImage={logoImage} />
      <main className="contact-form-section">
        <div className="container">
          <ContactForm contactEmail={contactEmail} contactPhone={contactPhone} />
        </div>
      </main>
    </>
  )
}
