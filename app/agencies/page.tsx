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
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Here you would typically send to your API/backend
    // For now, redirect to lead capture page
    router.push(`/lead-capture?type=agencies&name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}&company=${encodeURIComponent(formData.company)}`)
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
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-pricing" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

