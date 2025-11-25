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
              Book Your LLM Optimization Discovery Call
            </h1>
            <p style={{ 
              fontSize: '1.125rem', 
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              Let's discuss how to get your brand discovered by AI and increase your referral traffic.
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
              <strong>What to expect:</strong>
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
                15-minute discovery call
              </li>
              <li style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>✓</span>
                Review your current Ai visibility
              </li>
              <li style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>✓</span>
                Discuss opportunities to increase referral traffic
              </li>
              <li style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>✓</span>
                Get a custom action plan
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

