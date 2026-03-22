'use client'

import { useState } from 'react'

interface EndOfArticleCTAProps {
  username: string
  title?: string
  description?: string
}

export default function EndOfArticleCTA({
  username,
  title = 'Enjoyed this article?',
  description = 'Get articles like this delivered to your inbox every Thursday.',
}: EndOfArticleCTAProps) {
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
      <div style={{
        background: 'var(--color-bg-warm)',
        borderRadius: 'var(--border-radius, 8px)',
        padding: '28px',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>✓</span>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          margin: 0,
        }}>
          You&apos;re subscribed! Check your inbox soon.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--color-bg-warm)',
      borderRadius: 'var(--border-radius, 8px)',
      padding: '28px',
      textAlign: 'center',
    }}>
      <h3 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '17px',
        fontWeight: 700,
        margin: '0 0 6px',
        color: 'var(--color-text)',
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: 'var(--color-text-secondary)',
        margin: '0 0 20px',
        maxWidth: 360,
        marginLeft: 'auto',
        marginRight: 'auto',
        lineHeight: 1.5,
      }}>
        {description}
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: '8px',
          maxWidth: 400,
          margin: '0 auto',
        }}
      >
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: '13px',
            fontFamily: 'var(--font-sans)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius, 6px)',
            backgroundColor: '#fff',
            color: 'var(--color-text)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            backgroundColor: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--border-radius, 6px)',
            cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
            opacity: status === 'submitting' ? 0.7 : 1,
            whiteSpace: 'nowrap',
            transition: 'filter 0.15s ease',
          }}
        >
          {status === 'submitting' ? '...' : 'Subscribe'}
        </button>
      </form>

      {status === 'error' && (
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          color: '#c00',
          margin: '10px 0 0',
        }}>
          {errorMsg}
        </p>
      )}
    </div>
  )
}
