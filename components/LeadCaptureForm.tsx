'use client'

import { useState } from 'react'

interface LeadCaptureFormProps {
  topics: string[]
  leadMagnetTitle?: string
  leadMagnetDescription?: string
  username: string
}

export default function LeadCaptureForm({
  topics,
  leadMagnetTitle = 'Free Expert Guide',
  leadMagnetDescription = 'Get our exclusive guide delivered straight to your inbox.',
  username,
}: LeadCaptureFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !topic) return

    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), topic, username }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong')
      }

      setStatus('success')
      setName('')
      setEmail('')
      setTopic('')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="lead-form-card">
        <div className="lead-form-success">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>You&apos;re in!</h3>
          <p>Check your inbox for your free guide.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lead-form-card">
      <div className="lead-form-badge">FREE GUIDE</div>
      <h3 className="lead-form-title">{leadMagnetTitle}</h3>
      <p className="lead-form-desc">{leadMagnetDescription}</p>

      <form onSubmit={handleSubmit} className="lead-form">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="lead-form-input"
        />
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="lead-form-input"
        />
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          className="lead-form-input lead-form-select"
        >
          <option value="" disabled>Choose a topic of interest</option>
          {topics.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="lead-form-submit"
        >
          {status === 'submitting' ? 'Sending...' : 'Get Your Free Guide'}
        </button>

        {status === 'error' && (
          <p className="lead-form-error">{errorMsg}</p>
        )}
      </form>

      <p className="lead-form-privacy">No spam, ever. Unsubscribe anytime.</p>
    </div>
  )
}
