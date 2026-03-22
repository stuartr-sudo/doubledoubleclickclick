'use client'

import { useState } from 'react'

export default function ArticleReactions() {
  const [feedback, setFeedback] = useState<null | 'yes' | 'no'>(null)

  const handleFeedback = (type: 'yes' | 'no') => {
    setFeedback(type)
  }

  if (feedback) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '16px',
        background: 'var(--color-bg-warm)',
        borderRadius: 'var(--border-radius, 6px)',
        marginTop: '20px',
      }}>
        <span style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
          {feedback === 'yes' ? '👍' : '👎'}
        </span>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          color: 'var(--color-text-secondary)',
          margin: 0,
        }}>
          {feedback === 'yes' ? 'Glad you found this helpful!' : "We'll work to improve. Thanks for the feedback."}
        </p>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 0',
      marginTop: '20px',
      borderTop: '1px solid var(--color-border)',
    }}>
      <span style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--color-text)',
      }}>
        Helpful?
      </span>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => handleFeedback('yes')}
          aria-label="Yes, helpful"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 14px',
            fontSize: '11px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-warm)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius, 4px)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          👍 Yes
        </button>
        <button
          onClick={() => handleFeedback('no')}
          aria-label="No, not helpful"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 14px',
            fontSize: '11px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-warm)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius, 4px)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          👎 No
        </button>
      </div>
    </div>
  )
}
