'use client'

import { useState } from 'react'

interface InlineNewsletterBarProps {
  username: string
  heading?: string
  subtext?: string
  buttonText?: string
  variant?: 'light' | 'dark' | 'accent'
  className?: string
}

export default function InlineNewsletterBar({
  username,
  heading = 'Get insights delivered to your inbox',
  subtext,
  buttonText = 'Subscribe',
  variant = 'light',
  className = '',
}: InlineNewsletterBarProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Newsletter Subscriber',
          email: email.trim(),
          topic: 'newsletter',
          username,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong')
      }

      setStatus('success')
      setEmail('')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className={`inline-newsletter-bar inline-newsletter-bar--${variant} ${className}`}>
        <div className="container inline-newsletter-bar-inner">
          <p className="inline-newsletter-success">You&apos;re subscribed! Check your inbox soon.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`inline-newsletter-bar inline-newsletter-bar--${variant} ${className}`}>
      <div className="container inline-newsletter-bar-inner">
        <div className="inline-newsletter-bar-text">
          <p className="inline-newsletter-bar-heading">{heading}</p>
          {subtext && <p className="inline-newsletter-bar-subtext">{subtext}</p>}
        </div>
        <form onSubmit={handleSubmit} className="inline-newsletter-bar-form">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="inline-newsletter-bar-input"
          />
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="inline-newsletter-bar-btn"
          >
            {status === 'submitting' ? 'Subscribing...' : buttonText}
          </button>
        </form>
        {status === 'error' && (
          <p className="inline-newsletter-bar-error">{errorMsg}</p>
        )}
      </div>
    </div>
  )
}
