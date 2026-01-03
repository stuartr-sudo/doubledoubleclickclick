'use client'

import { useState } from 'react'

export default function SubscribeHero({ source = 'hero' }: { source?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('success')
      setEmail('')
      // Optional analytics if posthog-js is installed
      if (typeof window !== 'undefined') {
        try {
          const posthog = (await import('posthog-js')).default
          if (posthog && typeof posthog.capture === 'function') {
            posthog.capture('subscribe_submitted', { source })
          }
        } catch {
          // PostHog not available, ignore
        }
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="subscribe-hero">
      <div className="subscribe-inner">
        <h2 className="subscribe-title">A monthly post delivered straight to your inbox</h2>
        <p className="subscribe-subtitle">Zero spam, just the good stuff on ranking in AI LLMs.</p>
        <form className="subscribe-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            required
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="subscribe-input"
          />
          <button type="submit" className="subscribe-button" disabled={status === 'loading'}>
            {status === 'loading' ? 'Submitting…' : 'Submit →'}
          </button>
        </form>
        {status === 'success' && <p className="subscribe-note">Thanks - please check your inbox.</p>}
        {status === 'error' && <p className="subscribe-note error">Something went wrong. Try again.</p>}
      </div>
    </section>
  )
}


