import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Service Delivery & Refunds | Modern Longevity - Modern Knowledge for Longevity',
  description: 'Service delivery information and refund policy for Modern Longevity. Learn about our service availability, delivery process, and cancellation policy.',
}

export default function ShippingPage() {
  return (
    <>
      <SiteHeader blogVisible={true} />
      <main className="privacy-page">
        <div className="container">
          <div className="privacy-content">
            <h1>Service Delivery & Refunds</h1>

            <section>
              <h2>Service Delivery</h2>
              <p>Modern Longevity provides digital consulting and optimisation services designed to improve AI-powered search visibility. All services are delivered remotely and online.</p>
              
              <h3>Service availability</h3>
              <p>Services are available worldwide to businesses of all sizes.</p>

              <h3>Delivery method</h3>
              <p>All services are delivered digitally, including online consultations, strategic guidance, audits, reports, and documentation.</p>

              <h3>Commencement & timelines</h3>
              <ul>
                <li>A deposit is required prior to the commencement of any work to secure your engagement.</li>
                <li>Service delivery begins only once all required payments have been received.</li>
                <li>Delivery timelines vary depending on the scope, complexity, and nature of the services agreed.</li>
                <li>Once your engagement is confirmed, you will receive relevant confirmation emails and access details for your service dashboard or communication channels.</li>
              </ul>

              <h3>Additional notes</h3>
              <ul>
                <li>All services are delivered remotely using online platforms and communication tools.</li>
                <li>Delivery timeframes may vary based on project requirements.</li>
                <li>Modern Longevity operates during standard business hours (Monday to Friday, excluding public holidays).</li>
                <li>For questions regarding service delivery or timelines, please contact <a href="mailto:hi@modernlongevity.co">hi@modernlongevity.co</a>.</li>
              </ul>
            </section>

            <section>
              <h2>Payments, Deposits & Refunds</h2>
              <p>Due to the nature of Modern Longevity&apos;s digital consulting and optimisation services, refunds are not offered once services have commenced.</p>
              
              <h3>Deposits</h3>
              <ul>
                <li>A deposit is required prior to the commencement of any work to secure your engagement.</li>
                <li>Deposits are non-refundable, as they cover availability, onboarding, and preparatory work.</li>
                <li>Modern Longevity will not begin any work until all required payments have been received.</li>
              </ul>

              <h3>Refund policy</h3>
              <ul>
                <li>All payments are non-refundable once services have commenced, including where services are partially or fully delivered.</li>
                <li>Modern Longevity does not provide refunds for completed work, strategic materials, reports, or delivered services.</li>
              </ul>

              <h3>Definition of commencement</h3>
              <p>Commencement of services includes, but is not limited to:</p>
              <ul>
                <li>Onboarding activities</li>
                <li>Audits, reviews, or analysis</li>
                <li>Strategic planning or documentation</li>
                <li>Access to proprietary materials or resources</li>
              </ul>

              <h3>Cancellations</h3>
              <ul>
                <li>You may cancel your engagement prior to service commencement.</li>
                <li>If cancellation occurs after the deposit has been paid but before commencement, the deposit remains non-refundable.</li>
                <li>Once services have commenced, cancellations do not entitle you to a refund of any payments made.</li>
              </ul>
            </section>

            <section>
              <h2>Service Issues & Support</h2>
              <p>If you experience any issues or have concerns regarding your services, please contact us promptly and include:</p>
              <ul>
                <li>Your account or service reference number</li>
                <li>A clear description of the issue or concern</li>
                <li>Any relevant documentation or screenshots</li>
                <li>Your preferred method of contact</li>
              </ul>
              <p>Modern Longevity is committed to addressing service issues in a timely and professional manner and will work with you to resolve concerns where reasonably possible.</p>
            </section>

            <section>
              <h2>Need Help?</h2>
              <p>If you have questions about service delivery, payments, refunds, or your engagement with Modern Longevity, please contact us at:</p>
              <p><a href="mailto:hi@modernlongevity.co">hi@modernlongevity.co</a></p>
              <p>We&apos;re always happy to assist and ensure clarity around your engagement.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
