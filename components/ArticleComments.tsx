'use client'

import { useState, useRef, useEffect } from 'react'

export default function ArticleComments({ postSlug }: { postSlug: string }) {
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'error' | 'success'>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [comment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    setStatus('pending')
    // Simulate API call
    setTimeout(() => {
      setStatus('success')
      setComment('')
    }, 1500)
  }

  return (
    <section style={{ marginTop: '24px' }}>
      <h3 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '15px',
        fontWeight: 700,
        color: 'var(--color-text)',
        margin: '0 0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Discussion
      </h3>

      {status === 'success' ? (
        <div style={{
          background: 'var(--color-bg-warm)',
          borderRadius: 'var(--border-radius, 6px)',
          padding: '16px',
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
        }}>
          <span style={{ fontSize: '18px', display: 'block', marginBottom: '6px' }}>✓</span>
          Your comment has been submitted for review.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            placeholder="Share your thoughts..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={status === 'pending'}
            rows={2}
            style={{
              width: '100%',
              padding: '12px 14px',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              color: 'var(--color-text)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius, 6px)',
              outline: 'none',
              resize: 'vertical',
              minHeight: '60px',
              maxHeight: '200px',
              lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
          }}>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              color: 'var(--color-text-faint)',
            }}>
              Comments are moderated. Links will be removed.
            </span>
            <button
              type="submit"
              disabled={status === 'pending' || !comment.trim()}
              style={{
                padding: '8px 18px',
                fontSize: '11px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                background: comment.trim() ? 'var(--color-accent)' : 'var(--color-border)',
                color: comment.trim() ? '#fff' : 'var(--color-text-muted)',
                border: 'none',
                borderRadius: 'var(--border-radius, 4px)',
                cursor: comment.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              {status === 'pending' ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      )}

      <p style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '11px',
        color: 'var(--color-text-faint)',
        textAlign: 'center',
        marginTop: '16px',
      }}>
        Be the first to share your thoughts.
      </p>
    </section>
  )
}
