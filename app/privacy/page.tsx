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
            <p className="last-updated">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <section>
              <h2>1. Introduction</h2>
              <p>
                SEWO ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website www.sewo.io (the "Site") and use our services.
              </p>
            </section>

            <section>
              <h2>2. Information We Collect</h2>
              <h3>2.1 Information You Provide</h3>
              <p>We may collect information that you voluntarily provide to us, including:</p>
              <ul>
                <li>Name and contact information (email address, phone number)</li>
                <li>Company information (company name, website URL, industry)</li>
                <li>Information about your business challenges and goals</li>
                <li>Any other information you choose to provide in forms or communications</li>
              </ul>

              <h3>2.2 Automatically Collected Information</h3>
              <p>When you visit our Site, we may automatically collect certain information, including:</p>
              <ul>
                <li>IP address and location data</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website addresses</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide, operate, and maintain our services</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Send you marketing communications (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Analyze usage patterns and trends</li>
                <li>Detect, prevent, and address technical issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2>4. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our Site and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Site.
              </p>
            </section>

            <section>
              <h2>5. Data Sharing and Disclosure</h2>
              <p>We may share your information in the following situations:</p>
              <ul>
                <li><strong>Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf</li>
                <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with any merger, sale of company assets, financing, or acquisition</li>
                <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities</li>
                <li><strong>With Your Consent:</strong> We may disclose your information for any other purpose with your consent</li>
              </ul>
            </section>

            <section>
              <h2>6. Data Security</h2>
              <p>
                We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2>7. Your Rights</h2>
              <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
              <ul>
                <li>The right to access your personal information</li>
                <li>The right to correct inaccurate information</li>
                <li>The right to request deletion of your information</li>
                <li>The right to object to processing of your information</li>
                <li>The right to data portability</li>
                <li>The right to withdraw consent</li>
              </ul>
              <p>To exercise these rights, please contact us at <a href="mailto:stuartr@sewo.io">stuartr@sewo.io</a>.</p>
            </section>

            <section>
              <h2>8. Children's Privacy</h2>
              <p>
                Our Site is not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2>9. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2>10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul>
                <li>Email: <a href="mailto:stuartr@sewo.io">stuartr@sewo.io</a></li>
                <li>Address: 4286, 1007 N Orange St. 4th Floor, Wilmington, DE, New Castle, US, 19801</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
