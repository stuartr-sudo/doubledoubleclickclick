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
    message: ''
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
          message: formData.message,
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
      <section className="tier-page-hero">
        <div className="tier-page-container">
          <Link href="/" className="back-link">← Back to Home</Link>
          <h1 className="tier-page-title">Enterprise</h1>
          <p className="tier-page-subtitle">
            Enterprise-grade solutions for large organizations. Custom implementations designed to meet your unique requirements and scale.
          </p>
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

      <section className="tier-contact-section">
        <div className="tier-contact-container">
          <h2 className="section-label">Contact Sales</h2>
          <p className="tier-contact-description">
            Speak with our enterprise sales team to discuss custom solutions for your organization.
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
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-pricing" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Contact Sales'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

