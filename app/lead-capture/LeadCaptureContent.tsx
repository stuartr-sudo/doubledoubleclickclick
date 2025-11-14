'use client'

import { useSearchParams } from 'next/navigation'

export default function LeadCaptureContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || ''

  const tierName =
    type === 'agencies'
      ? 'Agencies'
      : type === 'enterprise'
      ? 'Enterprise'
      : type === 'beta'
      ? 'Beta Program'
      : 'SEWO'

  return (
    <main>
      <section className="lead-capture-hero">
        <div className="lead-capture-container">
          <h1 className="lead-capture-title">Thank You</h1>
          <p className="lead-capture-subtitle">
            {tierName === 'SEWO'
              ? "We've received your inquiry and will be in touch shortly."
              : `We've received your ${tierName} inquiry. Our team will be in touch shortly with next steps.`}
          </p>
        </div>
      </section>

      <section className="lead-capture-form-section">
        <div className="lead-capture-form-container lead-capture-card">
          <h2 className="section-label">What Happens Next</h2>
          <div className="lead-capture-thankyou-body">
            <p>
              We&apos;re reviewing your details and will respond within <strong>1–2 business days</strong> with a short set
              of follow‑up questions and a time to connect.
            </p>
            <p>
              In the meantime, keep an eye on your inbox for a confirmation email. You can reply directly to that message
              with any extra context or questions you want to share.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}


