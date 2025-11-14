'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function EnterprisePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: '',
    message: '',
    budgetRange: '',
    aiContentLevel: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  const totalSteps = 3

  const nextStep = () => setStep((s) => Math.min(totalSteps, s + 1))
  const prevStep = () => setStep((s) => Math.max(1, s - 1))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await fetch('/api/lead-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          website: formData.website,
          message:
            `Budget range: ${formData.budgetRange || 'n/a'}\n` +
            `AI content level: ${formData.aiContentLevel || 'n/a'}\n` +
            `Notes: ${formData.message || 'n/a'}`,
          plan_type: 'enterprise',
          source: 'enterprise-page',
        }),
      })
    } catch (error) {
      console.error('Failed to submit lead capture:', error)
      // Still redirect to thank-you even on API error
    } finally {
      setIsSubmitting(false)
      router.push('/lead-capture?type=enterprise')
    }
  }

  return (
    <main>
      <section className="tier-page-hero tier-page-hero--with-form">
        <div className="tier-page-container tier-page-hero-grid">
          <div className="tier-page-hero-copy">
            <Link href="/" className="back-link">← Back to Home</Link>
            <h1 className="tier-page-title">Enterprise</h1>
            <p className="tier-page-subtitle">
              Enterprise-grade solutions for large organizations. Custom implementations designed to meet your unique requirements and scale.
            </p>
          </div>

          <div className="tier-page-hero-form tier-contact-form">
            <h2 className="section-label">Contact Sales</h2>
            <p className="tier-contact-description">
              Tell us how you&apos;re thinking about AI content today so we can tailor a conversation to your team, stack, and
              governance requirements.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="wizard-steps">
                <div className={`wizard-step ${step >= 1 ? 'wizard-step--active' : ''}`}>
                  <span className="wizard-step-number">1</span>
                  <span className="wizard-step-label">Contact</span>
                </div>
                <div className={`wizard-step ${step >= 2 ? 'wizard-step--active' : ''}`}>
                  <span className="wizard-step-number">2</span>
                  <span className="wizard-step-label">Organization</span>
                </div>
                <div className={`wizard-step ${step >= 3 ? 'wizard-step--active' : ''}`}>
                  <span className="wizard-step-number">3</span>
                  <span className="wizard-step-label">Budget &amp; AI</span>
                </div>
              </div>

              {step === 1 && (
                <>
                  <div className="form-group">
                    <label htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="form-group">
                    <label htmlFor="company">Company Name *</label>
                    <input
                      type="text"
                      id="company"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="website">Website</label>
                    <input
                      type="url"
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">How is AI content currently owned or managed inside your org?</label>
                    <textarea
                      id="message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="form-group">
                    <label htmlFor="budgetRange">Estimated monthly budget for AI content &amp; visibility *</label>
                    <select
                      id="budgetRange"
                      required
                      value={formData.budgetRange}
                      onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                    >
                      <option value="">Select a range</option>
                      <option value="<10k">&lt; $10k / month</option>
                      <option value="10-25k">$10k – $25k / month</option>
                      <option value="25-75k">$25k – $75k / month</option>
                      <option value="75k+">$75k+ / month</option>
                      <option value="unsure">Not sure yet</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="aiContentLevel">Current level of AI content optimization *</label>
                    <select
                      id="aiContentLevel"
                      required
                      value={formData.aiContentLevel}
                      onChange={(e) => setFormData({ ...formData, aiContentLevel: e.target.value })}
                    >
                      <option value="">Select one</option>
                      <option value="none">None</option>
                      <option value="not-much">Not much</option>
                      <option value="some">Some content and pilots</option>
                      <option value="a-lot">A lot of content and active programs</option>
                    </select>
                  </div>
                </>
              )}

              <div className="wizard-nav">
                {step > 1 && (
                  <button type="button" className="btn btn-secondary" onClick={prevStep}>
                    Back
                  </button>
                )}
                {step < totalSteps && (
                  <button type="button" className="btn btn-primary" onClick={nextStep}>
                    Next
                  </button>
                )}
                {step === totalSteps && (
                  <button type="submit" className="btn-pricing" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Contact Sales'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="tier-benefits-section">
        <div className="tier-benefits-container">
          <h2 className="section-label">Benefits</h2>
          <div className="tier-benefits-grid">
            <div className="tier-benefit-card">
              <h3>Unlimited Websites</h3>
              <p>Optimize as many websites as you need. No limits on domains, subdomains, or properties in your organization.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Advanced Analytics & Insights</h3>
              <p>Deep-dive analytics with custom dashboards, advanced reporting, and insights tailored to your business goals.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>24/7 Priority Support</h3>
              <p>Round-the-clock support with guaranteed response times. Your dedicated support team is always available.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Custom SLA</h3>
              <p>Service level agreements tailored to your needs. Guaranteed uptime, response times, and performance metrics.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>On-Site Training & Consultation</h3>
              <p>Expert training sessions for your team. On-site consultations to ensure optimal implementation and results.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>API Access</h3>
              <p>Full API access for custom integrations. Build your own tools and workflows on top of our platform.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Dedicated Infrastructure</h3>
              <p>Isolated infrastructure for maximum security and performance. Enterprise-grade hosting and data management.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Compliance & Security</h3>
              <p>SOC 2, GDPR, and industry-specific compliance. Enterprise-grade security measures and data protection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact section removed; form now lives in hero above the fold */}
    </main>
  )
}

