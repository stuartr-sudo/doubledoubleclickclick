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
              Paid AI Visibility Strategy Audit
            </h1>
            <p style={{ 
              fontSize: '1.125rem', 
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              Nothing is free. This is a high-impact, 60-minute session for serious brands ready to dominate AI-powered search.
            </p>
          </div>

          {/* Calendly Embed */}
          <div 
            className="calendly-inline-widget" 
            data-url="https://calendly.com/stuartr-sewo/llm-optimization"
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
              <strong>What is included in this audit:</strong>
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
                60-minute deep-dive strategy session
              </li>
              <li style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>✓</span>
                Comprehensive review of your brand's current AI visibility
              </li>
              <li style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>✓</span>
                Identification of high-value AI referral traffic opportunities
              </li>
              <li style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>✓</span>
                A custom AI Growth Roadmap delivered within 24 hours
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

