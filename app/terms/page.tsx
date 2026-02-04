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
            <p className="last-updated">Last Updated: January 6, 2026</p>

            <section>
              <h2>1. Agreement to Terms</h2>
              <p>
                By accessing or using the SEWO website (<a href="https://www.sewo.io" target="_blank" rel="noopener noreferrer">https://www.sewo.io</a>) and related services (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you must not access or use the Service.
              </p>
            </section>

            <section>
              <h2>2. Description of Service</h2>
              <p>
                SEWO provides AI visibility optimisation and consulting services designed to help businesses improve their presence across AI-powered search and recommendation systems. Services may include, but are not limited to, content optimisation, site and entity structure analysis, brand authority development, strategic planning, and ongoing optimisation support.
              </p>
              <p>
                SEWO does not guarantee specific rankings, placements, or outcomes.
              </p>
            </section>

            <section>
              <h2>3. Eligibility</h2>
              <p>
                You must be at least 18 years old and have the legal capacity to enter into binding contracts to use the Service. By using the Service, you represent and warrant that you meet these requirements.
              </p>
            </section>

            <section>
              <h2>4. User Information and Accuracy</h2>
              <p>
                When submitting information through our website, forms, or communication channels, you agree to provide accurate, current, and complete information. You are responsible for ensuring the accuracy of any information provided and for maintaining the confidentiality of any account-related details.
              </p>
            </section>

            <section>
              <h2>5. Service Availability &amp; Acceptance</h2>
              <p>
                SEWO works with a limited number of clients at any given time to maintain quality, focus, and consistency. Submission of an enquiry or application does not guarantee acceptance. SEWO reserves the right to accept or decline any service request at its sole discretion.
              </p>
            </section>

            <section>
              <h2>6. Payment Terms, Deposits &amp; Refunds</h2>
              <p>
                Payment terms are outlined in your individual service agreement and form part of these Terms.
              </p>
              <p>
                Unless otherwise agreed in writing:
              </p>
              <ul>
                <li>A 50% deposit of the first month&apos;s service fee is required to secure an engagement.</li>
                <li>The remaining 50% balance must be paid in full prior to the commencement of any work.</li>
                <li>SEWO will not begin service delivery until all required payments have been received.</li>
              </ul>

              <h3>Refund Policy</h3>
              <ul>
                <li>Due to the nature of digital consulting and optimisation services, all payments are non-refundable once services have commenced.</li>
                <li>Deposits are non-refundable, as they secure availability, onboarding, and preparatory work.</li>
                <li>No refunds are provided for partially or fully delivered services.</li>
                <li>SEWO reserves the right to suspend or terminate services for non-payment.</li>
              </ul>
            </section>

            <section>
              <h2>7. Intellectual Property</h2>
              <p>
                All content, materials, trademarks, logos, methodologies, and proprietary frameworks associated with the Service are owned by SEWO or its licensors and are protected by applicable intellectual property laws. Nothing in these Terms grants you ownership of SEWO intellectual property.
              </p>
            </section>

            <section>
              <h2>8. Client Content</h2>
              <p>
                You retain ownership of any content or materials you provide to SEWO. By providing such content, you grant SEWO a non-exclusive, royalty-free license to use, modify, and display that content solely for the purpose of delivering the agreed services. You represent that you have the rights required to grant this license.
              </p>
            </section>

            <section>
              <h2>9. Prohibited Uses</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for unlawful purposes or in violation of applicable laws</li>
                <li>Transmit malicious code, malware, or harmful software</li>
                <li>Attempt to gain unauthorised access to systems or data</li>
                <li>Interfere with or disrupt the Service or related infrastructure</li>
                <li>Infringe upon intellectual property rights</li>
                <li>Use automated systems to access the Service without permission</li>
              </ul>
            </section>

            <section>
              <h2>10. Disclaimer of Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                SEWO does not warrant or guarantee specific outcomes, rankings, visibility, or business results. AI systems, algorithms, and discovery mechanisms are subject to change and are outside SEWO&apos;s control.
              </p>
            </section>

            <section>
              <h2>11. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SEWO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS INTERRUPTION, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
            </section>

            <section>
              <h2>12. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless SEWO, its directors, officers, employees, and agents from any claims, liabilities, damages, losses, and expenses arising out of or related to your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2>13. Termination</h2>
              <p>
                SEWO may suspend or terminate access to the Service at any time, with or without notice, including for breach of these Terms or non-payment. Termination does not entitle you to a refund of any fees paid.
              </p>
            </section>

            <section>
              <h2>14. Governing Law</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2>15. Changes to Terms</h2>
              <p>
                SEWO may update these Terms from time to time. Material changes will be posted on this page with an updated &quot;Last Updated&quot; date. Continued use of the Service after changes constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2>16. Contact Information</h2>
              <p>
                For questions regarding these Terms of Service, please contact:
              </p>
              <ul>
                <li>Email: <a href="mailto:stuartr@sewo.io">stuartr@sewo.io</a></li>
                <li>Address:<br />
                  4286<br />
                  1007 N Orange St, 4th Floor<br />
                  Wilmington, DE<br />
                  New Castle, 19801<br />
                  United States
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
