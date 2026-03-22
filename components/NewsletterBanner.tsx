'use client'

import { useState } from 'react'

interface NewsletterBannerProps {
  username: string
  title?: string
  description?: string
}

export default function NewsletterBanner({
  username,
  title = 'The Weekly Digest',
  description = 'The best stories, ideas, and insights delivered every Thursday.',
}: NewsletterBannerProps) {
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
          borderRadius: 'var(--border-radius, 8px)',
          padding: '32px 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-accent)',
            marginBottom: '12px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9l4.5 4.5 7.5-9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: '0 0 4px',
          }}
        >
          You&apos;re in!
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          Check your inbox soon.
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-warm)',
        borderRadius: 'var(--border-radius, 8px)',
        padding: '32px 24px',
        textAlign: 'center',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '20px',
          fontWeight: 700,
          margin: '0 0 8px',
          color: 'var(--color-text)',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          margin: '0 auto 20px',
          maxWidth: '400px',
        }}
      >
        {description}
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'inline-flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="newsletter-banner-input"
          style={{
            padding: '12px 16px',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius, 4px)',
            backgroundColor: '#fff',
            color: 'var(--color-text)',
            outline: 'none',
            width: '240px',
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="newsletter-banner-btn"
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            backgroundColor: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--border-radius, 4px)',
            cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
            opacity: status === 'submitting' ? 0.7 : 1,
            whiteSpace: 'nowrap',
            transition: 'filter 0.15s ease',
          }}
        >
          {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>

      {status === 'error' && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: '#c00',
            margin: '12px auto 0',
            textAlign: 'center',
          }}
        >
          {errorMsg}
        </p>
      )}

      <style>{`
        .newsletter-banner-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 20%, transparent);
        }
        .newsletter-banner-btn:hover:not(:disabled) {
          filter: brightness(0.88);
        }
        @media (max-width: 600px) {
          .newsletter-banner-input {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
