import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import { getTenantConfig } from '@/lib/tenant'

export async function generateMetadata(): Promise<Metadata> {
  const config = getTenantConfig()
  return {
    title: `Privacy Policy | ${config.siteName}`,
    description: `Privacy Policy for ${config.siteName}.`,
  }
}

export default function PrivacyPage() {
  const config = getTenantConfig()
  const name = config.siteName
  const email = config.contactEmail
  const url = config.siteUrl

  return (
    <>
      <SiteHeader blogVisible={true} />
      <main className="privacy-page">
        <div className="container">
          <div className="privacy-content">
            <h1>Privacy Policy</h1>
            <p className="last-updated">Last updated: January 2026</p>

            <section>
              <h2>1. Introduction</h2>
              <p>
                {name} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>.
              </p>
              <p>
                We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and share information when you use our services.
              </p>
              <p>
                If you have any questions about this policy, contact us at: <a href={`mailto:${email}`}>{email}</a>
              </p>
            </section>

            <section>
              <h2>2. Information We Collect</h2>
              <h3>2.1 Information You Provide</h3>
              <ul>
                <li>Contact information (name, email address)</li>
                <li>Content you submit through forms</li>
                <li>Payment and billing details (handled by third-party payment providers)</li>
              </ul>
              <h3>2.2 Information Collected Automatically</h3>
              <ul>
                <li>IP address</li>
                <li>Browser type and device information</li>
                <li>Usage data (pages visited, timestamps)</li>
                <li>Cookies and similar technologies (see Section 7)</li>
              </ul>
            </section>

            <section>
              <h2>3. How We Use Your Information</h2>
              <ul>
                <li>Provide, operate, and improve our services</li>
                <li>Respond to your enquiries and communications</li>
                <li>Process payments and subscriptions</li>
                <li>Monitor usage, performance, and security</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p>We do not sell your personal data.</p>
            </section>

            <section>
              <h2>4. Third-Party Services</h2>
              <p>We use trusted third-party services including hosting providers, analytics services, and payment processors. These providers may process data subject to their own privacy obligations.</p>
            </section>

            <section>
              <h2>5. Data Storage &amp; Retention</h2>
              <ul>
                <li>We store data only as long as necessary to provide the service.</li>
                <li>You may request data deletion at any time.</li>
                <li>Some data may be retained for legal, security, or billing purposes.</li>
              </ul>
            </section>

            <section>
              <h2>6. Data Sharing</h2>
              <p>We may share information with service providers who help operate our services (under strict confidentiality), when required by law, or to protect safety and security. We do not share your data for advertising purposes.</p>
            </section>

            <section>
              <h2>7. Cookies &amp; Tracking</h2>
              <p>We use cookies and similar technologies to maintain sessions, remember preferences, and analyze usage. You can control cookies through your browser settings.</p>
            </section>

            <section>
              <h2>8. Security</h2>
              <p>We take reasonable technical and organizational measures to protect your information, including secure hosting, encrypted connections (HTTPS), and access controls.</p>
            </section>

            <section>
              <h2>9. Your Rights</h2>
              <p>Depending on your location, you may have rights to access, correct, delete, restrict, or port your personal data. Contact <a href={`mailto:${email}`}>{email}</a> to exercise these rights.</p>
            </section>

            <section>
              <h2>10. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. When we do, we will update the &quot;Last updated&quot; date.</p>
            </section>

            <section>
              <h2>11. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, contact us at: <a href={`mailto:${email}`}>{email}</a></p>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
