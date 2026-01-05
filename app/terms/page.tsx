import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service | SEWO - Get Found Everywhere',
  description: 'Terms of Service for SEWO - Read our terms and conditions for using our services.',
}

export default function TermsPage() {
  return (
    <>
      <SiteHeader blogVisible={true} />
      <main className="terms-page">
        <div className="container">
          <div className="terms-content">
            <h1>Terms of Service</h1>
            <p className="last-updated">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <section>
              <h2>1. Agreement to Terms</h2>
              <p>
                By accessing or using the SEWO website (www.sewo.io) and services (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Service.
              </p>
            </section>

            <section>
              <h2>2. Description of Service</h2>
              <p>
                SEWO provides Ai visibility optimization and consulting services to help businesses improve their visibility in Ai-powered search results. Our services include but are not limited to content optimization, site structure analysis, brand authority building, and ongoing optimization support.
              </p>
            </section>

            <section>
              <h2>3. Eligibility</h2>
              <p>
                You must be at least 18 years old and have the legal capacity to enter into contracts to use our Service. By using the Service, you represent and warrant that you meet these eligibility requirements.
              </p>
            </section>

            <section>
              <h2>4. User Accounts and Information</h2>
              <p>
                When you submit information through our forms or contact us, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of any account information and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2>5. Service Availability</h2>
              <p>
                We work with a limited number of brands at any one time to ensure focus, depth, and consistency. Not every application is accepted. We reserve the right to accept or decline service requests at our sole discretion.
              </p>
            </section>

            <section>
              <h2>6. Payment Terms</h2>
              <p>
                Payment terms will be specified in individual service agreements. Unless otherwise agreed, payment is due as specified in your service agreement. We reserve the right to suspend or terminate services for non-payment.
              </p>
            </section>

            <section>
              <h2>7. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the Service, including but not limited to text, graphics, logos, and software, are owned by SEWO or its licensors and are protected by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2>8. User Content</h2>
              <p>
                You retain ownership of any content you provide to us. By providing content, you grant us a license to use, modify, and display such content as necessary to provide our services. You represent that you have the right to grant such license.
              </p>
            </section>

            <section>
              <h2>9. Prohibited Uses</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Transmit any harmful code, viruses, or malicious software</li>
                <li>Attempt to gain unauthorized access to the Service or related systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use the Service to infringe on any intellectual property rights</li>
                <li>Use automated systems to access the Service without permission</li>
              </ul>
            </section>

            <section>
              <h2>10. Disclaimer of Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                We do not guarantee specific results from our services. Ai visibility and search rankings are influenced by many factors beyond our control, including changes to Ai systems, algorithms, and market conditions.
              </p>
            </section>

            <section>
              <h2>11. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SEWO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
            </section>

            <section>
              <h2>12. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless SEWO and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2>13. Termination</h2>
              <p>
                We may terminate or suspend your access to the Service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            <section>
              <h2>14. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2>15. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the new Terms on this page and updating the &quot;Last Updated&quot; date. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2>16. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us:
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
