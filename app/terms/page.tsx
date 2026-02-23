import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import { getTenantConfig } from '@/lib/tenant'

export async function generateMetadata(): Promise<Metadata> {
  const config = getTenantConfig()
  return {
    title: `Terms of Service | ${config.siteName}`,
    description: `Terms of Service for ${config.siteName}.`,
  }
}

export default function TermsPage() {
  const config = getTenantConfig()
  const name = config.siteName
  const email = config.contactEmail
  const url = config.siteUrl

  return (
    <>
      <SiteHeader blogVisible={true} />
      <main className="terms-page">
        <div className="container">
          <div className="terms-content">
            <h1>Terms of Service</h1>
            <p className="last-updated">Last Updated: January 2026</p>

            <section>
              <h2>1. Agreement to Terms</h2>
              <p>
                By accessing or using <a href={url} target="_blank" rel="noopener noreferrer">{url}</a> and related services (the &quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, you must not access or use the Service.
              </p>
            </section>

            <section>
              <h2>2. Eligibility</h2>
              <p>You must be at least 18 years old and have the legal capacity to enter into binding contracts to use the Service.</p>
            </section>

            <section>
              <h2>3. User Information</h2>
              <p>When submitting information, you agree to provide accurate, current, and complete information. You are responsible for ensuring the accuracy of any information provided.</p>
            </section>

            <section>
              <h2>4. Intellectual Property</h2>
              <p>All content, materials, and trademarks associated with the Service are owned by {name} or its licensors and are protected by applicable intellectual property laws.</p>
            </section>

            <section>
              <h2>5. Prohibited Uses</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for unlawful purposes</li>
                <li>Transmit malicious code or harmful software</li>
                <li>Attempt to gain unauthorised access to systems or data</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Infringe upon intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2>6. Disclaimer of Warranties</h2>
              <p>THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED.</p>
            </section>

            <section>
              <h2>7. Limitation of Liability</h2>
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, {name.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES.</p>
            </section>

            <section>
              <h2>8. Changes to Terms</h2>
              <p>{name} may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised Terms.</p>
            </section>

            <section>
              <h2>9. Contact Information</h2>
              <p>For questions regarding these Terms, contact: <a href={`mailto:${email}`}>{email}</a></p>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
