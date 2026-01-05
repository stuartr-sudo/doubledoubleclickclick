import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Shipping & Returns | SEWO - Get Found Everywhere',
  description: 'Shipping and returns information for SEWO orders. Learn about our shipping rates, delivery times, and return policy.',
}

export default function ShippingPage() {
  return (
    <>
      <SiteHeader blogVisible={true} />
      <main className="privacy-page">
        <div className="container">
          <div className="privacy-content">
            <h1>Shipping & Returns</h1>

            <section>
              <h2>Shipping Information</h2>
              <p>We currently ship within USA, UK and the EU.</p>
              
              <ul>
                <li><strong>Flat-rate shipping:</strong> $6</li>
                <li><strong>Orders should be received within 3-7 business days</strong></li>
                <li>You will receive a confirmation email with tracking details once your order has shipped</li>
              </ul>

              <h3>Please note:</h3>
              <ul>
                <li>Delivery times may vary depending on your location and carrier delays</li>
                <li>Orders are shipped on business days only (excluding public holidays)</li>
                <li>If you have any questions about your order or shipping status, feel free to contact us at <a href="mailto:hi@sewo.io">hi@sewo.io</a>.</li>
              </ul>
            </section>

            <section>
              <h2>Returns & Refunds</h2>
              <p>We want you to feel confident purchasing from SEWO.</p>
              
              <ul>
                <li><strong>30-day returns on unopened and unused items</strong></li>
                <li>Items must be returned in their original, sealed condition</li>
                <li>Return requests must be made within 30 days of delivery</li>
                <li>Once your return is received and inspected, we will notify you of the approval of your refund. Approved refunds will be processed back to your original payment method.</li>
              </ul>

              <h3>Please note:</h3>
              <ul>
                <li>Shipping costs are non-refundable</li>
                <li>We are unable to accept returns on opened, used, or damaged items (unless faulty)</li>
              </ul>
            </section>

            <section>
              <h2>Faulty or Damaged Items</h2>
              <p>If your order arrives damaged or faulty, please contact us within 7 days of delivery with:</p>
              <ul>
                <li>Your order number</li>
                <li>A brief description of the issue</li>
                <li>Clear photos if applicable</li>
              </ul>
              <p>We will work with you to resolve the issue as quickly as possible.</p>
            </section>

            <section>
              <h2>Need Help?</h2>
              <p>If you have any questions about shipping, returns, or your order, please contact us at:</p>
              <p><a href="mailto:hi@sewo.io">hi@sewo.io</a></p>
              <p>We&apos;re always happy to help.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
