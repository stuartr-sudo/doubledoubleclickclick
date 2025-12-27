'use client'

import { useState, useEffect } from 'react'
import { trackFormSubmission, trackFormStart } from '@/lib/analytics'
import SiteHeader from '@/components/SiteHeader'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formStarted, setFormStarted] = useState(false)

  // Track when user starts filling form
  useEffect(() => {
    if (!formStarted && (name || email || message)) {
      setFormStarted(true)
      trackFormStart('contact')
    }
  }, [name, email, message, formStarted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          source: 'contact-page',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit form.')
      }

      trackFormSubmission('contact', true)
      setSubmitted(true)
      setName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      console.error('Contact form error:', err)
      trackFormSubmission('contact', false)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="contact-form-section">
        <div className="container">
          <div className="contact-form-wrapper">
            <div className="contact-form-left">
              <h2>Contact SEWO</h2>
              <p className="contact-intro">
                Share a bit about your brand and what you&apos;re trying to solve. We&apos;ll reply within 1–2 business days.
              </p>
              
              <div className="contact-info">
                <div className="contact-info-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <a href="mailto:contact@sewo.io">contact@sewo.io</a>
                </div>
                <div className="contact-info-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>+1 342223434</span>
                </div>
              </div>
            </div>

            <div className="contact-form-right">
              {submitted ? (
                <div className="form-message form-success">
                  <h3>Message Received!</h3>
                  <p>Thanks for reaching out. We&apos;ll get back to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && <div className="form-message form-error">{error}</div>}
                  
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      id="name"
                      type="text"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">How can we help?</label>
                    <textarea
                      id="message"
                      className="form-input form-textarea"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your project..."
                      rows={5}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="form-submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
