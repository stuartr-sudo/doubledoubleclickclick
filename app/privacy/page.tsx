import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy | SEWO - Get Found Everywhere',
  description: 'Privacy Policy for SEWO - Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader blogVisible={true} />
      <main className="privacy-page">
        <div className="container">
          <div className="privacy-content">
            <h1>Privacy Policy</h1>
            <p className="last-updated">Last updated: 6 January 2026</p>

            <section>
              <h2>1. Introduction</h2>
              <p>
                SEWO ("we", "us", or "our") operates the website <a href="https://www.sewo.io" target="_blank" rel="noopener noreferrer">https://www.sewo.io</a> and provides AI-powered tools for content creation, optimization, and website analysis.
              </p>
              <p>
                We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and share information when you use SEWO.
              </p>
              <p>
                If you have any questions about this policy, contact us at: <a href="mailto:privacy@sewo.io">privacy@sewo.io</a>
              </p>
            </section>

            <section>
              <h2>2. Information We Collect</h2>
              <p>We collect information in the following ways:</p>
              
              <h3>2.1 Information You Provide</h3>
              <p>When you use SEWO, you may provide:</p>
              <ul>
                <li>Account information (name, email address)</li>
                <li>Workspace or username information</li>
                <li>Content you create, upload, or edit</li>
                <li>Website URLs, sitemaps, and page content you submit for analysis</li>
                <li>Brand guidelines and preferences</li>
                <li>Payment and billing details (handled by third-party payment providers)</li>
              </ul>

              <h3>2.2 Information Collected Automatically</h3>
              <p>We may automatically collect:</p>
              <ul>
                <li>IP address</li>
                <li>Browser type and device information</li>
                <li>Usage data (features used, actions taken, timestamps)</li>
                <li>Log data and error reports</li>
                <li>Cookies and similar technologies (see Section 7)</li>
              </ul>

              <h3>2.3 Content Processed by AI</h3>
              <p>When you use AI-powered features, we process:</p>
              <ul>
                <li>Text, HTML, or URLs you submit</li>
                <li>Generated or modified content created by our systems</li>
                <li>Metadata related to content workflows (e.g. internal links, structure, headings)</li>
              </ul>
              <p>This content is processed only to provide the requested functionality.</p>
            </section>

            <section>
              <h2>3. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul>
                <li>Provide, operate, and improve SEWO</li>
                <li>Process and optimize content using AI systems</li>
                <li>Generate internal links, summaries, FAQs, and other outputs</li>
                <li>Manage accounts, workspaces, and permissions</li>
                <li>Process payments and subscriptions</li>
                <li>Monitor usage, performance, and security</li>
                <li>Communicate with you about updates or support requests</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p>We do not sell your personal data.</p>
            </section>

            <section>
              <h2>4. AI & Third-Party Services</h2>
              <p>SEWO uses trusted third-party services to operate its features, including:</p>
              <ul>
                <li>AI model providers (for content processing and generation)</li>
                <li>Website crawling and mapping services</li>
                <li>Payment processors</li>
                <li>Hosting and infrastructure providers</li>
                <li>Analytics and logging services</li>
              </ul>
              
              <h3>AI Processing</h3>
              <p>Content submitted to AI features is processed to generate outputs for you.</p>
              <p>We do not use your private content to train public AI models unless explicitly stated and agreed.</p>
              <p>AI providers may temporarily process data to generate responses, subject to their own privacy and security obligations.</p>
            </section>

            <section>
              <h2>5. Data Storage & Retention</h2>
              <ul>
                <li>We store data only as long as necessary to provide the service.</li>
                <li>Content and workspace data remain accessible to you while your account is active.</li>
                <li>You may delete content or request account deletion at any time.</li>
                <li>Some data may be retained for legal, security, or billing purposes.</li>
              </ul>
            </section>

            <section>
              <h2>6. Data Sharing</h2>
              <p>We may share information:</p>
              <ul>
                <li>With service providers who help operate SEWO (under strict confidentiality)</li>
                <li>When required by law or legal process</li>
                <li>To protect the rights, safety, or security of SEWO and its users</li>
                <li>As part of a business transfer (e.g. merger or acquisition)</li>
              </ul>
              <p>We do not share your data for advertising purposes.</p>
            </section>

            <section>
              <h2>7. Cookies & Tracking</h2>
              <p>SEWO uses cookies and similar technologies to:</p>
              <ul>
                <li>Maintain sessions and authentication</li>
                <li>Remember preferences</li>
                <li>Analyze usage and improve performance</li>
              </ul>
              <p>You can control cookies through your browser settings. Some features may not work correctly if cookies are disabled.</p>
            </section>

            <section>
              <h2>8. Security</h2>
              <p>We take reasonable technical and organizational measures to protect your information, including:</p>
              <ul>
                <li>Secure hosting infrastructure</li>
                <li>Encrypted connections (HTTPS)</li>
                <li>Access controls and role-based permissions</li>
                <li>Monitoring and logging for abuse and errors</li>
              </ul>
              <p>No system is 100% secure, but we work continuously to protect your data.</p>
            </section>

            <section>
              <h2>9. Your Rights</h2>
              <p>Depending on your location, you may have rights to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your data</li>
                <li>Restrict or object to certain processing</li>
                <li>Request data portability</li>
              </ul>
              <p>You can exercise these rights by contacting <a href="mailto:privacy@sewo.io">privacy@sewo.io</a>.</p>
            </section>

            <section>
              <h2>10. International Users</h2>
              <p>
                SEWO may process data in countries other than your own. We take steps to ensure appropriate safeguards are in place when transferring data internationally.
              </p>
            </section>

            <section>
              <h2>11. Children's Privacy</h2>
              <p>
                SEWO is not intended for children under 13 (or the applicable age in your jurisdiction). We do not knowingly collect data from children.
              </p>
            </section>

            <section>
              <h2>12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date and, where appropriate, notify users.
              </p>
            </section>

            <section>
              <h2>13. Contact Us</h2>
              <p>If you have questions or concerns about this Privacy Policy or your data, contact us at:</p>
              <ul>
                <li>Email: <a href="mailto:privacy@sewo.io">privacy@sewo.io</a></li>
                <li>Website: <a href="https://www.sewo.io" target="_blank" rel="noopener noreferrer">https://www.sewo.io</a></li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
