'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export default function BookCallPage() {
  useEffect(() => {
    // Track page view
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: 'Book a Call',
        page_location: window.location.href,
      })
    }
  }, [])

  return (
    <>
      {/* Load Calendly widget script */}
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />

      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc',
        paddingTop: '2rem',
        paddingBottom: '2rem',
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 1rem',
        }}>
          {/* Home Button */}
          <div style={{ marginBottom: '1rem' }}>
            <a 
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#ffffff',
                color: '#64748b',
                textDecoration: 'none',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc'
                e.currentTarget.style.borderColor = '#cbd5e1'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
                e.currentTarget.style.borderColor = '#e2e8f0'
              }}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M6.5 12.5L2 8L6.5 3.5M2.5 8H14" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              Back to Home
            </a>
          </div>

          {/* Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '2rem',
          }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 700, 
              marginBottom: '1rem',
              color: '#1e293b',
            }}>
              Paid Ai Strategy & Audit Session
            </h1>
            <p style={{ 
              fontSize: '1.125rem', 
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              A focused 60-minute deep dive into your brand's AI visibility. We'll identify gaps, find your highest-value AI questions, and build your ranking roadmap.
            </p>
          </div>

          <div style={{
            textAlign: 'center',
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: '#eff6ff',
            borderRadius: '12px',
            border: '1px solid #bfdbfe',
          }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#1e40af' }}>
              Investment: $450 (Credentialed clients only. No time-wasters.)
            </p>
          </div>

          {/* Calendly Embed */}
          <div 
            className="calendly-inline-widget" 
            data-url="https://calendly.com/stuartr-sewo/llm-optimization-paid"
            style={{ 
              minWidth: '320px', 
              height: '700px',
            }}
          />
          
          {/* Additional Info */}
          <div style={{ 
            marginTop: '2rem', 
            textAlign: 'center',
            color: '#64748b',
          }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>What you get:</strong>
            </p>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0,
              maxWidth: '600px',
              margin: '0 auto',
              textAlign: 'left',
            }}>
              <li style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>✓</span>
                60-minute high-level strategy intensive
              </li>
              <li style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>✓</span>
                Full audit of your current LLM/AI visibility
              </li>
              <li style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>✓</span>
                Keyword & Question discovery for your category
              </li>
              <li style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>✓</span>
                Actionable 30-day ranking implementation plan
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

