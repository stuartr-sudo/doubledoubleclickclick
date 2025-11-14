'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

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
        <div className="lead-capture-form-container">
          <h2 className="section-label">What Happens Next</h2>
          <div className="lead-capture-thankyou-body">
            <p>
              We&apos;re reviewing your details and will respond within <strong>1–2 business days</strong> with a short set
              of follow‑up questions and a time to connect.
            </p>
            <p>
              In the meantime, you can explore our latest thinking on ranking in AI assistants and LLMs, or reply directly
              to our confirmation email with any extra context you want to share.
            </p>
          </div>

          <div className="lead-capture-actions">
            <Link href="/blog" className="btn btn-primary">
              Read the Blog
            </Link>
            <Link href="/" className="btn btn-secondary">
              Back to Homepage
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}


