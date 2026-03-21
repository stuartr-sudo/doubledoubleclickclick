'use client'

import { useState, useEffect } from 'react'
import { trackFormSubmission, trackFormStart } from '@/lib/analytics'

interface ContactFormProps {
  contactEmail: string
  contactPhone: string
}

export default function ContactForm({ contactEmail, contactPhone }: ContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
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
      setError('Please fill in all required fields.')
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
          message: subject ? `[${subject}] ${message}` : message,
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
      setSubject('')
      setMessage('')
    } catch (err) {
      console.error('Contact form error:', err)
      trackFormSubmission('contact', false)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-sans)',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--color-text-muted)',
    marginBottom: '6px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    fontSize: '12px',
    fontFamily: 'var(--font-sans)',
    border: '1px solid var(--color-border)',
    borderRadius: '2px',
    backgroundColor: '#fff',
    color: 'var(--color-text)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  if (submitted) {
    return (
      <div
        style={{
          padding: '32px 0',
          textAlign: 'center',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '16px',
            fontWeight: 700,
            margin: 0,
            color: 'var(--color-text)',
          }}
        >
          Message Received
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            margin: '8px 0 0',
          }}
        >
          Thanks for reaching out. We&apos;ll get back to you shortly.
        </p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
          }
          .contact-form-col {
            border-right: none !important;
            padding-right: 0 !important;
            border-bottom: 1px solid var(--color-border);
            padding-bottom: 32px !important;
          }
          .contact-info-col {
            padding-left: 0 !important;
            padding-top: 24px !important;
          }
        }
      `}</style>

      <div
        className="contact-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr',
          gap: 0,
        }}
      >
        {/* Left Column — Form */}
        <div
          className="contact-form-col"
          style={{
            borderRight: '1px solid var(--color-border)',
            paddingRight: '32px',
          }}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  color: '#c00',
                  marginBottom: '16px',
                  padding: '8px 12px',
                  backgroundColor: '#fff0f0',
                  border: '1px solid #fcc',
                  borderRadius: '2px',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="contact-name" style={labelStyle}>Name</label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="contact-email" style={labelStyle}>Email</label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="contact-subject" style={labelStyle}>Subject</label>
              <input
                id="contact-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What is this about?"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="contact-message" style={labelStyle}>Message</label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message..."
                rows={6}
                required
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  letterSpacing: '0.5px',
                }}
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column — Contact Info */}
        <div
          className="contact-info-col"
          style={{
            paddingLeft: '32px',
          }}
        >
          {/* Email */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                marginBottom: '6px',
              }}
            >
              Email
            </div>
            <a
              href={`mailto:${contactEmail}`}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                color: 'var(--color-text)',
                textDecoration: 'none',
              }}
            >
              {contactEmail}
            </a>
          </div>

          {/* Press */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                marginBottom: '6px',
              }}
            >
              Press
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                color: 'var(--color-text)',
              }}
            >
              {contactEmail}
            </div>
          </div>

          {/* Partnerships */}
          <div style={{ marginBottom: '32px' }}>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                marginBottom: '6px',
              }}
            >
              Partnerships
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                color: 'var(--color-text)',
              }}
            >
              {contactEmail}
            </div>
          </div>

          {/* Response Time Box */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-warm)',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '4px',
              }}
            >
              Response Time
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}
            >
              We typically respond within 1&ndash;2 business days.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
