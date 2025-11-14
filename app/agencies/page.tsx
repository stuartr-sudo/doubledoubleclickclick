'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AgenciesPage() {
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
          plan_type: 'agencies',
          source: 'agencies-page',
        }),
      })
    } catch (error) {
      console.error('Failed to submit lead capture:', error)
      // We still redirect to thank-you even if logging fails
    } finally {
      setIsSubmitting(false)
      router.push('/lead-capture?type=agencies')
    }
  }

  return (
    <main>
      <section className="tier-page-hero">
        <div className="tier-page-container">
          <Link href="/" className="back-link">← Back to Home</Link>
          <h1 className="tier-page-title">Agencies</h1>
          <p className="tier-page-subtitle">
            Tailored solutions for agencies managing multiple client websites. Scale your LLM optimization services with our comprehensive platform.
          </p>
        </div>
      </section>

      <section className="tier-benefits-section">
        <div className="tier-benefits-container">
          <h2 className="section-label">Benefits</h2>
          <div className="tier-benefits-grid">
            <div className="tier-benefit-card">
              <h3>Multi-Website Management</h3>
              <p>Manage unlimited client websites from a single dashboard. Streamline your workflow and scale your services efficiently.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>White-Label Reporting</h3>
              <p>Brand reports with your agency&apos;s logo and colors. Present professional insights to clients without any DoubleClicker branding.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Priority Support</h3>
              <p>Get faster response times and dedicated support channels. Your agency&apos;s success is our priority.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Dedicated Account Manager</h3>
              <p>Work with a dedicated account manager who understands your agency&apos;s needs and helps you maximize value for your clients.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Custom Integrations</h3>
              <p>Integrate with your existing tools and workflows. API access and custom integrations to fit your agency&apos;s tech stack.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Volume Discounts</h3>
              <p>Competitive pricing for agencies managing multiple clients. The more websites you manage, the better the rates.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="tier-contact-section">
        <div className="tier-contact-container">
          <h2 className="section-label">Get Started</h2>
          <p className="tier-contact-description">
            Contact us to discuss custom pricing and how we can help scale your agency&apos;s LLM optimization services.
          </p>
          <form onSubmit={handleSubmit} className="tier-contact-form">
            <div className="wizard-steps">
              <div className={`wizard-step ${step >= 1 ? 'wizard-step--active' : ''}`}>
                <span className="wizard-step-number">1</span>
                <span className="wizard-step-label">Contact</span>
              </div>
              <div className={`wizard-step ${step >= 2 ? 'wizard-step--active' : ''}`}>
                <span className="wizard-step-number">2</span>
                <span className="wizard-step-label">Agency</span>
              </div>
              <div className={`wizard-step ${step >= 3 ? 'wizard-step--active' : ''}`}>
                <span className="wizard-step-number">3</span>
                <span className="wizard-step-label">Budget & AI</span>
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
                  <label htmlFor="company">Agency Name *</label>
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
                  <label htmlFor="message">Anything else we should know about your clients or services?</label>
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
                  <label htmlFor="budgetRange">Typical monthly retainer per client *</label>
                  <select
                    id="budgetRange"
                    required
                    value={formData.budgetRange}
                    onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                  >
                    <option value="">Select a range</option>
                    <option value="<2k">&lt; $2k / client / month</option>
                    <option value="2-5k">$2k – $5k / client / month</option>
                    <option value="5-15k">$5k – $15k / client / month</option>
                    <option value="15k+">$15k+ / client / month</option>
                    <option value="mixed">Mix of smaller and larger retainers</option>
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
                    <option value="some">Some content</option>
                    <option value="a-lot">A lot of client content</option>
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
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

