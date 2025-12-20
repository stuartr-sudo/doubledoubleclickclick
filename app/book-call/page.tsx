'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import SiteHeader from '@/components/SiteHeader'

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

      <SiteHeader />

      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc',
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
            marginTop: '2rem',
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
              A focused 60-minute deep dive into your brand&apos;s AI visibility. We&apos;ll identify gaps, find your highest-value AI questions, and build your ranking roadmap.
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

