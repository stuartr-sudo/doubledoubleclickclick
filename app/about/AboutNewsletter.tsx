'use client'

import { useState } from 'react'

interface AboutNewsletterProps {
  username: string
}

export default function AboutNewsletter({ username }: AboutNewsletterProps) {
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
      <div
        style={{
          backgroundColor: 'var(--color-bg-warm)',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          color: 'var(--color-text-body)',
        }}
      >
        You&apos;re subscribed! Check your inbox soon.
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-warm)',
        padding: '24px',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '14px',
          fontWeight: 700,
          margin: 0,
          color: 'var(--color-text)',
        }}
      >
        Stay in the loop
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          color: 'var(--color-text-secondary)',
          margin: '6px 0 16px',
          lineHeight: 1.5,
        }}
      >
        Get our best stories delivered to your inbox every week.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '12px',
            fontFamily: 'var(--font-sans)',
            border: '1px solid var(--color-border)',
            borderRadius: '2px',
            backgroundColor: '#fff',
            color: 'var(--color-text)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{
            padding: '8px 16px',
            fontSize: '11px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            backgroundColor: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: '2px',
            cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
            opacity: status === 'submitting' ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>

      {status === 'error' && (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            color: '#c00',
            margin: '8px 0 0',
          }}
        >
          {errorMsg}
        </p>
      )}
    </div>
  )
}
