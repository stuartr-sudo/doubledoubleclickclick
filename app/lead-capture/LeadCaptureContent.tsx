'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function LeadCaptureContent() {
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    type: ''
  })

  useEffect(() => {
    const name = searchParams.get('name') || ''
    const email = searchParams.get('email') || ''
    const company = searchParams.get('company') || ''
    const type = searchParams.get('type') || ''
    
    setFormData({ name, email, company, type })
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Here you would send to your API/backend
    // For now, just show success message
    alert('Thank you! We will contact you soon.')
  }

  const tierName = formData.type === 'agencies' ? 'Agencies' : formData.type === 'enterprise' ? 'Enterprise' : ''

  return (
    <main>
      <section className="lead-capture-hero">
        <div className="lead-capture-container">
          <h1 className="lead-capture-title">Thank You for Your Interest</h1>
          <p className="lead-capture-subtitle">
            {tierName ? `We've received your ${tierName} inquiry.` : "We've received your inquiry."} Our team will contact you shortly to discuss your needs.
          </p>
        </div>
      </section>

      <section className="lead-capture-form-section">
        <div className="lead-capture-form-container">
          <h2 className="section-label">Confirm Your Information</h2>
          <form onSubmit={handleSubmit} className="lead-capture-form">
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
              <label htmlFor="company">{formData.type === 'enterprise' ? 'Company Name' : 'Agency Name'} *</label>
              <input
                type="text"
                id="company"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            {formData.type && (
              <div className="form-group">
                <label>Plan Type</label>
                <input
                  type="text"
                  value={tierName}
                  disabled
                  className="disabled-input"
                />
              </div>
            )}
            <button type="submit" className="btn-pricing">
              Confirm & Submit
            </button>
          </form>
          <div className="lead-capture-footer">
            <Link href="/" className="back-link">← Back to Home</Link>
          </div>
        </div>
      </section>
    </main>
  )
}

