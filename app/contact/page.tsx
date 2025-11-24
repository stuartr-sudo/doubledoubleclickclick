'use client'

import { useState, useEffect } from 'react'
import { trackFormSubmission, trackFormStart } from '@/lib/analytics'

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
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        backgroundColor: '#050816',
        color: '#ffffff',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          borderRadius: '24px',
          padding: '32px 24px',
          background:
            'radial-gradient(circle at top, rgba(129, 140, 248, 0.12), transparent 60%), #020617',
          boxShadow: '0 24px 80px rgba(15, 23, 42, 0.8)',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            margin: '0 0 8px',
            fontWeight: 700,
          }}
        >
          Contact SEWO
        </h1>
        <p
          style={{
            margin: '0 0 24px',
            fontSize: '0.98rem',
            lineHeight: 1.6,
            color: 'rgba(226, 232, 240, 0.85)',
          }}
        >
          Share a bit about your brand and what you&apos;re trying to solve. We&apos;ll reply within 1–2
          business days.
        </p>

        {submitted && (
          <div
            style={{
              marginBottom: '16px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(22, 163, 74, 0.15)',
              color: '#bbf7d0',
              fontSize: '0.9rem',
            }}
          >
            Thanks for reaching out. Your message has been received.
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(248, 113, 113, 0.15)',
              color: '#fecaca',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="name" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                color: '#e5e7eb',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="email" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                color: '#e5e7eb',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="message" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              How can we help?
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                color: '#e5e7eb',
                fontSize: '0.95rem',
                resize: 'vertical',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '8px',
              padding: '10px 20px',
              borderRadius: '999px',
              border: 'none',
              background:
                'linear-gradient(135deg, rgba(56, 189, 248, 1), rgba(129, 140, 248, 1))',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: submitting ? 'default' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Sending…' : 'Submit'}
          </button>
        </form>
      </div>
    </main>
  )
}


