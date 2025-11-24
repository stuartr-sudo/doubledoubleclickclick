'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trackServicePageView, trackFormSubmission, trackWizardStep, trackFormStart } from '@/lib/analytics'

export default function BetaPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: '',
    budgetRange: '',
    aiContentLevel: '',
    brandInfo: '',
    goals: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [formStarted, setFormStarted] = useState(false)

  const totalSteps = 3

  // Track page view on mount
  useEffect(() => {
    trackServicePageView('beta')
  }, [])

  // Track when user starts filling form
  useEffect(() => {
    if (!formStarted && (formData.name || formData.email)) {
      setFormStarted(true)
      trackFormStart('beta')
    }
  }, [formData.name, formData.email, formStarted])

  // Track wizard step progress
  useEffect(() => {
    if (step > 1) {
      trackWizardStep('beta', step, totalSteps)
    }
  }, [step])

  const nextStep = () => setStep((s) => Math.min(totalSteps, s + 1))
  const prevStep = () => setStep((s) => Math.max(1, s - 1))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          website: formData.website,
          message: `Budget range: ${formData.budgetRange || 'n/a'}\nAi content level: ${
            formData.aiContentLevel || 'n/a'
          }\nBrand info: ${formData.brandInfo || 'n/a'}\nGoals: ${formData.goals || 'n/a'}`,
          plan_type: 'beta',
          source: 'beta-page',
        }),
      })
      
      trackFormSubmission('beta', res.ok)
    } catch (error) {
      console.error('Failed to submit beta application:', error)
      trackFormSubmission('beta', false)
    } finally {
      setIsSubmitting(false)
      router.push('/lead-capture?type=beta')
    }
  }

  const isStep1Valid = formData.name.trim() !== '' && formData.email.trim() !== ''
  const isStep2Valid = formData.company.trim() !== ''

  return (
    <main>
      <section className="tier-page-hero tier-page-hero--with-form">
        <div className="tier-page-container">
          <div className="tier-page-hero-grid">
            <div className="tier-page-hero-copy">
              <Link href="/" className="back-link">
                ← Back to Home
              </Link>
              <h1 className="tier-page-title">SEWO — Ai Visibility (Beta)</h1>
              <p className="tier-page-subtitle">
                Plan, publish, and monitor content for Ai ranking. Limited beta access for qualified brands.
              </p>
            </div>

            <div className="tier-page-hero-form">
              <h2 className="section-label">Apply for Beta</h2>
              <p className="tier-contact-description">
                Tell us a little about your brand so we can make sure the beta is a good fit for your stage and resources.
              </p>
              <form onSubmit={handleSubmit} className="tier-contact-form">
                <div className="wizard-steps">
                  <div className={`wizard-step ${step === 1 ? 'wizard-step-active' : ''}`}>
                    <div className="wizard-step-number">1</div>
                    <span className="wizard-step-label">Contact</span>
                  </div>
                  <div className="wizard-step-connector"></div>
                  <div className={`wizard-step ${step === 2 ? 'wizard-step-active' : ''}`}>
                    <div className="wizard-step-number">2</div>
                    <span className="wizard-step-label">Brand</span>
                  </div>
                  <div className="wizard-step-connector"></div>
                  <div className={`wizard-step ${step === 3 ? 'wizard-step-active' : ''}`}>
                    <div className="wizard-step-number">3</div>
                    <span className="wizard-step-label">Budget & Ai</span>
                  </div>
                </div>

                <div className="wizard-form-content">
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
                        <label htmlFor="company">Brand / Company Name *</label>
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
                        <label htmlFor="brandInfo">Tell us about your brand and what you do</label>
                        <textarea
                          id="brandInfo"
                          rows={4}
                          value={formData.brandInfo}
                          onChange={(e) => setFormData({ ...formData, brandInfo: e.target.value })}
                          placeholder="What industry are you in? What products or services do you offer?"
                        />
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="form-group">
                        <label htmlFor="budgetRange">Monthly budget for Ai content &amp; visibility *</label>
                        <select
                          id="budgetRange"
                          required
                          value={formData.budgetRange}
                          onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                        >
                          <option value="">Select a range</option>
                          <option value="<2k">&lt; $2k / month</option>
                          <option value="2-5k">$2k – $5k / month</option>
                          <option value="5-15k">$5k – $15k / month</option>
                          <option value="15k+">$15k+ / month</option>
                          <option value="unsure">Not sure yet</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="aiContentLevel">Current level of Ai content optimization *</label>
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
                          <option value="a-lot">A lot of content</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="goals">What do you want this beta to achieve for your brand?</label>
                        <textarea
                          id="goals"
                          rows={4}
                          value={formData.goals}
                          onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                          placeholder="What are your goals? What challenges are you hoping to solve?"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="wizard-navigation">
                  {step > 1 && (
                    <button type="button" onClick={prevStep} className="btn btn-secondary">
                      ← Back
                    </button>
                  )}
                  {step < totalSteps && (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="btn btn-primary"
                      disabled={!isStep1Valid && step === 1 || !isStep2Valid && step === 2}
                    >
                      Next →
                    </button>
                  )}
                  {step === totalSteps && (
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting…' : 'Submit Application'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="tier-benefits-section">
        <div className="tier-benefits-container">
          <h2 className="section-label">Features</h2>
          <div className="tier-benefits-grid">
            <div className="tier-benefit-card">
              <h3>Research</h3>
              <p>Discover Ai questions and gaps where your brand can legitimately rank and be recommended.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Workflow</h3>
              <p>Template‑driven creation and publishing, integrated with prompts and guardrails for your team.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Monitoring</h3>
              <p>Track your visibility across assistants and Ai surfaces, then iterate based on real query data.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}


