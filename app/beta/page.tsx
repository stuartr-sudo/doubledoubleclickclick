'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function BetaPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: '',
    budgetRange: '',
    aiContentLevel: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          message: `Budget range: ${formData.budgetRange || 'n/a'}\nAI content level: ${
            formData.aiContentLevel || 'n/a'
          }\nNotes: ${formData.notes || 'n/a'}`,
          plan_type: 'beta',
          source: 'beta-page',
        }),
      })
    } catch (error) {
      console.error('Failed to submit beta application:', error)
    } finally {
      setIsSubmitting(false)
      router.push('/lead-capture?type=beta')
    }
  }

  return (
    <main>
      <section className="tier-page-hero">
        <div className="tier-page-container">
          <Link href="/" className="back-link">
            ← Back to Home
          </Link>
          <h1 className="tier-page-title">DoubleClicker — LLM Visibility (Beta)</h1>
          <p className="tier-page-subtitle">
            Plan, publish, and monitor content for AI ranking. Limited beta access for qualified brands.
          </p>
        </div>
      </section>

      <section className="tier-benefits-section">
        <div className="tier-benefits-container">
          <h2 className="section-label">Features</h2>
          <div className="tier-benefits-grid">
            <div className="tier-benefit-card">
              <h3>Research</h3>
              <p>Discover AI questions and gaps where your brand can legitimately rank and be recommended.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Workflow</h3>
              <p>Template‑driven creation and publishing, integrated with prompts and guardrails for your team.</p>
            </div>
            <div className="tier-benefit-card">
              <h3>Monitoring</h3>
              <p>Track your visibility across assistants and LLM surfaces, then iterate based on real query data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="tier-contact-section" id="apply">
        <div className="tier-contact-container">
          <h2 className="section-label">Apply for Beta</h2>
          <p className="tier-contact-description">
            Tell us a little about your brand so we can make sure the beta is a good fit for your stage and resources.
          </p>
          <form onSubmit={handleSubmit} className="tier-contact-form">
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
              <label htmlFor="budgetRange">Monthly budget for AI content &amp; visibility *</label>
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
                <option value="a-lot">A lot of content</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="notes">What do you want this beta to achieve for your brand?</label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}


